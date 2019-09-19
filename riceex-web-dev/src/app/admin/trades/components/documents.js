import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FileUploadModal from './fileUploadModal';
import DocumentCard from './documentCard';
import Select from 'react-select';
import moment from 'moment';
import ReactGA from 'react-ga';
import {
    DOCUMENT_TYPES,
    FILTER_ALL, FILTER_COUNTERPARTY_ACTIONS, FILTER_INSPECTION_COMPANY_ACTIONS, FILTER_MY_ACTIONS,
    getDocInfo,
    getFilteredDocuments, INSPECTION_DOCUMENTS, SELLER_DOCUMENTS
} from '../services/documents.service';
import VerifyDocumentsModal from '../modals/modal.verifyDocuments';
import { authHeader, downloadDocumentFile, getDocumentFileUrl } from '../../../../services/service.api';
import html2pdf from 'html2pdf.js';
import BillOfLading from './documentBill';
import Invoice from './documentInvoice';
import PreviewDocumentsModal from '../modals/modal.previewDocuments';
import RejectDocumentModal from '../modals/modal.rejectDocument';
import 'formdata-polyfill';
import Preloader from '../../../components/preloader/Preloader';

class Documents extends Component {
    state = {
        modal: false, // SHOULD MODAL APPEROR NOT
        name: '', // name of doc to send to back
        docName: '', // doc name to show in modal
        document: {}, // container for document, that we gonna send to back end
        shareDocWithBuyer: false,
        status: '',
        selectedShipment: null,
        filter: null,
        verifyDocsModal: false,
        previewDocuments: null,
        rejectDocumentModal: {
            docName: '',
            show: false,
            documentId: null
        },
        documentToPrint: {
            component: null,
            shipmentId: null,
            id: null
        }
    };

    filterOptions = [
        {
            value: FILTER_ALL,
            label: 'Select',
            emptyText: 'There are no documents to upload yet. Documentary instructions have not been issued.'
        },
        {
            value: FILTER_MY_ACTIONS,
            label: 'My actions',
            emptyText: 'Currently you don\'t have any pending actions'
        },
        {
            value: FILTER_COUNTERPARTY_ACTIONS,
            label: 'Counterparty actions',
            emptyText: 'Currently there are no pending counterparty actions'
        },
        {
            value: FILTER_INSPECTION_COMPANY_ACTIONS,
            label: 'Inspection company actions',
            emptyText: 'Currently there are pending no inspection company actions'
        }
    ];

    get documents() {
        return this.state.selectedShipment
            ? this.props.documents[this.state.selectedShipment.value.id]
            : [];
    }

    get billsOfLadingFilled() {
        let filled = true;
        this.props.shipments.forEach(shipment => {
            if (filled) {
                filled = this.props.bills[shipment.id] && this.props.bills[shipment.id].BillNumber;
            }
        });
        return filled;
    }

    get possibleCommentReceivers() {
        return {
            seller: {
                value: this.props.trade.sellerId,
                label: this.props.trade.seller
            },
            buyer: {
                value: this.props.trade.buyerId,
                label: this.props.trade.buyer
            },
            inspection: {
                value: this.props.trade.inspection,
                label: this.props.trade.inspectionName
            }
        }
    }

    constructor(props) {
        super(props);
        if (props.shipments && props.shipments.length > 0) {
            this.selectShipment(this.getOptionFromShipment(this.props.shipments[0], 0));
        }
        if (props.whoItIs() === 'inspection') {
            this.filterOptions.filter(option => option.value !== FILTER_INSPECTION_COMPANY_ACTIONS);
        }
    }

