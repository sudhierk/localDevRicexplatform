import React, { Component } from 'react';
import { DOCUMENT_TYPES, getDocInfo } from '../services/documents.service';
import { TradeApi } from '../../../../services/service.api';
import sha256 from 'crypto-js/sha256';
import CryptoJS from 'crypto-js';
import MdClose from 'react-icons/lib/md/close';
import MdCheck from 'react-icons/lib/md/check';
import MdRefresh from 'react-icons/lib/md/refresh';
import moment from 'moment';

const STATUS_VERIFIED = 'verified';
const STATUS_FAILED = 'failed';
const STATUS_IN_PROGRESS = 'in-progress';
const STATUS_NOT_STARTED = 'not-started';
const STATUS_NOT_UPLOADED = 'not-uploaded';

class VerifyDocumentsModal extends Component {
    state = {
        docsToVerify: {}
    };

    componentDidMount() {
        this.setInitialStatuses();
    }

    getLastFile = (document) => {
        const files = document && (document.Files || document.document.Files);
        if (!files) {
            return null;
        }
        return files.slice().sort((a, b) => {
            return moment.utc(a.CreatedAt).diff(moment.utc(b.CreatedAt))
        })[files.length - 1]
    };

    setInitialStatuses() {
        const docs = {};
        if (this.props.invoice) {
            this.setDocumentStatus(this.props.invoice, DOCUMENT_TYPES.INVOICE, docs);
        }
        this.props.shipments.forEach(shipment => {
            const docsByShipment = this.getDocsByShipment(shipment.value.id);
            Object.keys(docsByShipment).forEach(docName => {
                const doc = docsByShipment[docName];
                if (doc) {
                    this.setDocumentStatus(doc, docName, docs, shipment.value.id);
                }
            })
        });
        this.setState({
            docsToVerify: docs
        });
    }

    setDocumentStatus(doc, docName, docs, shipmentId) {
        if (doc) {
            let file = this.getLastFile(doc);
            let fileId = file && file.ID;
            let key = fileId;
            let hash = file.hash;
            if (docName === DOCUMENT_TYPES.BILL) {
                key = `${docName + shipmentId}`;
                file = this.getLastFile(this.props.documents[shipmentId]['BILL']);
                fileId = file && file.ID;
                hash = file && file.hash;
            }
            if (docName === DOCUMENT_TYPES.INVOICE) {
                key = docName;
                file = this.getLastFile(this.props.invoice.document);
                hash = file && file.hash;
            }
            if (key) {
                docs[key] = {
                    status: STATUS_NOT_STARTED,
                    shipmentId: shipmentId,
                    fileId: fileId,
                    name: docName,
                    hash
                }
            }
        }
    }

    verifyDocuments = () => {
        Object.keys(this.state.docsToVerify).forEach(key => {
            const doc = this.state.docsToVerify[key];
            this.setDocStatus(key, STATUS_IN_PROGRESS);
            if (![DOCUMENT_TYPES.BILL, DOCUMENT_TYPES.INVOICE].includes(doc.name)) {
                TradeApi.getDocumentFile(this.props.trade.id, doc.shipmentId, doc.fileId)
                    .then(response => {
                        const wordArray = CryptoJS.lib.WordArray.create(response.data);
                        const hash = sha256(wordArray).toString();
                        this.setDocStatus(key, hash === doc.hash ? STATUS_VERIFIED : STATUS_FAILED);
                    })
                    .catch(error => {
                        console.error(error);
                        this.setDocStatus(key, STATUS_FAILED);
                    });
            }
            if (doc.name === DOCUMENT_TYPES.BILL) {
                const hash = this.getBillHash(this.props.bills[doc.shipmentId]);
                this.setDocStatus(key, hash === doc.hash ? STATUS_VERIFIED : STATUS_FAILED);
            }
            if (doc.name === DOCUMENT_TYPES.INVOICE) {
                const hash = this.getInvoiceHash();
                this.setDocStatus(key, hash === doc.hash ? STATUS_VERIFIED : STATUS_FAILED);
            }
        });
    };

