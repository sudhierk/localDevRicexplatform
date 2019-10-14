import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { authHeader, getDocumentFileUrl, TradeApi } from '../../../../services/service.api';
import moment from 'moment-timezone';
import { DATEFORMATHOURS } from '../../../../services/service.values';
import { Link } from 'react-router-dom';
import { OpenDocument } from '../../../../modules/module.trade';
import { push } from 'react-router-redux';
import { LoadingStatus } from '../../../../modules/module.loading';
import DocumentaryInstructionsModal from '../modals/modal.documentaryInstructions';
import { DOCUMENT_NAMES } from '../services/documents.service';
import Preloader from '../../../components/preloader/Preloader';

//bol -- Bill of Lading
class AuditLog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: [],
            docInstructionsModal: {
                isOpened: false,
                data: null
            },
            previewDocuments: {
                files: [],
                name: null
            },
            loading: false
        };
        this.openDocumentaryInstructionsModal = this.openDocumentaryInstructionsModal.bind(this);
        this.closeDocInstructionsModal = this.closeDocInstructionsModal.bind(this);
    }

    componentWillMount = () => {
        if (this.props.id) {
            this.setLoading(true);
            TradeApi.smart(this.props.id)
                .log()
                .then(d => {
                    this.setLoading(false);
                    d.data.items.sort(function (a, b) {
                        return new Date(a.date) - new Date(b.date);
                    });
                    this.setState({
                        items: d.data.items.reverse()
                    });
                });
        }

        // this.props.loadRequestDetails(this.props.id);
    };

    setLoading = loading => {
        this.setState(prevState => ({
            ...prevState,
            loading
        }));
    };

    displayActionBy = item => {
        let parts = item.comment.split('@');
        switch (parts[0]) {
            case 'trade.created':
            case 'trade.contract.created':
            case 'trade.signed':
            case 'trade.confirmDocuments':
            case 'trade.instructions':
            case 'trade.advice':
            case 'trade.closed':
                return <span className="audit__overflow">System</span>;
            default:
                return (
                    <span className="audit__overflow">
                        {' '}
                        {item.author}
                        <br/>
                        <small>{item.companyName}</small>
                    </span>
                );
        }
    };

    openDocumentaryInstructionsModal() {
        if (!this.state.docInstructionsModal.data) {
            this.props.LoadingStatus(true);
            TradeApi.smart(this.props.id)
                .getInstructions()
                .then(response => {
                    this.setState({
                        docInstructionsModal: {
                            isOpened: true,
                            data: response.data
                        }
                    })
                })
                .catch(error => {
                    console.error(error);
                    this.props.LoadingStatus(false);
                })
        } else {
            this.setState({
                docInstructionsModal: {
                    ...this.state.docInstructionsModal,
                    isOpened: true
                }
            })
        }
    }

    closeDocInstructionsModal = () => {
        this.setState({
            docInstructionsModal: {
                ...this.state.docInstructionsModal,
                isOpened: false
            }
        })
    };

    openPreviewDocument = (tradeId, shipmentId, files, name) => {
        const previewFiles = files.sort((a, b) => {
            return moment.utc(b.CreatedAt).diff(moment.utc(a.CreatedAt))
        }).slice(0, 2);
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

    getDocumentsLink(docType, text, shipmentId = this.props.trade.shipments[0].id) {
        const docName = DOCUMENT_NAMES[docType];
        return <React.Fragment>
            {(docType === 'DocInstructionsID') ? (
                <a
                    href='#'
                    className="trades-dtls__audit-cell__link trades-dtls__audit-cell__link--underline"
                    onClick={this.openDocumentaryInstructionsModal}
                >
                    {docName}
                </a>
            ) : (
                <Link
                    className="trades-dtls__audit-cell__link trades-dtls__audit-cell__link--underline"
                    to={`/trades/details/${this.props.id}/documents?shipmentId=${shipmentId}`}
                >
                    {docName}
                </Link>
            )}
            {' '}
            {text}
        </React.Fragment>
    }

    displayAction(item) {
        if (item.comment) {
            let parts = item.comment.split('@');
            switch (parts[0]) {
                case 'trade.created':
                    return (
                        <React.Fragment>
                            Trade created from Trade Request{' '}
                            <Link
                                className="trades-dtls__audit-cell__link trades-dtls__audit-cell__link--underline"
                                to={`/requests/details/${parts[1]}`}
                            >
                                {parts[1]}
                            </Link>
                        </React.Fragment>
                    );
                case 'trade.sign':
                    return <React.Fragment> Contract is signed by {item.companyName}</React.Fragment>;
                case 'trade.contract.created':
                    return (
                        <React.Fragment>
                            <Link
                                className="trades-dtls__audit-cell__link trades-dtls__audit-cell__link--underline"
                                to={`/trades/details/${this.props.id}/contract`}
                            >
                                Contract
                            </Link>{' '}
                            is Created
                        </React.Fragment>
                    );
                case 'trade.advice':
                    return <React.Fragment>Trade status changed from Shipping Advice to Documents
                        Required</React.Fragment>;
                case 'trade.instructions':
                    return (
                        <React.Fragment>
                            Trade status changed from
                            <Link className="trades-dtls__audit-cell__link trades-dtls__audit-cell__link--underline"
                                  to={`/trades/details/${this.props.id}/instructions`}>
                                {' '}Documentary Instructions{' '}
                            </Link>
                            Required to Shipping Advice Pending
                        </React.Fragment>
                    );
                case 'trade.documents':
                    return (
                        <React.Fragment>Trade status changed from Shipping Advice Pending to Documents
                            Required</React.Fragment>
                    );
                case 'trade.confirmDocuments':
                    return <React.Fragment>Trade status changed from Documents Required to Payment
                        Required</React.Fragment>;
                case 'trade.close':
                    return <React.Fragment>{item.author} close a trade</React.Fragment>;
                case 'trade.signed':
                    return (
                        <React.Fragment>
                            Contract is signed by all
                        </React.Fragment>
                    );
                case 'trade.payment':
                    return <React.Fragment>{item.author} notifies that payment is done</React.Fragment>;
                case 'trade.acceptPayment':
                    return <React.Fragment>{item.author} viewed payment</React.Fragment>;
                case 'trade.closed':
                    return <React.Fragment>Trade is closed</React.Fragment>;
                case 'trade.vesselNominated':
                    return <React.Fragment>Vessel nomination is created</React.Fragment>;
                case 'trade.vesselAccepted':
                    return <React.Fragment>Vessel nomination is accepted</React.Fragment>;
                case 'trade.vesselNominatedComplete':
                    return <React.Fragment>Vessel nomination is approved</React.Fragment>;
                case 'trade.vesselRejected':
                    return <React.Fragment>Vessel nomination is rejected</React.Fragment>;
                case 'shipment.created':
                    return <React.Fragment>Shipment is created</React.Fragment>
                case 'trade.document.upload': {
                    const docType = parts[1];
                    const shipmentId = (parts[2] && parts[2] !== '0') ? parts[2] : null;
                    return this.getDocumentsLink(docType, 'is filled in', shipmentId);
                }
                case 'trade.document.approve': {
                    const docType = parts[1];
                    const shipmentId = (parts[2] && parts[2] !== '0') ? parts[2] : null;
                    return this.getDocumentsLink(docType, 'is approved', shipmentId);
                }
                case 'trade.document.reject': {
                    const docType = parts[1];
                    const shipmentId = (parts[2] && parts[2] !== '0') ? parts[2] : null;
                    return this.getDocumentsLink(docType, 'is rejected', shipmentId);
                }
                case 'trade.document.releaseForBuyer': {
                    const docType = parts[1];
                    const shipmentId = (parts[2] && parts[2] !== '0') ? parts[2] : null;
                    return this.getDocumentsLink(docType, 'is shared for review with the buyer', shipmentId);
                }
                case 'trade.document.invoice': {
                    const docName = DOCUMENT_NAMES.INVOICE;
                    return (
                        <React.Fragment>
                            <Link
                                className="trades-dtls__audit-cell__link trades-dtls__audit-cell__link--underline"
                                to={`/trades/details/${this.props.id}/documents/invoice/preview`}
                            >
                                {docName}
                            </Link>
                            {' is filled in'}
                        </React.Fragment>
                    )
                }
            }
        }
        return item.comment;
    }

    render() {
        return (
            <div className="trades-dtls__audit-table">
                <Preloader style="swirl" loading={this.state.loading}>
                    <div className="trades-dtls__audit-row trades-dtls__audit-row_heading">
                        <div className="trades-dtls__audit-cell trades-dtls__audit-cell_heading">TxHasg</div>
                        <div className="trades-dtls__audit-cell trades-dtls__audit-cell_heading">Date</div>
                        <div className="trades-dtls__audit-cell trades-dtls__audit-cell_heading">Action</div>
                        <div className="trades-dtls__audit-cell trades-dtls__audit-cell_heading">Action By</div>
                    </div>
                    {this.state.items &&
                    this.state.items.map((k, i) => {
                        return (
                            <div className="trades-dtls__audit-row" key={i}>
                                <div className="trades-dtls__audit-cell">
                                    <span className="audit__overflow">{k.transactionId}</span>
                                </div>
                                <div className="trades-dtls__audit-cell">
                                    <span className="audit__overflow">{moment(k.date).format(DATEFORMATHOURS)}</span>
                                </div>
                                <div className="trades-dtls__audit-cell">
                                    <span className="audit__overflow">{this.displayAction(k)}</span>
                                </div>
                                <div className="trades-dtls__audit-cell">{this.displayActionBy(k)}</div>
                            </div>
                        );
                    })}
                </Preloader>
                {this.state.docInstructionsModal.isOpened && (
                    <DocumentaryInstructionsModal
                        data={this.state.docInstructionsModal.data}
                        previewMode={true}
                        trade={this.props.trade.items.single}
                        onClose={this.closeDocInstructionsModal}
                    />
                )}
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        trade: state.trade,
        documents: state.trade.documents
    };
};

const mapDispatchToProps = dispatch => bindActionCreators({
    OpenDocument,
    navigate: path => push(path),
    LoadingStatus
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(AuditLog);
