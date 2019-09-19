import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import {
    loadRequestDetails,
    LoadRequestInfo,
    GetTradeBill,
    GetTradeInvoice,
    PostTradeDocumentInvoice,
    UpdateInvoice, GetVesselNomination
} from '../../../../modules/module.trade';

import moment from 'moment';
import { EnumsService } from '../../../../services/service.utils';
import { DATEFORMAT, INCOTERMOPT, TRADE_STATUS } from '../../../../services/service.values';
import Dropzone from 'react-dropzone';
import Preloader from '../../../components/preloader/Preloader';
import sha256 from 'crypto-js/sha256';
import JSEncrypt from 'jsencrypt';
import { DOCUMENT_TYPES } from '../services/documents.service';

const Countries = EnumsService.countries();

//bol -- Bill of Lading
class Invoice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            invoice: {},
            initialized: false,
            postData: null,
            isUpdate: false,
            showModal: false,
            signatureModal: {
                file: null,
                privateKey: null,
                loading: false
            }
        };
        let isEmpty = value => !value || value === undefined || value === '';
        this.initField('invoice', 'invoiceNo', 'Invoice No', '', isEmpty);
        this.initField('invoice', 'vesselName', 'Vessel\'s Name', '', isEmpty);
        this.initField('invoice', 'bankRequisites', 'Bank Requisites', '', isEmpty);
    }

    get firstBill() {
        return this.bills[0];
    }

    get bills() {
        return Object.values(this.props.trade.bills);
    }

    get trade() {
        return this.props.trade.items.single;
    }

    get totalAmount() {
        const quantity = this.bills.reduce((acc, bill) => acc + bill.QuantCleanOnBoard, 0);
        return quantity * this.props.trade.items.single.price;
    }

    componentWillMount = () => {
        this.props.loadRequestDetails(this.props.id);
        this.props.LoadRequestInfo(this.props.id);
        this.props.GetVesselNomination(this.props.id);
        if (this.props.isPreview || this.props.isPreview === undefined) {
            this.props.GetTradeInvoice(this.props.id);
        }
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.trade.invoice && !this.state.initialized) {
            this.updateState(nextProps.trade.invoice);
            this.setState({initialized: true});
        }
        if (this.props.isPreview === false && !this.state.invoice.vesselName.value && this.props.trade.vesselNomination !== nextProps.trade.vesselNomination) {
            this.setState(prevState => ({
                invoice: {
                    ...prevState.invoice,
                    vesselName: {
                        ...prevState.invoice.vesselName,
                        value: nextProps.trade.vesselNomination.name
                    }
                }
            }));
        }
    }

    initField(document, name, label, value, required) {
        this.state[document][name] = {
            name: name,
            label: label,
            required: required,
            value: value
        };
    }

    getValueToPostUpdate = state => {
        let result = {};
        Object.keys(state).map((k, i) => {
            result[k] = state[k].value;
        });
        result.id = this.props.trade.invoice.ID;
        result['totalAmount'] = this.totalAmount;
        return result;
    };

    setField = (name, value) => {
        let documentValue = this.state.invoice;
        documentValue[name] = {
            ...documentValue[name],
            value: value
        };
        this.setState({
            invoice: documentValue
        });
    };

    submitForm = e => {
        if (this.props.trade.invoice) {
            this.submitFormUpdate(e);
            return;
        }
        e.preventDefault();
        if (this.validate(this.state.invoice)) {
            this.setState({
                showModal: true,
                postData: this.getValueToPost(this.state.invoice),
                isUpdate: false
            });
        }
    };

    submitFormUpdate = e => {
        e.preventDefault();
        if (this.validate(this.state.invoice)) {
            this.setState({
                showModal: true,
                postData: this.getValueToPostUpdate(this.state.invoice),
                isUpdate: true
            });
        }
    };

    getValueToPost = state => {
        let result = {};
        Object.keys(state).map((k, i) => {
            result[k] = state[k].value;
        });
        result['totalAmount'] = this.totalAmount;
        return result;
    };

    validate(container) {
        let required = {};
        Object.keys(container).map(key => {
            let v = container[key];
            if (v && v.required && v.required(v.value)) {
                required[key] = v;
            }
            return false;
        });
        if (Object.keys(required).length > 0) {
            this.setState({required: required});
            return false;
        }
        return true;
    }

    updateState = request => {
        this.setState({
            invoice: {
                ...this.state.invoice,
                invoiceNo: {
                    ...this.state.invoice.invoiceNo,
                    value: request.invoiceNo
                },
                bankRequisites: {
                    ...this.state.invoice.invoiceNo,
                    value: request.bankRequisites
                },
                vesselName: {
                    ...this.state.invoice.vesselName,
                    value: request.vesselName
                }
            }
        });
    };

    signContract = () => {
        const text = 'invoice';
        const sign = new JSEncrypt();
        sign.setPrivateKey(this.state.signatureModal.privateKey);
        const signature = sign.sign(text, sha256, 'sha256');
        const postData = {
            ...this.state.postData,
            signature,
            text
        };
        this.setState(prevState => ({
            ...prevState,
            signatureModal: {
                ...prevState.signatureModal,
                error: '',
                loading: true
            }
        }));
        const submitFunc = this.state.isUpdate ? this.props.UpdateInvoice : this.props.PostTradeDocumentInvoice;
        submitFunc(this.props.id, postData, (result) => {
                if (result) {
                    this.props.navigateDocs(this.props.id);
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
            }
        );
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

    closeSignatureModal = () => {
        this.setState(prevState => ({
            ...prevState,
            showModal: false,
            signatureModal: {}
        }));
    };

    renderSignatureModal = () => {
        return (
            <div className="modal__container">
                <form className="modal__wrapper" onSubmit={(e) => {
                    e.preventDefault();
                    if (!this.state.signatureModal.privateKey) {
                        return;
                    }
                    this.signContract();
                }}>
                    {!this.state.signatureModal.loading && <span className="modal__close" onClick={this.closeSignatureModal}/>}
                    <h3 className="modal__heading">Sign Invoice</h3>
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
        )
    };

    renderPage = () => {
        // this.setState({

        // })
        if (this.props.isPreview === undefined) {
            if (this.props.trade && this.props.trade.invoice !== undefined) {
                return (
                    <form
                        onChange={e => this.setField(e.target.name, e.target.value)}
                        onSubmit={e => this.submitFormUpdate(e)}
                        className="trades-dtls__doc-wrapper trades-dtls__invoice-wrapper"
                    >
                        <div className="trades-dtls__input-wrapper">
                            <input
                                defaultValue={this.props.trade.items.single.seller}
                                className="trades-dtls__doc-input trades-dtls__doc-input_long trades-dtls__doc-input_dark"
                                type="text"
                                id="from"
                                disabled
                            />
                        </div>
                        <h4 className="trades-dtls__doc-heading">Commercial Invoice</h4>
                        <div className="container-fluid">
                            <div className="row">
                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" className="trades-dtls__doc-label"
                                           htmlFor="to">
                                        To*
                                    </label>
                                    <input
                                        disabled
                                        defaultValue={this.props.trade.items.single.buyer}
                                        type="text"
                                        id="to"
                                        className="trades-dtls__doc-input trades-dtls__doc-input_long trades-dtls__doc-input_dark"
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Invoice No.*
                                    </label>
                                    <input
                                        disabled={false}
                                        value={this.state.invoice.invoiceNo.value}
                                        className={
                                            'trades-dtls__doc-input' +
                                            (this.state.required && this.state.required.hasOwnProperty('invoiceNo')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="number"
                                        id="invoice"
                                        name="invoiceNo"
                                    />
                                </div>

                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Date*
                                    </label>
                                    <input
                                        defaultValue={
                                            this.props.isPreview === undefined
                                                ? moment(this.props.trade.invoice.CreatedAt).format(DATEFORMAT)
                                                : moment().format(DATEFORMAT)
                                        }
                                        disabled
                                        className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                        type="text"
                                        id="invoice-date"
                                    />
                                </div>

                                {this.trade.incoterm === INCOTERMOPT.FOB && (
                                    <div className="trades-dtls__input-wrapper">
                                        <label className="trades-dtls__doc-label" htmlFor="invoice">
                                            Port of loading*
                                        </label>
                                        <input
                                            disabled
                                            defaultValue={`${Countries[this.trade.loadCountry]}, ${this.trade.loadPort}`}
                                            className="trades-dtls__doc-input trades-dtls__doc-input_dark trades-dtls__doc-input--long"
                                            type="text"
                                            id="loadingport"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="row">
                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Contract/PO No.*
                                    </label>
                                    <input
                                        disabled
                                        defaultValue={this.props.trade.items.single.id}
                                        className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                        type="text"
                                        id="contract"
                                    />
                                </div>

                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Date*
                                    </label>
                                    <input
                                        disabled
                                        defaultValue={moment(this.props.trade.items.single.createdAt).format(DATEFORMAT)}
                                        className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                        type="text"
                                        id="contract-date"
                                    />
                                </div>

                            </div>

                            <div className="row">
                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Vessel's Name*
                                    </label>
                                    <input
                                        value={this.state.invoice.vesselName.value}
                                        className={
                                            'trades-dtls__doc-input' +
                                            (this.state.required && this.state.required.hasOwnProperty('vesselName')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                        id="vesselName"
                                        name="vesselName"
                                    />
                                </div>
                            </div>

                            {this.bills.map(bill => (
                                <React.Fragment>
                                    <div className="row">
                                        <div className="trades-dtls__input-wrapper">
                                            <label className="trades-dtls__doc-label" htmlFor="invoice">
                                                Bill of Lading No.*
                                            </label>
                                            <input
                                                disabled
                                                value={bill.BillNumber}
                                                className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                                type="text"
                                                id="billoflading"
                                            />
                                        </div>

                                        <div className="trades-dtls__input-wrapper">
                                            <label className="trades-dtls__doc-label" htmlFor="invoice">
                                                Port of discharge*
                                            </label>
                                            <input
                                                disabled
                                                defaultValue={bill.PortOfDischarge}
                                                className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                                type="text"
                                                id="dischargeport"
                                            />
                                        </div>

                                        <div className="trades-dtls__input-wrapper">
                                            <label className="trades-dtls__doc-label" htmlFor="invoice">
                                                Date*
                                            </label>
                                            <input
                                                value={moment(bill.CreatedAt).format(DATEFORMAT)}
                                                disabled
                                                className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                                type="text"
                                                id="billdate"
                                            />
                                        </div>

                                        <div className="trades-dtls__input-wrapper">
                                            <label className="trades-dtls__doc-label" htmlFor="invoice">
                                                Quantity*
                                            </label>
                                            <input
                                                value={bill.QuantCleanOnBoard}
                                                disabled
                                                className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                                type="text"
                                                id="quantity"
                                            />
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))}

                            <div className="row">
                                <div className="trades-dtls__invoice-th">
                                    <div className="trades-dtls__invoice-td">Description of goods</div>
                                    <div className="trades-dtls__invoice-td">Unit price</div>
                                    <div className="trades-dtls__invoice-td">Amount</div>
                                </div>
                                <div className="trades-dtls__invoice-tr">
                                    <div
                                        className="trades-dtls__invoice-td">{` ${this.firstBill.PackGoodsDescript} ${
                                        this.firstBill.Marking
                                        } ${this.props.trade.riceType}`}</div>
                                    <div
                                        className="trades-dtls__invoice-td">${this.props.trade.items.single.price}</div>
                                    <div
                                        className="trades-dtls__invoice-td">{`$${this.totalAmount}`}</div>
                                </div>
                            </div>
                            <div className="row justify-content-between">
                                <div className="trades-dtls__summ-wrapper">
                                    <label className="trades-dtls__doc-label trades-dtls__doc-label_inline"
                                           htmlFor="requisiters">
                                        Kindly Pay To*
                                    </label>
                                    <input
                                        disabled={false}
                                        value={this.state.invoice.bankRequisites.value}
                                        className={
                                            'trades-dtls__doc-input' +
                                            (this.state.required && this.state.required.hasOwnProperty('bankRequisites')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                        name="bankRequisites"
                                    />
                                </div>
                                <div className="trades-dtls__summ-wrapper">
                                    <label className="trades-dtls__doc-label trades-dtls__doc-label_inline"
                                           htmlFor="totalpay">
                                        Total payable*
                                    </label>
                                    <input
                                        disabled
                                        className="trades-dtls__doc-input trades-dtls__doc-input_dark trades-dtls__doc-input--black"
                                        type="text"
                                        value={`$${this.totalAmount}`}
                                    />
                                </div>
                            </div>
                            <div className="trades-dtls__invoice-required">*Required fields</div>
                            {this.props.isPreview === undefined && (
                                <Fragment>
                                    {this.state.required && Object.keys(this.state.required).length > 0 && (
                                        <div className="trades-dtls__error-message text-center">
                                            Please, complete all required fields before submitting
                                        </div>
                                    )}
                                    <div className="trades-dtls__submit trades-dtls__submit--invoice">
                                        <button type="submit" className="trades-dtls__doc-submit"
                                                disabled={this.props.loading}>
                                            <Preloader style="dots" loading={this.props.loading}>
                                                Save
                                            </Preloader>
                                        </button>
                                        <Link to={`/trades/details/${this.props.id}/documents`}
                                              className="cancel cancel--invoice">
                                            Cancel
                                        </Link>
                                    </div>
                                </Fragment>
                            )}
                        </div>
                    </form>
                );
            }
        }
        if (this.props.isPreview) {
            if (this.props.trade !== undefined) {
            }
        } else {
            if (this.props.trade !== undefined) {
            }
        }
    };

    render() {
        let trade = this.props.trade.items.single;
        if (!this.firstBill || !this.props.trade.vesselNomination || Object.keys(this.props.trade.vesselNomination).length === 0) {
            return (
                <div className="trades-dtls__doc">
                    <Preloader style="swirl" loading={true}/>
                </div>
            );
        }

        return (
            <div className="trades-dtls__doc">
                <div className="trades-dtls__doc-navigation">
                    <Link to={`/trades/details/${this.props.id}/documents`}>List of required documents</Link> / Invoice
                </div>
                {this.props.isPreview === undefined ? (
                    this.renderPage()
                ) : (this.props.isPreview ? this.props.trade.invoice : this.firstBill) &&
                this.props.isPreview !== null ? (
                    <form
                        onChange={e => this.setField(e.target.name, e.target.value)}
                        onSubmit={e => this.submitForm(e)}
                        className="trades-dtls__doc-wrapper trades-dtls__invoice-wrapper"
                    >
                        <div className="trades-dtls__input-wrapper">
                            <input
                                defaultValue={trade.seller}
                                className="trades-dtls__doc-input trades-dtls__doc-input_long trades-dtls__doc-input_dark"
                                type="text"
                                disabled
                            />
                        </div>
                        <h4 className="trades-dtls__doc-heading">Commercial Invoice</h4>
                        <div className="container-fluid">
                            <div className="row">
                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" className="trades-dtls__doc-label"
                                           htmlFor="to">
                                        To*
                                    </label>
                                    <input
                                        disabled
                                        defaultValue={trade.buyer}
                                        type="text"
                                        id="to"
                                        className="trades-dtls__doc-input trades-dtls__doc-input_long trades-dtls__doc-input_dark"
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Invoice No.*
                                    </label>
                                    <input
                                        disabled={this.props.isPreview ? 'true' : ''}
                                        value={this.props.isPreview ? this.props.trade.invoice.invoiceNo : this.state.invoice.invoiceNo.value}
                                        className={
                                            'trades-dtls__doc-input' +
                                            (this.state.required && this.state.required.hasOwnProperty('invoiceNo')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="number"
                                        id="invoice"
                                        name="invoiceNo"
                                    />
                                </div>

                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Date*
                                    </label>
                                    <input
                                        defaultValue={
                                            this.props.isPreview
                                                ? moment(this.props.trade.invoice.createdAt).format(DATEFORMAT)
                                                : moment().format(DATEFORMAT)
                                        }
                                        disabled
                                        className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                        type="text"
                                        id="invoice-date"
                                    />
                                </div>

                                {this.trade.incoterm === INCOTERMOPT.FOB && (
                                    <div className="trades-dtls__input-wrapper">
                                        <label className="trades-dtls__doc-label" htmlFor="invoice">
                                            Port of loading*
                                        </label>
                                        <input
                                            disabled
                                            defaultValue={`${Countries[this.trade.loadCountry]}, ${this.trade.loadPort}`}
                                            className="trades-dtls__doc-input trades-dtls__doc-input_dark trades-dtls__doc-input--long"
                                            type="text"
                                            id="loadingport"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="row">
                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Contract/PO No.*
                                    </label>
                                    <input
                                        disabled
                                        defaultValue={trade.id}
                                        className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                        type="text"
                                        id="contract"
                                    />
                                </div>

                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Date*
                                    </label>
                                    <input
                                        disabled
                                        defaultValue={moment(trade.createdAt).format(DATEFORMAT)}
                                        className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                        type="text"
                                        id="contract-date"
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="trades-dtls__input-wrapper">
                                    <label className="trades-dtls__doc-label" htmlFor="invoice">
                                        Vessel's Name*
                                    </label>
                                    <input
                                        disabled={this.props.isPreview ? 'true' : ''}
                                        value={this.props.isPreview ? this.props.trade.invoice.vesselName : this.state.invoice.vesselName.value}
                                        className={
                                            'trades-dtls__doc-input' +
                                            (this.state.required && this.state.required.hasOwnProperty('vesselName')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                        id="vesselName"
                                        name="vesselName"
                                    />
                                </div>
                            </div>

                            {this.bills.map(bill => (
                                <React.Fragment key={`${bill.BillNumber}-${bill.billID}`}>
                                    <div className="row">
                                        <div className="trades-dtls__input-wrapper">
                                            <label className="trades-dtls__doc-label" htmlFor="invoice">
                                                Bill of Lading No.*
                                            </label>
                                            <input
                                                disabled
                                                value={bill.BillNumber}
                                                className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                                type="text"
                                                id="billoflading"
                                            />
                                        </div>

                                        <div className="trades-dtls__input-wrapper">
                                            <label className="trades-dtls__doc-label" htmlFor="invoice">
                                                Port of discharge*
                                            </label>
                                            <input
                                                disabled
                                                defaultValue={bill.PortOfDischarge}
                                                className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                                type="text"
                                                id="dischargeport"
                                            />
                                        </div>

                                        <div className="trades-dtls__input-wrapper">
                                            <label className="trades-dtls__doc-label" htmlFor="invoice">
                                                Date*
                                            </label>
                                            <input
                                                value={moment(bill.CreatedAt).format(DATEFORMAT)}
                                                disabled
                                                className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                                type="text"
                                                id="billdate"
                                            />
                                        </div>

                                        <div className="trades-dtls__input-wrapper">
                                            <label className="trades-dtls__doc-label" htmlFor="invoice">
                                                Quantity*
                                            </label>
                                            <input
                                                value={bill.QuantCleanOnBoard}
                                                disabled
                                                className="trades-dtls__doc-input trades-dtls__doc-input_dark"
                                                type="text"
                                                id="quantity"
                                            />
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))}

                            <div className="row">
                                <div className="trades-dtls__invoice-th">
                                    <div className="trades-dtls__invoice-td">Description of goods</div>
                                    <div className="trades-dtls__invoice-td">Unit price</div>
                                    <div className="trades-dtls__invoice-td">Amount</div>
                                </div>
                                <div className="trades-dtls__invoice-tr">
                                    <div className="trades-dtls__invoice-td">
                                        {` ${this.firstBill.PackGoodsDescript} ${this.firstBill.Marking} ${trade.riceType}`}
                                    </div>
                                    <div className="trades-dtls__invoice-td">${trade.price}</div>
                                    <div className="trades-dtls__invoice-td">
                                        {this.totalAmount}
                                    </div>
                                </div>
                            </div>
                            <div className="row justify-content-between">
                                <div className="trades-dtls__summ-wrapper">
                                    <label className="trades-dtls__doc-label trades-dtls__doc-label_inline"
                                           htmlFor="requisiters">
                                        Kindly Pay To*
                                    </label>
                                    <input
                                        disabled={this.props.isPreview ? 'true' : ''}
                                        value={this.props.isPreview ? this.props.trade.invoice.bankRequisites : this.state.invoice.bankRequisites.value}
                                        className={
                                            'trades-dtls__doc-input' +
                                            (this.state.required && this.state.required.hasOwnProperty('bankRequisites')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                        name="bankRequisites"
                                    />
                                </div>
                                <div className="trades-dtls__summ-wrapper">
                                    <label className="trades-dtls__doc-label trades-dtls__doc-label_inline"
                                           htmlFor="totalpay">
                                        Total payable*
                                    </label>
                                    <input
                                        disabled
                                        className="trades-dtls__doc-input trades-dtls__doc-input_dark trades-dtls__doc-input--black"
                                        type="text"
                                        value={this.totalAmount}
                                    />
                                </div>
                            </div>
                            <div className="trades-dtls__invoice-required">*Required fields</div>
                            {!this.props.isPreview && (
                                <Fragment>
                                    {this.state.required && Object.keys(this.state.required).length > 0 && (
                                        <div className="trades-dtls__error-message text-center">
                                            Please, complete all required fields before submitting
                                        </div>
                                    )}
                                    <div className="trades-dtls__submit trades-dtls__submit--invoice">
                                        <button type="submit" className="trades-dtls__doc-submit"
                                                disabled={this.props.loading}>
                                            <Preloader style="dots" loading={this.props.loading}>
                                                Save
                                            </Preloader>
                                        </button>
                                        <Link to={`/trades/details/${this.props.id}/documents`}
                                              className="cancel cancel--invoice">
                                            Cancel
                                        </Link>
                                    </div>
                                </Fragment>
                            )}
                        </div>
                    </form>
                ) : null}
                {this.state.showModal && this.renderSignatureModal()}
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        trade: state.trade,
        loading: state.loading.loadingDocuments[DOCUMENT_TYPES.INVOICE]
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            loadRequestDetails,
            GetTradeInvoice,
            GetTradeBill,
            LoadRequestInfo,
            PostTradeDocumentInvoice,
            UpdateInvoice,
            GetVesselNomination,
            navigateDocs: path => push(`/trades/details/${path}/documents`)
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(Invoice);