    isVerifying = () => {
        return Object.values(this.state.docsToVerify).findIndex(doc => doc.status === STATUS_IN_PROGRESS) > -1;
    };

    getBillHash(bill) {
        const billText = '' +
            bill.BillNumber +
            bill.ShippingComp +
            bill.Shipper +
            bill.Consignee +
            bill.VessVoyage +
            bill.BookingRef +
            bill.ShipperRef +
            bill.QuantCleanOnBoard +
            bill.FreightsCharges +
            bill.DeclaredValue +
            bill.PlaceIssue +
            bill.DateIssue +
            bill.CarriersAgentsEndorsm +
            bill.NotifyParties +
            bill.PortOfLoad +
            bill.PortOfDischarge +
            bill.PackGoodsDescript +
            bill.Marking +
            bill.CarrierReceipt +
            bill.ShippedOnBoard;
        return sha256(billText).toString();
    }

    getInvoiceHash() {
        const invoice = this.props.invoice;
        return sha256('' + invoice.invoiceNo + invoice.bankRequisites + invoice.totalAmount).toString();
    }

    setDocStatus = (key, status) => {
        this.setState(prevState => ({
            docsToVerify: {
                ...prevState.docsToVerify,
                [key]: {
                    ...prevState.docsToVerify[key],
                    status: status
                }
            }
        }));
    };

    getDocsByShipment = (shipmentId) => {
        const docs = {...this.props.documents[shipmentId]};
        delete docs.BILL;
        delete docs.INVOICE;
        if (this.props.bills[shipmentId]) {
            docs[DOCUMENT_TYPES.BILL] = this.props.bills[shipmentId];
        }
        return docs;
    };

    getDocStatus = (docName, shipmentId, fileId) => {
        const doc = this.state.docsToVerify[fileId] || this.state.docsToVerify[docName] || this.state.docsToVerify[docName + shipmentId];
        return doc ? doc.status : STATUS_NOT_UPLOADED;
    };

    renderStatus = (status) => {
        switch (status) {
            case STATUS_NOT_STARTED:
                return 'Not verified';
            case STATUS_VERIFIED:
                return <MdCheck/>;
            case STATUS_FAILED:
                return <MdClose/>;
            case STATUS_IN_PROGRESS:
                return <MdRefresh/>;
            default:
                return 'File is not uploaded yet';
        }
    };

    renderDocument = (docName, shipmentId = '', docs = {}) => {
        const status = this.getDocStatus(docName, shipmentId, docs[docName] ? this.getLastFile(docs[docName]).ID : null);
        return (
            <div className={`vd-modal__list-item vd-modal__list-item--${status}`} key={docName + shipmentId}>
                <span className="vd-modal__item-name">{getDocInfo(docName, this.props.trade).name}</span>
                <span className={`vd-modal__item-status vd-modal__item-status--${status}`}>
                    {this.renderStatus(status)}
                </span>
            </div>
        )
    };

    renderDocuments = () => {
        return this.props.shipments.map(shipment => {
            const docs = this.getDocsByShipment(shipment.value.id);
            return (
                <div className="vd-modal__list" key={shipment.value.id}>
                    <div className="vd-modal__list-heading">{shipment.label}</div>
                    {Object.keys(docs).map(docName => this.renderDocument(docName, shipment.value.id, docs))}
                </div>
            )
        })
    };

    render() {
        return (
            <div className="modal__container vd-modal">
                <div className="modal__wrapper">
                    <span className="modal__close" onClick={this.props.onClose}/>
                    <h3 className="modal__heading">Verify documents</h3>
                    <div className="vd-modal__list" key="general">
                        <div className="vd-modal__list-heading">General Documents</div>
                        {this.renderDocument(DOCUMENT_TYPES.INVOICE)}
                    </div>
                    {this.renderDocuments()}
                    <button type="button" className="modal__button" disabled={this.isVerifying()}
                            onClick={this.verifyDocuments}>Verify All
                    </button>
                </div>
            </div>
        );
    }
}

export default VerifyDocumentsModal;