import React, { Component } from 'react';
import { Route, NavLink } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import moment from 'moment';
import flatten from 'lodash/flatten';
import ReactGA from 'react-ga';
import {
    loadRequestDetails,
    LoadRequestInfo,
    GetTradeDocuments,
    GetTradeInvoice,
    PostTradeDocument,
    PostTradeDocumentInvoice,
    UpdateDocument,
    PostDocumentFile,
    OpenDocument,
    PayStatusFlow,
    SmartTrade,
    updateSignedLocaly,
    updatePayedLocaly,
    UpdateTradeDocumentLocaly,
    updateVesselNominated,
    UpdateCloseLocally,
    sendShippingAdvice,
    sendInstructions,
    GetInspectionReports,
    PostInspectionReport,
    preloadInspectionCompanies,
    GetShipments,
    GetTradeBill,
    ApproveDocument,
    RejectDocument,
    ReleaseDocument,
    GetDocumentComments,
    PostDocumentComment,
    getDocInstructions,
    ClearTradeState, SetTradeStatus, UpdateRequest
} from '../../../modules/module.trade';

import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';
import './trades.css';
import './modals.css';

//COMPONENTS
import Contract from './components/contract';
import Documents from './components/documents';
import AuditLog from './components/auditlog';
import Info from './components/info';

import Invoice from './components/documentInvoice';
import BillOfLading from './components/documentBill';
import { DATEFORMAT, STEPS, TRADE_STATUS } from '../../../services/service.values';

import { TradeApi } from '../../../services/service.api';
import DocumentaryInstructions from './components/documentDocInst';
import { ControlBar } from './components/trade.controlbar';
import { LoadingStatus } from '../../../modules/module.loading';
import { Link } from 'react-router-dom';
import DocumentaryInstructionsModal from './modals/modal.documentaryInstructions';
import { approveNominatedVessel, nominateVessel } from './modals/modal.vessel';
import InspectionReports from './components/inspectionReports/inspectionReports';
import AccessControl, { INSPECTION_COMPANY } from '../../components/AccessControl';
import Dropzone from 'react-dropzone';
import JSEncrypt from 'jsencrypt';
import sha256 from 'crypto-js/sha256';
import Preloader from '../../components/preloader/Preloader';
import ShippingAdvice from './components/documentShippingAdvice';

class TradesDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            modal: '',
            modalData: {},
            input: '',
            vesselNomination: '',
            vesselDateFrom: null,
            vesselDateTo: null,
            vesselInspector: null,
            showVesselError: false,
            vesselName: '',
            disabled: false,
            disabledPending: false,
            documentaryInstructions: {
                text: '',
                markings: '',
                multipleSets: false,
                packingAndMarkings: '',
                instructions: [],
                billOfLading: {
                    notify: '',
                    consignee: ''
                },
                certificateOfOrigin: {
                    notify: '',
                    consignee: '',
                    sameAsBillOfLading: true
                }
            },
            signatureModal: {
                file: null,
                privateKey: null,
                loading: false
            }
        };
    }

    componentWillMount = () => {
        this.loadTradeData();
    };

    componentWillUnmount = () => {
        this.props.ClearTradeState();
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const params = new URLSearchParams(window.location.search);
        const forceUpdateParam = params.get('forceUpdate');
        if (forceUpdateParam) {
            const forceUpdate = forceUpdateParam === 'true';
            if (forceUpdate) {
                this.loadTradeData();
            }
            const newLocationSearch = this.props.locationSearch.replace(/(&|\\?)forceUpdate=(true|false)/g, '');
            this.props.navigate(window.location.pathname + newLocationSearch);
        }
        if (prevProps.match.params.id !== this.props.match.params.id) {
            this.props.ClearTradeState();
            this.loadTradeData();
        }
    }

    trackUserAction(action) {
        ReactGA.event({
            category: 'Trade',
            action: action + ' by ' + this.whoItIs()
        });
    }

    loadTradeData = () => {
        this.props.preloadInspectionCompanies();
        this.props.loadRequestDetails(this.props.match.params.id);
        this.props.LoadRequestInfo(this.props.match.params.id);
        this.props.GetInspectionReports(this.props.match.params.id);
        this.props.GetShipments(this.props.match.params.id);
        this.props.GetTradeInvoice(this.props.match.params.id);
        this.props.getDocInstructions(this.props.match.params.id);
    };

    returnStatusNumber = status => {
        if (status === 'CLOSED' || status === 'CLOSING') {
            return 8;//TODO: What is this? Refactor
        }
        if (status === TRADE_STATUS.PAYMENT) {
            status = TRADE_STATUS.DOCUMENTS;
        }
        return STEPS.indexOf(status) + 1; //TODO: Why +1/
    };

    returnStatusCompletement = (step, status) => {
        if (status === TRADE_STATUS.PAYMENT) {
            status = TRADE_STATUS.DOCUMENTS;
        }
        if (step === TRADE_STATUS.PAYMENT) {
            step = TRADE_STATUS.DOCUMENTS;
        }
        if (status === 'CLOSED') {
            return 'trades-dtls__status-stage_completed';
        }
        if (STEPS.indexOf(step) < STEPS.indexOf(status)) {
            return 'trades-dtls__status-stage_completed';
        } else if (step === status && status !== 'CLOSED') {
            return ' trades-dtls__status-stage_current';
        }
    };

    get trade() {
        return this.props.trade.items.single;
    }

    get tradeStatus() {
        const trade = this.trade;
        return (trade && TRADE_STATUS[trade.status]) || 'DEAL';
    }

    postInstructionsStatus = params => {
        this.props.LoadingStatus(true);
        TradeApi.smart(this.props.match.params.id)
            .instructions(params)
            .then(r => {
                this.props.LoadingStatus(false);
                this.updateTradeStatus(r.data.status);
                this.props.UpdateRequest({
                    destPort: params.destPort,
                    destCountry: params.destCountry
                });
                this.props.getDocInstructions(this.props.match.params.id);
                this.props.sendInstructions(params.text);
                this.trackUserAction('Documentary instructions sent');
            })
            .catch(() => this.props.LoadingStatus(false));
    };

    postNominateVesselStatus = () => {
        this.props.LoadingStatus(true);
        const params = {
            message: this.state.vesselNomination,
            laycanDateFrom: this.state.vesselDateFrom,
            laycanDateTo: this.state.vesselDateTo,
            name: this.state.vesselName
        };
        if (this.state.vesselInspector !== null && this.state.vesselInspector !== '' && this.state.vesselInspector !== undefined) {
            params.inspectionCompanyId = parseInt(this.state.vesselInspector, 10);
        }
        TradeApi.smart(this.props.match.params.id)
            .nominateVessel(params)
            .then(r => {
                this.props.LoadingStatus(false);
                this.props.updateVesselNominated(true);
                this.updateTradeStatus(r.data.status);
                this.trackUserAction('Vessel Nominated');
            })
            .catch(() => this.props.LoadingStatus(false));
    };

    postAcceptVesselStatus = (inspectionCompanyId) => {
        this.props.LoadingStatus(true);
        TradeApi.smart(this.props.match.params.id)
            .vesselAccept({inspectionCompanyId})
            .then(r => {
                this.props.LoadingStatus(false);
                this.updateTradeStatus(r.data.status);
                this.trackUserAction('Vessel Nomination Accepted');
                if (r.data.status === 'VESSEL_NOMINATED') {
                    this.props.updateVesselNominated(false);
                }
            })
            .catch(() => {
                this.props.LoadingStatus(false);
            });
    };

    postRejectVesselStatus = () => {
        this.props.LoadingStatus(true);
        TradeApi.smart(this.props.match.params.id)
            .vesselReject()
            .then(r => {
                this.updateTradeStatus(r.data.status);
                this.props.updateVesselNominated(false);
                this.props.LoadingStatus(false);
                this.trackUserAction('Vessel Nomination Rejected');
            })
            .catch(() => {
                this.props.LoadingStatus(false);
            });
    };


    postAdviceStatus = params => {
        this.props.LoadingStatus(true);
        TradeApi.smart(this.props.match.params.id)
            .advice(params)
            .then(r => {
                this.props.LoadingStatus(false);
                this.updateTradeStatus(r.data.status);
                this.props.sendShippingAdvice(this.props.account.user.name);
                this.trackUserAction('Shipping Advice Sent');
            })
            .catch(() => this.props.LoadingStatus(false));
    };

    whoItIs = () => {
        if (this.props.account.user.companyType === 'INSPECTION') {
            return 'inspection';
        }
        return this.props.account.token.companyId === this.props.trade.requestInfo.sellerId ? 'seller' : 'buyer';
    };

    updateTradeStatus = (status) => {
        this.props.SetTradeStatus(status);
    };

    updateVessel = (vessel) => {
        if (vessel) {
            this.setState({
                vesselNomination: vessel.message,
                vesselDateFrom: vessel.laycanDateFrom,
                vesselDateTo: vessel.laycanDateTo,
                vesselInspector: vessel.inspectionCompanyId,
                vesselName: vessel.name
            });
        }
    };

    openModal = (name, data) => {
        this.setState({showModal: true, modal: name, modalData: data});
    };

    closeModal = () => {
        this.setState({
            showModal: false,
            modal: '',
            input: '',
            vesselNomination: '',
            vesselDateFrom: '',
            vesselDateTo: '',
            vesselInspector: '',
            vesselName: '',
            showVesselError: false,
            modalData: {},
            signatureModal: {}
        });
    };

    renderStatusButton = status => {
        let bar;
        switch (status) {
            case TRADE_STATUS.DEAL:
                bar = ControlBar.Deal(
                    this.props.trade,
                    this.whoItIs(),
                    () => {
                        this.openModal(TRADE_STATUS.DEAL);
                    },
                    this.props.loadingStatus
                );
                break;
            case TRADE_STATUS.SIGNED:
                bar = ControlBar.VesselBar(
                    this.props.trade.items.single,
                    this.props.trade.requestInfo,
                    () => {
                        this.openModal('NOMINATE')
                    },
                    () => {
                        TradeApi.smart(this.props.match.params.id)
                            .vesselMessage()
                            .then(r => {
                                this.updateVessel(r.data && r.data.vesselNomination);
                                this.openModal('NOMINATE_ACCEPTING');
                            });
                    },
                    this.props.loadingStatus
                );
                break;
            case TRADE_STATUS.VESSEL_NOMINATED:
                bar = ControlBar.DocInst(
                    this.props.trade, () => this.openModal(TRADE_STATUS.VESSEL_NOMINATED),
                    this.props.loadingStatus
                );
                break;
            case TRADE_STATUS.INSTRUCTIONS:
                bar = ControlBar.ShippingAdvice(
                    this.props.trade, () => this.openModal(TRADE_STATUS.INSTRUCTIONS),
                    this.props.loadingStatus
                );
                break;
            case TRADE_STATUS.ADVICE:
                const documents = [
                    ...flatten(Object.values(this.props.trade.shipmentDocuments).map(value => Object.values(value))),
                    this.props.trade.invoice,
                    ...Object.values(this.props.trade.bills).map(bill => bill.BillNumber ? bill : null)
                ];

                if (Object.values(documents).includes(null)) {
                    bar = ControlBar.DocumentsFill(`${this.props.match.url}/documents`);
                } else {
                    bar = ControlBar.DocumentsFull(`${this.props.match.url}/documents`, this.props.loadingStatus);
                }
                break;
            case TRADE_STATUS.DOCUMENTS:
                bar = ControlBar.PaymentRequired(
                    this.props.trade,
                    payment => {
                        if (payment) {
                            this.openModal(TRADE_STATUS.DOCUMENTS);
                        } else {
                            this.openModal(TRADE_STATUS.PAYED);
                        }
                    },
                    this.props.loadingStatus
                );
                break;
            case TRADE_STATUS.PAYMENT:
                bar = ControlBar.PaymentRequired(
                    this.props.trade,
                    payment => {
                        this.openModal(TRADE_STATUS.PAYED);
                    },
                    this.props.loadingStatus
                );
                break;
            case TRADE_STATUS.PAYED:
                bar = ControlBar.Wait();
                if (moment(this.props.trade.items.single.completionAt).diff(moment(), 'days') <= 0) {
                    this.props.trade.items.single.status === TRADE_STATUS.PAYED && this.updateTradeStatus('CLOSING');
                }
                break;
            case TRADE_STATUS.CLOSING:
                bar = ControlBar.Close(
                    () => {
                        this.props.LoadingStatus(true);
                        TradeApi.smart(this.props.match.params.id)
                            .closeTrade()
                            .then(r => {
                                this.props.LoadingStatus(false);
                                this.props.UpdateCloseLocally(this.whoItIs());
                                if (r.data.status === TRADE_STATUS.PAYED && moment(this.props.trade.items.single.completionAt).diff(moment(), 'days') <= 0) {
                                    this.updateTradeStatus('CLOSING');
                                } else {
                                    this.updateTradeStatus(r.data.status);
                                }
                            });
                    },
                    this.props.loadingStatus,
                    this.whoItIs(),
                    this.props.trade
                );
                break;
        }

        if (bar) {
            return this.whoItIs() === 'buyer' ? bar.Buyer() : bar.Seller();
        }
    };

    signContract = () => {
        const text = document.getElementById('contract-text').innerText;
        const sign = new JSEncrypt();
        sign.setPrivateKey(this.state.signatureModal.privateKey);
        const signature = sign.sign(text, sha256, 'sha256');
        if (!signature) {
            this.setState(prevState => ({
                ...prevState,
                signatureModal: {
                    ...prevState.signatureModal,
                    loading: false,
                    error: 'File type is not supported. Make sure you are uploading your private key file.'
                }
            }));
            return
        }
        this.setState(prevState => ({
            ...prevState,
            signatureModal: {
                ...prevState.signatureModal,
                error: '',
                loading: true
            }
        }));
        this.props.Sign(this.props.match.params.id, {signature, text}, d => {
            if (d) {
                this.closeModal();
                this.props.updateSignedLocaly(this.whoItIs());
                this.trackUserAction('Sign Contract');

                this.setState({
                    status: TRADE_STATUS[d.status]
                });
            } else {
                this.setState(prevState => ({
                    ...prevState,
                    signatureModal: {
                        ...prevState.signatureModal,
                        loading: false,
                        error: 'Uploaded private key does not belong to your account, please provide your key.'
                    }
                }))
            }
        });
    };

    onKeyFileDrop = (filesAccept, filesNotAccept) => {
        const reader = new FileReader();
        const file = filesAccept[0];
        this.setState(prevState => ({
            ...prevState,
            signatureModal: {
                file,
                loading: true,
                privateKey: ''
            }
        }));
        reader.onloadend = event => {
            this.setState(prevState => ({
                ...prevState,
                signatureModal: {
                    ...prevState.signatureModal,
                    privateKey: atob(event.target.result.replace('data:text/plain;base64,', '')),
                    loading: false
                }
            }));
        };
        try {
            reader.readAsDataURL(file);
        } catch (error) {
            this.setState(prevState => ({
                ...prevState,
                signatureModal: {
                    ...prevState.signatureModal,
                    loading: false,
                    error: 'File type is not supported. Make sure you are uploading your private key file.'
                }
            }))
        }
    };

    renderModal = (whatModal) => {
        switch (whatModal) {
            case TRADE_STATUS.DEAL:
                return (
                    <div className="modal__container">
                        <form className="modal__wrapper" onSubmit={(e) => {
                            e.preventDefault();
                            if (!this.state.signatureModal.privateKey) {
                                return;
                            }
                            this.signContract();
                        }}>
                            {!this.state.signatureModal.loading && <span className="modal__close" onClick={this.closeModal}/>}
                            <h3 className="modal__heading">Sign Contract</h3>
                            <div className="modal__line mb-4 justify-content-center">
                                <Dropzone
                                    className="upload"
                                    activeClassName="upload__active"
                                    accept={'text/plain'}
                                    onDrop={(filesAccept, filesNotAccept) => this.onKeyFileDrop(filesAccept, filesNotAccept)}
                                >
                                    {this.state.signatureModal.file ? <p>{this.state.signatureModal.file.name}</p> :
                                        <p>Choose Keys File (or Drop)</p>}
                                </Dropzone>
                            </div>
                            {this.state.signatureModal.error && (
                                <div className="mb-4 text-danger justify-content-center d-flex">
                                    {this.state.signatureModal.error}
                                </div>
                            )}
                            <button type="submit" disabled={!this.state.signatureModal.privateKey}
                                    className="modal__button">
                                <Preloader style="dots" loading={this.state.signatureModal.loading}>
                                    Upload Keys File
                                </Preloader>
                            </button>
                        </form>
                    </div>
                );
            case TRADE_STATUS.PAYED:
                return (
                    <div className="modal__container">
                        <form
                            className="modal__wrapper"
                            onSubmit={e => {
                                e.preventDefault();
                                this.closeModal();
                                this.props.LoadingStatus(true);
                                TradeApi.smart(this.props.match.params.id)
                                    .confirmPayment()
                                    .then(r => {
                                        this.props.LoadingStatus(false);
                                        this.updateTradeStatus(TRADE_STATUS.PAYED);
                                        this.trackUserAction('Payment Confirmed');
                                    });
                            }}>
                            <span className="modal__close" onClick={this.closeModal}/>
                            <h3 className="modal__heading">View Payment</h3>
                            <textarea
                                className="modal__textarea"
                                value={this.trade.paymentComment}
                                disabled
                            />
                            <button type="submit" className="modal__button">
                                Submit
                            </button>
                        </form>
                    </div>
                );
            case TRADE_STATUS.DOCUMENTS:
                return (
                    <div className="modal__container">
                        <form
                            className="modal__wrapper"
                            onSubmit={e => {
                                e.preventDefault();
                                this.closeModal();
                                this.props.LoadingStatus(true);
                                TradeApi.smart(this.props.match.params.id)
                                    .processPayment(this.state.input)
                                    .then(r => {
                                        this.props.updatePayedLocaly();
                                        this.props.LoadingStatus(true);
                                        this.updateTradeStatus(r.data.status);
                                    });
                            }}>
                            <span className="modal__close" onClick={this.closeModal}/>
                            <h3 className="modal__heading">Payment Notification</h3>
                            <textarea
                                onChange={e => this.setState({input: e.target.value})}
                                className="modal__textarea"
                                placeholder="Your payment notification"
                                required
                            />
                            <button type="submit" className="modal__button">
                                Submit
                            </button>
                        </form>
                    </div>
                );

            case 'NOMINATE':
                return nominateVessel({
                    dateFrom: this.state.vesselDateFrom || null,
                    dateTo: this.state.vesselDateTo || null,
                    name: this.state.vesselName || '',
                    inspector: this.trade.inspection,
                    inspectors: this.props.trade.inspections,
                    onClose: this.closeModal,
                    isSeller: this.whoItIs() === 'seller',
                    showError: this.state.showVesselError,
                    updateMessage: e => this.setState({vesselNomination: e.target.value}),
                    updateDateFrom: date => this.setState({vesselDateFrom: date}),
                    updateDateTo: date => this.setState({vesselDateTo: date}),
                    onSelectInspection: (inspectionCompanyId) => {
                        this.setState({vesselInspector: parseInt(inspectionCompanyId, 10)})
                    },
                    onChangeName: name => this.setState({vesselName: name}),
                    onSubmit: (e) => {
                        e.preventDefault();
                        const form = e.target;
                        const isValid = form.checkValidity();
                        if (!isValid) {
                            this.setState({showVesselError: true});
                            form.reportValidity();
                            return;
                        }
                        this.postNominateVesselStatus();
                        this.closeModal();
                    }
                });
            case 'NOMINATE_ACCEPTING':
                return approveNominatedVessel({
                    inspectors: this.props.trade.inspections,
                    inspector: this.trade.inspection,
                    name: this.state.vesselName,
                    nomination: this.state.vesselNomination,
                    dateFrom: this.state.vesselDateFrom,
                    dateTo: this.state.vesselDateTo,
                    onClose: this.closeModal,
                    showError: this.state.showVesselError,
                    onSelectInspection: (inspectionCompanyId) => {
                        this.setState({vesselInspector: parseInt(inspectionCompanyId, 10)})
                    },
                    onApprove: (e) => {
                        e.preventDefault();
                        const form = e.target;
                        const isValid = form.checkValidity();
                        if (!isValid) {
                            this.setState({showVesselError: true});
                            form.reportValidity();
                            return;
                        }
                        this.postAcceptVesselStatus(this.state.vesselInspector);
                        this.closeModal();
                    },
                    onReject: () => {
                        this.postRejectVesselStatus();
                        this.closeModal();
                    },
                });
            case TRADE_STATUS.VESSEL_NOMINATED:
                return (
                    <DocumentaryInstructionsModal
                        trade={this.trade}
                        onClose={this.closeModal}
                        onSubmit={params => {
                            this.closeModal();
                            this.postInstructionsStatus(params);
                        }}
                    />
                );
            case TRADE_STATUS.INSTRUCTIONS:
                const {trade} = this.props;
                const ti = trade.items.single;
                const bills = trade.bills;
                let billsOfLadingFilled = true;
                for (let i = 0; i < trade.shipments.length; i++) {
                    const bill = bills[trade.shipments[i].id];
                    if (!bill || !bill.document || !bill.BillNumber) {
                        billsOfLadingFilled = false;
                        break;
                    }
                }
                if (!billsOfLadingFilled) {
                    return (
                        <div className="modal__container">
                            <form className="modal__wrapper modal__wrapper--fill">
                                <span className="modal__close" onClick={this.closeModal}/>
                                <h1 className="text-center">Please Fill In Bill Of
                                    Lading{trade.shipments.length > 1 ? ' for all sets' : ''} first!</h1>
                                <div
                                    onClick={() => {
                                        this.props.navigateDocs(this.props.match.params.id);
                                        this.closeModal();
                                    }}
                                    className="modal__button"
                                >
                                    Go to documents
                                </div>
                            </form>
                        </div>
                    );
                } else {
                    return (
                        <div className="modal__container">
                            <form className="modal__wrapper">
                                <span className="modal__close" onClick={this.closeModal}/>
                                <h3 className="modal__heading">Shipping Advice</h3>
                                <ShippingAdvice
                                    bills={bills}
                                    trade={ti}
                                    status={this.tradeStatus}
                                    userName={this.props.trade.requestInfo.sellerUserName}
                                    isModal={true}
                                />
                                <button
                                    type="submit"
                                    className="modal__button"
                                    onClick={e => {
                                        e.preventDefault();
                                        const postData = {
                                            text: JSON.stringify(this.props.trade.shipments.map(shipment => ({
                                                text: document.getElementById(`shipment-advice-text-${shipment.id}`).innerText,
                                                shipmentId: shipment.id
                                            })))
                                        };
                                        this.postAdviceStatus(postData);
                                        this.closeModal();
                                    }}
                                    required
                                >
                                    Submit
                                </button>
                            </form>
                        </div>
                    );
                }

            default:
                break;
        }
    };

    render() {
        let trade = this.props.trade.items.single;
        let info = this.props.trade.requestInfo;
        let user = this.props.account.user;
        let company = this.props.company;
        let documents = this.props.trade.documents;

        let status = this.tradeStatus;
        return (
            <React.Fragment>
                <Header/>
                <Preloader style="overflow-spinner" loading={this.props.loadingRequest || !trade || !info} />
                {trade && info ? (
                    <div className="container-fluid trades-dtls__padding-fix">
                        {this.state.showModal && this.renderModal(this.state.modal)}
                        <div className="trades-dtls">
                            <Link to="/trades">
                                <div className="trades-dtls__back">Back</div>
                            </Link>
                            <div className="trades-dtls__header">
                                <div className="row">
                                    <span className="trades-dtls__id">ID{trade.id}</span>
                                    <span
                                        className="trades-dtls__date">Creation Date {moment(trade.createdAt).format(DATEFORMAT)}</span>
                                    <AccessControl user={this.props.account.user} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                                        <span className="trades-dtls__price ml-auto">${trade.price}</span>
                                    </AccessControl>
                                </div>
                                <div className="row mt-2">
                                    <div className="col-md-4 col-sm-5 col-12 flex-column">
                                        <div className="trades-dtls__buyer">{trade.buyer} ({trade.buyerId})</div>
                                        <div className="trades-dtls__seller">{trade.seller} ({trade.sellerId})</div>
                                    </div>
                                    <div className="col-md-8 col-sm-7 col-12">
                                        <div className="trades-dtls__buttons-wrapper">
                                            <AccessControl user={this.props.account.user} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                                                {this.renderStatusButton(status)}
                                            </AccessControl>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mt-2">
                                    <div className="trades-dtls__status-wrapper">
                                        <span
                                            className={`trades-dtls__status-line trades-dtls__status-line_${this.returnStatusNumber(status)}`}/>
                                        <div className={`trades-dtls__status-stage ${this.returnStatusCompletement(
                                            TRADE_STATUS.DEAL,
                                            status
                                        )}`}>
                                            Pending Signature
                                        </div>
                                        <div
                                            className={`trades-dtls__status-stage ${this.returnStatusCompletement(
                                                TRADE_STATUS.SIGNED,
                                                status
                                            )}`}>
                                            Vessel Nomination
                                        </div>
                                        <div
                                            className={`trades-dtls__status-stage ${this.returnStatusCompletement(
                                                TRADE_STATUS.VESSEL_NOMINATED,
                                                status
                                            )}`}>
                                            Documentary instructions required
                                        </div>
                                        <div
                                            className={`trades-dtls__status-stage ${this.returnStatusCompletement(
                                                TRADE_STATUS.INSTRUCTIONS,
                                                status
                                            )}`}>
                                            Shipping advice pending
                                        </div>
                                        <div
                                            className={`trades-dtls__status-stage ${this.returnStatusCompletement(
                                                TRADE_STATUS.ADVICE,
                                                status
                                            )}`}>
                                            Documents required
                                        </div>
                                        <div
                                            className={`trades-dtls__status-stage ${this.returnStatusCompletement(
                                                TRADE_STATUS.DOCUMENTS,
                                                status
                                            )}`}>
                                            Payment required
                                        </div>
                                        <div
                                            className={`trades-dtls__status-stage ${this.returnStatusCompletement(
                                                TRADE_STATUS.PAYED,
                                                status
                                            )}`}>
                                            Pending Completion
                                        </div>
                                        <div
                                            className={`trades-dtls__status-stage ${this.returnStatusCompletement(
                                                TRADE_STATUS.CLOSED,
                                                status
                                            )}`}>
                                            Closed
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="trades-dtls__info">
                                <div className="trades-dtls__tabs">
                                    <NavLink
                                        exact
                                        to={`/trades/details/${this.props.match.params.id}`}
                                        className="trades-dtls__tab trades-dtls__tab_active"
                                    >
                                        General Info
                                    </NavLink>
                                    <NavLink to={`/trades/details/${this.props.match.params.id}/contract`}
                                             className="trades-dtls__tab">
                                        Contract
                                    </NavLink>
                                    <NavLink to={`/trades/details/${this.props.match.params.id}/instructions`}
                                             className="trades-dtls__tab">
                                        Documentary Instructions
                                    </NavLink>
                                    <NavLink to={`/trades/details/${this.props.match.params.id}/advice`}
                                             className="trades-dtls__tab">
                                        Shipping Advice
                                    </NavLink>
                                    <NavLink to={`/trades/details/${this.props.match.params.id}/documents`}
                                             className="trades-dtls__tab">
                                        Documents
                                    </NavLink>
                                    <NavLink to={`/trades/details/${this.props.match.params.id}/inspection-reports`}
                                             className="trades-dtls__tab">
                                        Inspection Reports
                                    </NavLink>
                                    <AccessControl user={this.props.account.user} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                                        <NavLink to={`/trades/details/${this.props.match.params.id}/audit`}
                                                 className="trades-dtls__tab">
                                            Audit Log
                                        </NavLink>
                                    </AccessControl>
                                </div>
                            </div>
                            <div id="contract-text" style={{display: 'none'}}>
                                <Contract trade={trade} info={info} user={user}/>
                            </div>
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}`}
                                render={() => <Info trade={trade} info={info} user={user}/>}
                            />
                            <Route
                                path={`/trades/details/${this.props.match.params.id}/contract`}
                                render={() => <Contract trade={trade} info={info} user={user}/>}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/documents`}
                                render={() => (
                                    <Documents
                                        UpdateDocument={(id, shipmentId, params) =>
                                            this.props.UpdateDocument(id, shipmentId, params)
                                        }
                                        OpenDocument={(id, fileId, newTab) => this.props.OpenDocument(id, fileId, newTab)}
                                        PostDocumentFile={this.props.PostDocumentFile}
                                        GetTradeInvoice={this.props.GetTradeInvoice}
                                        GetTradeDocuments={this.props.GetTradeDocuments}
                                        GetTradeBill={this.props.GetTradeBill}
                                        ApproveDocument={this.props.ApproveDocument}
                                        RejectDocument={this.props.RejectDocument}
                                        ReleaseDocument={this.props.ReleaseDocument}
                                        GetDocumentComments={this.props.GetDocumentComments}
                                        PostDocumentComment={this.props.PostDocumentComment}
                                        loadingDocumentComments={this.props.loadingDocumentComments}
                                        comments={this.props.trade.documentComments}
                                        shipments={this.props.trade.shipments}
                                        state={this.state.billOfLading}
                                        bills={this.props.trade.bills}
                                        invoice={this.props.trade.invoice}
                                        trade={trade}
                                        info={info}
                                        account={this.props.account}
                                        company={company}
                                        documents={this.props.trade.shipmentDocuments}
                                        match={this.props.match}
                                        whoItIs={() => this.whoItIs()}
                                        tradeStatus={status}
                                        loadingDocuments={this.props.loadingDocuments}
                                        locationSearch={window.location.search}
                                    />
                                )}
                            />
                            <Route
                                path={`/trades/details/${this.props.match.params.id}/audit`}
                                render={() => {
                                    return <AuditLog id={this.props.match.params.id}/>;
                                }}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/documents/invoice`}
                                render={(props) => <Invoice id={this.props.match.params.id}
                                                            isPreview={false}/>}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/documents/invoice/update`}
                                render={(props) => <Invoice id={this.props.match.params.id}
                                                            isUpdate={true}/>}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/documents/invoice/preview`}
                                render={(props) => <Invoice id={this.props.match.params.id}
                                                            isPreview={true}/>}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/shipment/:shipmentId/documents/bill`}
                                render={(props) => <BillOfLading id={this.props.match.params.id}
                                                                 shipmentId={props.match.params.shipmentId}
                                                                 isPreview={false}/>}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/shipment/:shipmentId/documents/bill/preview`}
                                render={(props) => <BillOfLading id={this.props.match.params.id}
                                                                 shipmentId={props.match.params.shipmentId}
                                                                 isPreview={true}/>}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/shipment/:shipmentId/documents/bill/update`}
                                render={(props) => <BillOfLading id={this.props.match.params.id}
                                                                 shipmentId={props.match.params.shipmentId}
                                                                 isUpdate={true}/>}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/advice`}
                                render={() => (
                                    <ShippingAdvice
                                        bills={this.props.trade.bills}
                                        trade={this.props.trade.items.single}
                                        userName={this.props.trade.requestInfo.sellerUserName}
                                        status={this.tradeStatus}
                                    />
                                )}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/instructions`}
                                render={() => (
                                    this.props.trade.instructions
                                        ? <DocumentaryInstructions
                                            data={this.props.trade.instructions}
                                            previewMode={true}
                                            trade={this.props.trade.items.single}
                                        />
                                        : (
                                            <div className="di-form">
                                                Documentary instructions have not been issued.
                                            </div>
                                        )
                                )}
                            />
                            <Route
                                exact
                                path={`/trades/details/${this.props.match.params.id}/inspection-reports`}
                                render={() => (
                                    <InspectionReports
                                        match={this.props.match}
                                        reports={this.props.trade.reports}
                                        user={this.props.account.user}
                                        PostInspectionReport={(id, params) => {
                                            this.props.PostInspectionReport(id, params);
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </div>
                ) : null}

                <Footer/>
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => {
    return {
        trade: state.trade,
        company: state.account.token,
        account: state.account,
        loadingStatus: state.loading.loadingStatus,
        loadingDocuments: state.loading.loadingDocuments,
        loadingDocumentComments: state.loading.loadingDocumentComments,
        loadingRequest: state.loading.requestLoading
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            loadRequestDetails,
            GetTradeDocuments,
            GetShipments,
            GetTradeBill,
            GetTradeInvoice,
            LoadRequestInfo,
            PostTradeDocument,
            PostTradeDocumentInvoice,
            PostDocumentFile,
            UpdateDocument,
            ApproveDocument,
            RejectDocument,
            ReleaseDocument,
            OpenDocument,
            PayStatusFlow,
            Sign: SmartTrade.Sign,
            updateSignedLocaly,
            updateVesselNominated,
            updatePayedLocaly,
            LoadingStatus,
            UpdateTradeDocumentLocaly,
            UpdateCloseLocally: UpdateCloseLocally,
            sendShippingAdvice,
            sendInstructions,
            getDocInstructions,
            GetInspectionReports,
            PostInspectionReport,
            preloadInspectionCompanies,
            GetDocumentComments,
            PostDocumentComment,
            ClearTradeState,
            SetTradeStatus,
            UpdateRequest,
            navigate: path => push(path),
            navigateDocs: path => push(`/trades/details/${path}/documents`)
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(TradesDetails);