    componentWillMount() {
        this.setState({
            filter: this.filterOptions[0]
        });
        this.selectInitialShipment();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.locationSearch !== prevProps.locationSearch && this.props.shipments && this.props.shipments.length > 0) {
            const params = new URLSearchParams(this.props.locationSearch);
            const shipmentId = params.get('shipmentId');
            if (shipmentId) {
                this.selectShipmentById(shipmentId);
            }
        }
        this.selectInitialShipment();
    }

    trackAction(action) {
        ReactGA.event({
            category: 'Trade',
            action: action + ' by ' + this.props.whoItIs()
        })
    }

    selectInitialShipment = () => {
        if (!this.state.selectedShipment && this.props.shipments && this.props.shipments.length > 0) {
            let shipmentId = new URLSearchParams(this.props.locationSearch).get('shipmentId');
            if (shipmentId) {
                this.selectShipmentById(shipmentId);
            } else {
                this.selectShipmentByIndex(0);
            }
        }
    };

    selectShipmentByIndex = index => {
        this.selectShipment(this.getOptionFromShipment(this.props.shipments[index], index));
    };

    selectShipmentById = id => {
        const shipments = this.props.shipments;
        const index = shipments.findIndex(shipment => shipment.id === parseInt(id, 10));
        if (index > -1) {
            this.selectShipment(this.getOptionFromShipment(shipments[index], index));
        }
    };

    selectShipment = shipment => {
        this.setState({
            selectedShipment: shipment
        });
        this.props.GetTradeDocuments(this.props.match.params.id, shipment.value.id);
        this.props.GetTradeBill(this.props.match.params.id, shipment.value.id);
        this.props.GetTradeInvoice(this.props.match.params.id);
    };

    getOptionFromShipment = (shipment, index) => {
        const measurement = this.props.trade.measurement === 'TONS' ? 'tons' : 'cwt';
        return {value: shipment, label: `Set ${index + 1} - ${shipment.amount} ${measurement}`};
    };

    handleFilterChange = (filter) => {
        this.setState({
            filter
        });
    };

    renderButton = ({name, info, status, tradeId, shipmentId, documentId}, permissions = {}) => {
        const actions = [];
        if (permissions.canApprove) {
            actions.push(<a key="approve" className="dropdown-item"
                            onClick={() => {
                                this.handleChangeDocStatus(name, this.props.ApproveDocument);
                                this.trackAction(`Approve Document ${name}`)
                            }}>Approve</a>)
        }
        if (permissions.canReject) {
            actions.push(<a key="reject" className="dropdown-item"
                            onClick={() => this.setState({
                                rejectDocumentModal: {
                                    show: true,
                                    docName: name,
                                    documentId
                                }
                            })}>Reject</a>)
        }
        if (permissions.canRelease) {
            actions.push(<a key="release" className="dropdown-item"
                            onClick={() => this.handleChangeDocStatus(name, this.props.ReleaseDocument)}>Release for review to buyer</a>)
        }
        if (permissions.canUpload) {
            actions.push((
                <a key="upload" className="dropdown-item"
                   onClick={() => this.setModal(info, 'upload')}>Upload</a>
            ))
        }
        if (permissions.canFill && this.state.selectedShipment) {
            const bill = this.props.bills[this.state.selectedShipment.value.id];
            const isInvoice = info.url === 'invoice';
            const isFilled = isInvoice ? !!this.props.invoice : !!bill;
            actions.push((
                <Link
                    key="fill"
                    to={
                        isInvoice // if it's invoice
                            ? this.billsOfLadingFilled
                            ? `${this.props.match.url}/documents/${info.url}${this.props.invoice ? '/update' : ''}` // go to Invoice
                            : `${this.props.match.url}/documents` // if BillID is null, stay at this page
                            : `${this.props.match.url}/shipment/${this.state.selectedShipment.value.id}/documents/${info.url}${bill ? '/update' : ''}` // if it not invoice - just pass the correct url
                    }
                    className="dropdown-item"
                >
                    {isFilled ? 'Edit' : 'Fill in'}
                </Link>
            ));
        }
        if (permissions.canDownload) {
            let handler;
            if (name === DOCUMENT_TYPES.BILL) {
                handler = () => this.handleDocExport(BillOfLading, shipmentId, info.name);
            } else if (name === DOCUMENT_TYPES.INVOICE) {
                handler = () => this.handleDocExport(Invoice, shipmentId, info.name);
            } else {
                handler = () => this.handleDocumentDownload(shipmentId, name, info.name);
            }
            actions.push(<a key="download" className="dropdown-item" onClick={handler}>Download</a>)
        }
        if (actions.length === 0) {
            return null;
        }
        const isLoading = this.props.loadingDocuments[name];
        // Blockchain does not support multiple actions in parallel
        const otherLoading = Object.keys(this.props.loadingDocuments).findIndex(key => key !== name && this.props.loadingDocuments[key]) !== -1;
        const btnClass = isLoading ? 'trades-dtls__doc-button disabled' : 'trades-dtls__doc-button dropdown-toggle';
        return (
            <div className="dropdown">
                <button className={btnClass} type="button" id="dropdownMenuButton"
                        data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled={otherLoading}>
                    <Preloader loading={isLoading} style="dots">
                        Actions
                    </Preloader>
                </button>
                <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    {actions}
                </div>
            </div>
        );
    };

    closeRejectModal = () => {
        this.setState({
            rejectDocumentModal: {
                docName: '',
                show: false,
                documentId: null
            }
        });
    };

    handleDocExport = (component, shipmentId, fileName) => {
        let options = {
            margin: [6, 15, 6, 15],
            filename: `${fileName}.pdf`,
            html2canvas: {scale: 3},
            jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'}
        };
        this.setState({
            documentToPrint: {
                id: this.props.trade.id,
                shipmentId,
                component
            }
        });
        html2pdf(document.getElementById('download-as-pdf'), options).then(() => {
            this.setState({
                documentToPrint: null
            });
        });
    };

    handleDocumentDownload = (shipmentId, docName, fileName) => {
        const document = this.props.documents[shipmentId][docName];
        if (!document.Files || document.Files.length === 0) {
            return;
        }
        const fileId = document.Files.slice().sort((a, b) => {
            return moment.utc(a.CreatedAt).diff(moment.utc(b.CreatedAt))
        })[document.Files.length - 1].ID;
        this.trackAction(`Download Document ${docName}`);
        downloadDocumentFile(this.props.trade.id, shipmentId, fileId, fileName);
    };

    handleChangeDocStatus = (docName, dispatcher) => {
        const docID = docName === DOCUMENT_TYPES.INVOICE ? this.props.invoice.document.ID : this.documents[docName].ID;
        dispatcher(this.props.trade.id, this.state.selectedShipment.value.id, docID, docName);
    };

    onDrop = (filesAccept, filesNotAccept, docName) => {
        if (filesAccept.length !== 0) {
            this.setState(prevState => ({
                document: {
                    ...prevState.document,
                    [docName]: filesAccept
                }
            }));
        }
    };

    setModal = (documentInfo, status) => {
        this.setState({
            name: documentInfo.state, // THIS RECEIVED NAME PROP FROM BUTTON, THAT OPEN MODAL
            docName: documentInfo.name, // THIS RECEIVED DOC NAME PROP FROM BUTTON, THAT OPEN MODAL
            modal: !this.state.modal, // set modal OPEN/CLOSE (TRUE/FALSE)
            status: status,
            document: {}, // set all documents to empty
            shareDocWithBuyer: false
        });
    };

    handlePostDoc = e => {
        this.postDoc(this.props.match.params.id, this.state.document[this.state.name][0], e);
    };

    postDoc = (id, doc, e) => {
        e.preventDefault(); // PREVENT LINK DEFAULT BEHAVIOUR
        let newData = new FormData();
        newData.append('upload', doc); // FORMAT TO POST DOC TO BACK
        newData.append('DocType', Object.keys(this.state.document)[0]); // Object keys mean, that we gonna get first key of this.state.document object
        const docName = this.state.name;
        const shareWithBuyer = this.state.shareDocWithBuyer;
        this.props.PostDocumentFile(id, this.state.selectedShipment.value.id, newData, (result) => {
            this.trackAction(`Upload Document ${doc}`);
            if (result && shareWithBuyer) {
                setTimeout(() => this.handleChangeDocStatus(docName, this.props.ReleaseDocument));
            }
        });

        this.setModal({});
    };

    toggleVerifyDocsModal = () => {
        this.setState(prevState => ({
            verifyDocsModal: !prevState.verifyDocsModal
        }));
    };

    openWindow = path => {
        let win = window.open(path, '_blank');
    };

    openPreviewDocument = (tradeId, shipmentId, files, name) => {
        const previewFiles = files.sort((a, b) => {
            return moment.utc(b.CreatedAt).diff(moment.utc(a.CreatedAt))
        }).slice(0, 2);
        this.trackAction(`Review Document ${name}`);
        this.setState({
            previewDocuments: {
                name,
                files: previewFiles.map(file => ({
                    id: file.ID,
                    url: getDocumentFileUrl(tradeId, shipmentId, file.ID),
                    httpHeaders: authHeader().headers
                }))
            }
        });
    };

    closePreviewModal = () => {
        this.setState({
            previewDocuments: null
        });
    };

    getCommentReceivers() {
        const trader = this.props.whoItIs();
        const possibleCommentReceivers = this.possibleCommentReceivers;
        switch (trader) {
            case 'seller':
                return [possibleCommentReceivers.buyer, possibleCommentReceivers.inspection];
            case 'buyer':
                return [possibleCommentReceivers.seller];
            case 'inspection':
                return [possibleCommentReceivers.seller];
        }
    }

    getDocumentAuthor(docName) {
        if (INSPECTION_DOCUMENTS.includes(docName)) {
            return this.props.trade.inspectionName;
        }
        if (SELLER_DOCUMENTS.includes(docName)) {
            return this.props.trade.seller
        }
    }

    renderDocuments = () => {
        if (!this.documents || this.documents.length === 0) {
            return null;
        }
        const bill = this.state.selectedShipment && this.props.bills[this.state.selectedShipment.value.id];
        const documents = {
            [DOCUMENT_TYPES.BILL]: bill ? bill.document : null,
            [DOCUMENT_TYPES.INVOICE]: this.props.invoice ? this.props.invoice.document : null,
            ...this.documents
        };
        const trader = this.props.whoItIs();
        const commentReceivers = this.getCommentReceivers();
        return getFilteredDocuments(this.state.filter.value, trader, documents, this.props.trade).map(({docName, permissions, status, required}) => {
            const documentInfo = getDocInfo(docName, this.props.trade);
            const showBillOfLadingRequired = docName === 'INVOICE' && trader === 'seller' && !this.billsOfLadingFilled;
            let document = documents[docName];
            if (document) {
                document.author = this.getDocumentAuthor(docName);
            }
            let documentId = document ? document.ID : null;
            return (
                <DocumentCard
                    key={this.state.selectedShipment.value.id + docName}
                    documentParams={{
                        tradeId: this.props.trade.id,
                        shipmentId: this.state.selectedShipment.value.id,
                        documentId
                    }}
                    user={this.props.account.user}
                    required={required}
                    comments={this.props.comments[documentId] || {count: 0, data: []}}
                    loadingDocumentComments={this.props.loadingDocumentComments[documentId]}
                    GetDocumentComments={this.props.GetDocumentComments}
                    PostDocumentComment={this.props.PostDocumentComment}
                    commentReceivers={commentReceivers}
                    openPreviewDocument={this.openPreviewDocument}
                    permissions={permissions}
                    renderButton={this.renderButton}
                    status={status}
                    document={document}
                    documentName={docName}
                    match={this.props.match}
                    documentInfo={documentInfo}
                    showBillOfLadingRequired={showBillOfLadingRequired}
                />
            )
        })
    };

    render() {
        // documents var is info about documents from back
        const {shipments} = this.props;
        const shipmentOptions = shipments && shipments.length > 0
            ? shipments.map(this.getOptionFromShipment)
            : [];
        const documentsToRender = this.renderDocuments();
        const PrintComponentWrapper = this.state.documentToPrint ? this.state.documentToPrint.component : null;
        return (
            <div className="trades-dtls__doc">
                <div className="trades-dtls__doc-controls">
                    <div className="trades-dtls__filter">
                        <div className="trades-dtls__filter__label">
                            Select Set:
                        </div>
                        <div className="trades-dtls__filter__select">
                            <Select
                                options={shipmentOptions}
                                value={this.state.selectedShipment}
                                onChange={this.selectShipment}
                            />
                        </div>
                    </div>
                    <div className="trades-dtls__filter">
                        <div className="trades-dtls__filter__label">
                            Pending:
                        </div>
                        <div className="trades-dtls__filter__select">
                            <Select
                                options={this.filterOptions}
                                value={this.state.filter}
                                onChange={this.handleFilterChange}
                            />
                        </div>
                    </div>
                    {Object.keys(this.props.documents).length > 0 && (
                        <button type="button" className="trades-dtls__verify-docs"
                                onClick={this.toggleVerifyDocsModal}>Status</button>
                    )}
                </div>
                <hr/>
                <div className="trades-dtls__doc-navigation">
                    <span>List of required documents</span>
                </div>
                <div className="trades-dtls__doc-wrapper">
                    <Preloader style="swirl" loading={this.props.loadingDocuments.all}>
                        {documentsToRender && documentsToRender.length > 0 ? documentsToRender : (
                            <div>{this.state.filter.emptyText}</div>
                        )}
                    </Preloader>
                </div>
                <FileUploadModal
                    visibility={this.state.modal}
                    onDrop={(filesAccept, filesNotAccept, docName) => this.onDrop(filesAccept, filesNotAccept, docName)}
                    onShareChange={this.props.whoItIs() === 'seller' ? e => this.setState({shareDocWithBuyer: e.target.checked}) : null}
                    shareWithBuyer={this.state.shareDocWithBuyer || false}
                    close={this.setModal}
                    name={this.state.name}
                    docName={this.state.docName}
                    file={this.state.document[this.state.name]}
                    postDoc={this.handlePostDoc}
                    accept={'application/pdf'}
                />
                {this.state.verifyDocsModal && (
                    <VerifyDocumentsModal
                        trade={this.props.trade}
                        documents={this.props.documents}
                        bills={this.props.bills}
                        invoice={this.props.invoice}
                        shipments={shipmentOptions}
                        onClose={this.toggleVerifyDocsModal}
                    />
                )}
                {this.state.previewDocuments && this.state.previewDocuments.files.length > 0 && (
                    <PreviewDocumentsModal
                        files={this.state.previewDocuments.files}
                        name={this.state.previewDocuments.name}
                        onClose={this.closePreviewModal}
                    />
                )}
                {this.state.rejectDocumentModal.show && (
                    <RejectDocumentModal
                        onClose={this.closeRejectModal}
                        onSubmit={text => {
                            const role = this.props.whoItIs();
                            const receiver = role === 'buyer'
                                ? this.possibleCommentReceivers.seller.value
                                : INSPECTION_DOCUMENTS.includes(this.state.rejectDocumentModal.docName)
                                    ? this.possibleCommentReceivers.inspection.value
                                    : this.possibleCommentReceivers.buyer.value;
                            this.props.PostDocumentComment(
                                this.props.trade.id,
                                this.state.selectedShipment.value.id,
                                this.state.rejectDocumentModal.documentId,
                                {text, receiver}
                            );
                            this.trackAction(`Reject Document ${this.state.rejectDocumentModal.docName}`);
                            this.handleChangeDocStatus(this.state.rejectDocumentModal.docName, this.props.RejectDocument);
                            this.closeRejectModal();
                        }}
                    />
                )}
                <div id="download-as-pdf">
                    {PrintComponentWrapper && (
                        <PrintComponentWrapper
                            id={this.state.documentToPrint.id}
                            shipmentId={this.state.documentToPrint.shipmentId}
                            isPrint={true}
                            isPreview={true}
                        />
                    )}
                </div>
            </div>
        );
    }
}

export default Documents;
