import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import FormDateField from '../../../components/form/FormDateField';
import { EnumsService } from '../../../../services/service.utils';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import {
    loadRequestDetails,
    LoadRequestInfo,
    GetTradeBill,
    PostTradeDocument,
    UpdateBill, getDocInstructions, GetVesselNomination
} from '../../../../modules/module.trade';
import { DATEFORMAT, INCOTERMOPT } from '../../../../services/service.values';
import Preloader from '../../../components/preloader/Preloader';
import { DOCUMENT_TYPES } from '../services/documents.service';

const Countries = EnumsService.countries();

class BillOfLading extends Component {
    constructor(props) {
        super(props);
        this.state = {
            billOfLading: {}
        };
        const trade = this.props.trade.items.single;
        let isEmpty = value => !value || value === undefined || value === '';
        this.initField('billOfLading', 'BillNumber', '', '', isEmpty);
        this.initField('billOfLading', 'ShippingComp', '', '', isEmpty);
        this.initField('billOfLading', 'Consignee', '', '', isEmpty);
        this.initField('billOfLading', 'VessVoyage', '', '', isEmpty);
        this.initField('billOfLading', 'BookingRef', '', '', isEmpty);
        this.initField('billOfLading', 'QuantCleanOnBoard', '', '', isEmpty);
        this.initField('billOfLading', 'FreightsCharges', '', '', isEmpty);
        this.initField('billOfLading', 'DeclaredValue', '', '', isEmpty);
        this.initField('billOfLading', 'PlaceIssue', '', '', isEmpty);
        this.initField('billOfLading', 'DateIssue', 'Date of issue', null, isEmpty);
        this.initField('billOfLading', 'CarriersAgentsEndorsm', '', '', isEmpty);
        this.initField('billOfLading', 'PackGoodsDescript', '', '', isEmpty);
        this.initField('billOfLading', 'Marking', '', '', false);
        this.initField('billOfLading', 'CarrierReceipt', '', '', isEmpty);
        this.initField('billOfLading', 'portOfDischarge', '', `${Countries[trade.destCountry]}, ${trade.destPort}`, isEmpty);
        this.initField('billOfLading', 'ShippedOnBoard', 'Shipped on board date', null, isEmpty);
    }

    get notifyValue() {
        return this.props.trade.instructions && this.props.trade.instructions.documentaryInstructions
            ? this.props.trade.instructions.documentaryInstructions.billOfLadingNotify
            : '';
    }

    initField(document, name, label, value, required) {
        this.state[document][name] = {
            name: name,
            label: label,
            required: required,
            value: value
        };
    }

    setField = (name, value) => {
        if (
            // check, that value is date format!
            (name === 'DateIssue' && typeof value !== 'object') ||
            (name === 'ShippedOnBoard' && typeof value !== 'object')
        ) {
        } else {
            let documentValue = this.state.billOfLading;
            documentValue[name] = {
                ...documentValue[name],
                value: value
            };
            this.setState({
                billOfLading: documentValue
            });
        }
    };

    submitForm = e => {
        e.preventDefault();
        if (this.validate(this.state.billOfLading)) {
            this.props.PostTradeDocument(this.props.id, this.props.shipmentId, this.getValueToPost(this.state.billOfLading), () =>
                this.props.navigateDocs(this.props.id)
            );
        }
    };

    getValueToPost = state => {
        let result = {};
        // console.log(this.state.billOfLading);

        Object.keys(state).map((k, i) => {
            if (k === 'QuantCleanOnBoard') {
                result[k] = parseInt(state[k].value, 10);
            } else {
                result[k] = state[k].value;
            }
        });
        return result;
    };

    componentWillMount = () => {
        this.props.loadRequestDetails(this.props.id);
        this.props.LoadRequestInfo(this.props.id);
        this.props.GetTradeBill(this.props.id, this.props.shipmentId);
        this.props.getDocInstructions(this.props.id);
        this.props.GetVesselNomination(this.props.id);
    };

    componentWillReceiveProps(nextProps) {
        if (this.props.isPreview === undefined && nextProps.trade.bills[this.props.shipmentId]) {
            this.updateState(nextProps.trade.bills[this.props.shipmentId]);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.trade.instructions !== this.props.trade.instructions) {
            this.prepopulateConsignee();
        }
        if (prevProps.trade.vesselNomination !== this.props.trade.vesselNomination && Object.keys(this.props.trade.vesselNomination).length > 0) {
            this.prepopulateVessVoyage();
        }
    }

    prepopulateConsignee = () => {
        if (!!this.state.billOfLading.Consignee.value) {
            return;
        }
        this.setState(prevState => ({
            ...prevState,
            billOfLading: {
                ...prevState.billOfLading,
                Consignee: {
                    ...prevState.billOfLading.Consignee,
                    value: this.props.trade.instructions.documentaryInstructions.billOfLadingConsignee
                }
            }
        }));
    };

    prepopulateVessVoyage = () => {
        if (!!this.state.billOfLading.VessVoyage.value) {
            return;
        }
        this.setState(prevState => ({
            ...prevState,
            billOfLading: {
                ...prevState.billOfLading,
                VessVoyage: {
                    ...prevState.billOfLading.VessVoyage,
                    value: this.props.trade.vesselNomination.name
                }
            }
        }));
    };

    submitFormUpdate = e => {
        e.preventDefault();
        if (this.validate(this.state.billOfLading)) {
            this.props.UpdateBill(this.props.id, this.props.shipmentId, this.getValueToPost(this.state.billOfLading), () =>
                this.props.navigateDocs(this.props.id)
            );
        }
    };

    getValueToPostUpdate = state => {
        let result = {};
        // console.log(this.state.billOfLading);

        Object.keys(state).map((k, i) => {
            if (k === 'QuantCleanOnBoard') {
                result[k] = parseFloat(state[k]);
            } else {
                result[k] = state[k];
            }
        });
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
            billOfLading: {
                BillNumber: {
                    ...this.state.billOfLading.BillNumber,
                    value: request.BillNumber
                },
                BookingRef: {
                    ...this.state.billOfLading.BookingRef,
                    value: request.BookingRef
                },
                CarrierReceipt: {
                    ...this.state.billOfLading.CarrierReceipt,
                    value: request.CarrierReceipt
                },
                CarriersAgentsEndorsm: {
                    ...this.state.billOfLading.CarriersAgentsEndorsm,
                    value: request.CarriersAgentsEndorsm
                },
                Consignee: {
                    ...this.state.billOfLading.Consignee,
                    value: request.Consignee
                },
                DateIssue: {
                    ...this.state.billOfLading.DateIssue,
                    value: request.DateIssue
                },
                DeclaredValue: {
                    ...this.state.billOfLading.DeclaredValue,
                    value: request.DeclaredValue
                },
                FreightsCharges: {
                    ...this.state.billOfLading.FreightsCharges,
                    value: request.FreightsCharges
                },
                Marking: {
                    ...this.state.billOfLading.Marking,
                    value: request.Marking
                },
                PackGoodsDescript: {
                    ...this.state.billOfLading.PackGoodsDescript,
                    value: request.PackGoodsDescript
                },
                PlaceIssue: {
                    ...this.state.billOfLading.PlaceIssue,
                    value: request.PlaceIssue
                },
                QuantCleanOnBoard: {
                    ...this.state.billOfLading.QuantCleanOnBoard,
                    value: request.QuantCleanOnBoard
                },
                ShippedOnBoard: {
                    ...this.state.billOfLading.ShippedOnBoard,
                    value: request.ShippedOnBoard
                },
                ShippingComp: {
                    ...this.state.billOfLading.ShippingComp,
                    value: request.ShippingComp
                },
                VessVoyage: {
                    ...this.state.billOfLading.VessVoyage,
                    value: request.VessVoyage
                },
                portOfDischarge: {
                    ...this.state.billOfLading.portOfDischarge,
                    value: request.PortOfDischarge
                }
            }
        });
    };

    /**
     * Here, the event.charCode == 8 || event.charCode == 0 || event.charCode == 13 condition handles the case when DELETE, BACKSPACE or ENTER keys are pressed (important for Firefox).
     * The event.charCode >= 48 && event.charCode <= 57 means that only 0 (decimal code 48) and all other digits up to 9 (decimal code 57) will be returned.
     */
    handleNumericKeyPress = event => {
        if (!(event.charCode === 8 || event.charCode === 0 || event.charCode === 13 || (event.charCode >= 48 && event.charCode <= 57))) {
            event.stopPropagation();
            event.preventDefault();
        }
    };

    renderBill = (bol, trade, isPreview) => {
        if (bol !== undefined && trade !== undefined) {
            return (
                <div className="trades-dtls__doc-wrapper trades-dtls__bol">
                    <form
                        className="container-fluid"
                        onChange={e => this.setField(e.target.name, e.target.value)}
                        onSubmit={e => this.submitFormUpdate(e)}
                    >
                        <div className="row">
                            <div className="col-12 d-md-flex justify-content-between">
                                <div className="form-group">
                                    <label className="mr-2 font-weight-bold fix2" htmlFor="">
                                        BILL OF LADING No*
                                    </label>
                                    <input
                                        value={this.state.billOfLading.BillNumber.value}
                                        disabled={false}
                                        className={
                                            'trades-dtls__doc-input' +
                                            (this.state.required && this.state.required.hasOwnProperty('BillNumber')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                        name="BillNumber"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="mr-2 font-weight-bold fix2" htmlFor="">
                                        No & sequence of original B/L’s*
                                    </label>
                                    <input
                                        disabled
                                        className="trades-dtls__doc-input trades-dtls__doc-input_short"
                                        type="text"
                                        value="1/3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="mr-2 font-weight-bold fix2" htmlFor="">
                                        No of rider pages*
                                    </label>
                                    <input
                                        disabled
                                        className="trades-dtls__doc-input trades-dtls__doc-input_short"
                                        type="text"
                                        value="1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <label htmlFor="">Shipping Company*</label>
                                    <input
                                        value={this.state.billOfLading.ShippingComp.value}
                                        disabled={false}
                                        className={
                                            'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                            (this.state.required && this.state.required.hasOwnProperty('ShippingComp')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                        name="ShippingComp"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Shipper*</label>
                                    <input
                                        disabled
                                        defaultValue={trade.seller}
                                        className="trades-dtls__doc-input trades-dtls__doc-input_fluid"
                                        type="text"
                                        name="shipper"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">
                                        Consignee*:
                                        <span>This B/L is not negotiable unless marked “To Order” or “Ro Order of..” here*</span>
                                    </label>
                                    <textarea
                                        value={this.state.billOfLading.Consignee.value}
                                        disabled={isPreview}
                                        name="Consignee"
                                        className={
                                            'trades-dtls__doc-textarea trades-dtls__doc-textarea_short' +
                                            (this.state.required && this.state.required.hasOwnProperty('Consignee')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        id=""
                                        cols="30"
                                        rows="10"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Vessel & voyage No.*</label>
                                    <input
                                        value={this.state.billOfLading.VessVoyage.value}
                                        disabled={false}
                                        name="VessVoyage"
                                        className={
                                            'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                            (this.state.required && this.state.required.hasOwnProperty('VessVoyage')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Booking ref. (or) Shipper’s ref.*</label>
                                    <input
                                        value={this.state.billOfLading.BookingRef.value}
                                        disabled={isPreview}
                                        name="BookingRef"
                                        className={
                                            'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                            (this.state.required && this.state.required.hasOwnProperty('BookingRef')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Quantity Clean on Board*</label>
                                    <input
                                        value={this.state.billOfLading.QuantCleanOnBoard.value}
                                        disabled={isPreview}
                                        type="text"
                                        onKeyPress={this.handleNumericKeyPress}
                                        name="QuantCleanOnBoard"
                                        className={
                                            'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                            (this.state.required && this.state.required.hasOwnProperty('QuantCleanOnBoard')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="fix" htmlFor="">
                                        Freight and charges*
                                        <span>Cargo shall not be delivered unless Freight and Charges are paid</span>
                                    </label>
                                    <textarea
                                        value={this.state.billOfLading.FreightsCharges.value}
                                        disabled={isPreview}
                                        name="FreightsCharges"
                                        className={
                                            'trades-dtls__doc-textarea trades-dtls__doc-textarea_short' +
                                            (this.state.required && this.state.required.hasOwnProperty('FreightsCharges')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        id=""
                                        cols="30"
                                        rows="10"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">
                                        Declared value*
                                        <span>Only applicable if Ad Valorem charges paid</span>
                                    </label>
                                    <input
                                        value={this.state.billOfLading.DeclaredValue.value}
                                        disabled={isPreview}
                                        name="DeclaredValue"
                                        className={
                                            'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                            (this.state.required && this.state.required.hasOwnProperty('DeclaredValue')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Place of issue*</label>
                                    <input
                                        value={this.state.billOfLading.PlaceIssue.value}
                                        disabled={isPreview}
                                        name="PlaceIssue"
                                        className={
                                            'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                            (this.state.required && this.state.required.hasOwnProperty('PlaceIssue')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Date of issue*</label>
                                    <FormDateField
                                        time={false}
                                        dateFormat={DATEFORMAT}
                                        className="trades-dtls__doc-input trades-dtls__doc-input_fluid "
                                        disabled={isPreview}
                                        name="DateIssue"
                                        required={false}
                                        validation={this.state.required}
                                        item={{value: moment(this.state.billOfLading.DateIssue.value)}}
                                        onSelect={(name, date) => this.setField(name, date)}
                                        isClearable={false}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <label htmlFor="">Carrier’s agents endorsements: (include Agent(s) at POD)*</label>
                                    <textarea
                                        value={this.state.billOfLading.CarriersAgentsEndorsm.value}
                                        disabled={isPreview}
                                        name="CarriersAgentsEndorsm"
                                        className="trades-dtls__doc-textarea trades-dtls__doc-textarea_112"
                                        className={
                                            'trades-dtls__doc-textarea trades-dtls__doc-textarea_112' +
                                            (this.state.required && this.state.required.hasOwnProperty('CarriersAgentsEndorsm')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">
                                        Notify parties*:
                                        <span>No responsibility shall attach to the Carrier or to his Agent for failure to notify</span>
                                    </label>
                                    <textarea
                                        defaultValue={this.notifyValue}
                                        name="notifyParties"
                                        disabled
                                        className="trades-dtls__doc-textarea trades-dtls__doc-textarea_short"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Destination*</label>
                                    <input
                                        defaultValue={`${Countries[trade.destCountry]}, ${trade.destPort}`}
                                        name="portOfLoad"
                                        disabled
                                        className="trades-dtls__doc-input trades-dtls__doc-input_fluid"
                                        type="text"
                                    />
                                </div>
                                {trade.incoterm === INCOTERMOPT.FOB && (
                                    <div className="form-group">
                                        <label htmlFor="">Port of loading*</label>
                                        <input
                                            defaultValue={`${Countries[trade.loadCountry]}, ${trade.loadPort}`}
                                            name="portOfLoad"
                                            disabled
                                            className="trades-dtls__doc-input trades-dtls__doc-input_fluid"
                                            type="text"
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label htmlFor="">Port of discharge*</label>
                                    <input
                                        name="portOfDischarge"
                                        disabled={isPreview}
                                        value={this.state.billOfLading.portOfDischarge.value}
                                        className={
                                            'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                            (this.state.required && this.state.required.hasOwnProperty('portOfDischarge')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Description of Packages and Goods*</label>
                                    <textarea
                                        value={this.state.billOfLading.PackGoodsDescript.value}
                                        disabled={isPreview}
                                        name="PackGoodsDescript"
                                        className="trades-dtls__doc-textarea trades-dtls__doc-textarea_short"
                                        className={
                                            'trades-dtls__doc-textarea trades-dtls__doc-textarea_short' +
                                            (this.state.required && this.state.required.hasOwnProperty('PackGoodsDescript')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="fix">Marking</label>
                                    <textarea
                                        value={this.state.billOfLading.Marking.value}
                                        disabled={isPreview}
                                        required={false}
                                        name="Marking"
                                        className="trades-dtls__doc-textarea trades-dtls__doc-textarea_short"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">
                                        Carrier’s receipt*
                                        <span>No of Cntrs or Pkgs received by Carrier</span>
                                    </label>
                                    <input
                                        value={this.state.billOfLading.CarrierReceipt.value}
                                        disabled={isPreview}
                                        name="CarrierReceipt"
                                        className={
                                            'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                            (this.state.required && this.state.required.hasOwnProperty('CarrierReceipt')
                                                ? ' account-input_error input_error '
                                                : '')
                                        }
                                        type="text"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="">Shipped on board date*</label>
                                    <FormDateField
                                        time={false}
                                        dateFormat={DATEFORMAT}
                                        className="trades-dtls__doc-input trades-dtls__doc-input_fluid "
                                        disabled={isPreview}
                                        required={false}
                                        validation={this.state.required}
                                        name="ShippedOnBoard"
                                        item={{value: moment(this.state.billOfLading.ShippedOnBoard.value)}}
                                        onSelect={(name, date) => this.setField(name, date)}
                                        isClearable={false}
                                        label={null}
                                        minDate={null}
                                        maxDate={moment()}
                                    />
                                </div>
                                <span className="trades-dtls__bol-required">* Required fields</span>
                                {!isPreview && (
                                    <Fragment>
                                        {this.state.required && Object.keys(this.state.required).length > 0 && (
                                            <div className="trades-dtls__error-message">
                                                Please, complete all required fields before submitting
                                            </div>
                                        )}
                                        <div className="trades-dtls__submit trades-dtls__submit--bill">
                                            <Link to={`/trades/details/${this.props.id}/documents`} className="cancel">
                                                Cancel
                                            </Link>
                                            <button className="trades-dtls__doc-submit mr-0" disabled={this.props.loading}>
                                                <Preloader style="dots" loading={this.props.loading}>
                                                    Save
                                                </Preloader>
                                            </button>
                                        </div>
                                    </Fragment>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            );
        }
    };

    render() {
        const {id, isPreview, isPrint} = this.props;
        let bol = this.props.trade.bills[this.props.shipmentId];
        let trade = this.props.trade.items.single;
        return (
            <div className="trades-dtls__doc">
                {!isPrint && (
                    <div className="trades-dtls__doc-navigation">
                        <Link to={`/trades/details/${id}/documents`}>List of required documents</Link> / Bill of Lading
                    </div>
                )}
                {this.props.isUpdate ? (
                    this.renderBill(bol, trade, isPreview)
                ) : this.props.isPreview !== undefined &&
                (this.props.isPreview ? bol : true) &&
                this.props.isPreview !== null ? (
                    <div className="trades-dtls__doc-wrapper trades-dtls__bol">
                        <form
                            className="container-fluid"
                            onChange={e => this.setField(e.target.name, e.target.value)}
                            onSubmit={e => this.submitForm(e)}
                        >
                            <div className="row">
                                <div className="col-12 d-md-flex justify-content-between">
                                    <div className="form-group">
                                        <label className="mr-2 font-weight-bold fix2" htmlFor="">
                                            BILL OF LADING No*
                                        </label>
                                        <input
                                            value={isPreview ? bol.BillNumber : this.state.billOfLading.BillNumber.value}
                                            disabled={isPreview}
                                            className={
                                                'trades-dtls__doc-input' +
                                                (this.state.required && this.state.required.hasOwnProperty('BillNumber')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            type="text"
                                            name="BillNumber"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="mr-2 font-weight-bold fix2" htmlFor="">
                                            No & sequence of original B/L’s*
                                        </label>
                                        <input
                                            disabled
                                            className="trades-dtls__doc-input trades-dtls__doc-input_short"
                                            type="text"
                                            value="1/3"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="mr-2 font-weight-bold fix2" htmlFor="">
                                            No of rider pages*
                                        </label>
                                        <input
                                            disabled
                                            className="trades-dtls__doc-input trades-dtls__doc-input_short"
                                            type="text"
                                            value="1"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label htmlFor="">Shipping Company*</label>
                                        <input
                                            value={isPreview ? bol.ShippingComp : this.state.billOfLading.ShippingComp.value}
                                            disabled={isPreview}
                                            className={
                                                'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                                (this.state.required && this.state.required.hasOwnProperty('ShippingComp')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            type="text"
                                            name="ShippingComp"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Shipper*</label>
                                        <input
                                            disabled
                                            defaultValue={trade.seller}
                                            className="trades-dtls__doc-input trades-dtls__doc-input_fluid"
                                            type="text"
                                            name="shipper"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">
                                            Consignee*:
                                            <span>This B/L is not negotiable unless marked “To Order” or “Ro Order of..” here*</span>
                                        </label>
                                        <textarea
                                            value={isPreview ? bol.Consignee : this.state.billOfLading.Consignee.value}
                                            disabled={isPreview}
                                            name="Consignee"
                                            className={
                                                'trades-dtls__doc-textarea trades-dtls__doc-textarea_short' +
                                                (this.state.required && this.state.required.hasOwnProperty('Consignee')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            id=""
                                            cols="30"
                                            rows="10"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Vessel & voyage No.*</label>
                                        <input
                                            value={isPreview ? bol.VessVoyage : this.state.billOfLading.VessVoyage.value}
                                            disabled={isPreview}
                                            name="VessVoyage"
                                            className={
                                                'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                                (this.state.required && this.state.required.hasOwnProperty('VessVoyage')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            type="text"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Booking ref. (or) Shipper’s ref.*</label>
                                        <input
                                            value={isPreview ? bol.BookingRef : this.state.billOfLading.BookingRef.value}
                                            disabled={isPreview}
                                            name="BookingRef"
                                            className={
                                                'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                                (this.state.required && this.state.required.hasOwnProperty('BookingRef')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            type="text"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Quantity Clean on Board*</label>
                                        <input
                                            value={isPreview ? bol.QuantCleanOnBoard : this.state.billOfLading.QuantCleanOnBoard.value}
                                            type="text"
                                            onKeyPress={this.handleNumericKeyPress}
                                            disabled={isPreview}
                                            name="QuantCleanOnBoard"
                                            className={
                                                'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                                (this.state.required && this.state.required.hasOwnProperty('QuantCleanOnBoard')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="fix" htmlFor="">
                                            Freight and charges*
                                            <span>Cargo shall not be delivered unless Freight and Charges are paid</span>
                                        </label>
                                        <textarea
                                            value={isPreview ? bol.FreightsCharges : this.state.billOfLading.FreightsCharges.value}
                                            disabled={isPreview}
                                            name="FreightsCharges"
                                            className={
                                                'trades-dtls__doc-textarea trades-dtls__doc-textarea_short' +
                                                (this.state.required && this.state.required.hasOwnProperty('FreightsCharges')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            id=""
                                            cols="30"
                                            rows="10"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">
                                            Declared value*
                                            <span>Only applicable if Ad Valorem charges paid</span>
                                        </label>
                                        <input
                                            value={isPreview ? bol.DeclaredValue : this.state.billOfLading.DeclaredValue.value}
                                            disabled={isPreview}
                                            name="DeclaredValue"
                                            className={
                                                'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                                (this.state.required && this.state.required.hasOwnProperty('DeclaredValue')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            type="text"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Place of issue*</label>
                                        <input
                                            value={isPreview ? bol.PlaceIssue : this.state.billOfLading.PlaceIssue.value}
                                            disabled={isPreview}
                                            name="PlaceIssue"
                                            className={
                                                'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                                (this.state.required && this.state.required.hasOwnProperty('PlaceIssue')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            type="text"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Date of issue*</label>
                                        <FormDateField
                                            time={false}
                                            validation={this.state.required}
                                            dateFormat={DATEFORMAT}
                                            className="trades-dtls__doc-input trades-dtls__doc-input_fluid "
                                            disabled={isPreview}
                                            name="DateIssue"
                                            item={isPreview ? {value: moment(bol.DateIssue)} : this.state.billOfLading.DateIssue}
                                            onSelect={(name, date) => this.setField(name, date)}
                                            isClearable={false}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label htmlFor="">Carrier’s agents endorsements: (include Agent(s) at
                                            POD)*</label>
                                        <textarea
                                            value={isPreview ? bol.CarriersAgentsEndorsm : this.state.billOfLading.CarriersAgentsEndorsm.value}
                                            disabled={isPreview}
                                            name="CarriersAgentsEndorsm"
                                            className={
                                                'trades-dtls__doc-textarea trades-dtls__doc-textarea_112' +
                                                (this.state.required && this.state.required.hasOwnProperty('CarriersAgentsEndorsm')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">
                                            Notify parties*:
                                            <span>No responsibility shall attach to the Carrier or to his Agent for failure to notify</span>
                                        </label>
                                        <textarea
                                            defaultValue={this.notifyValue}
                                            name="notifyParties"
                                            disabled
                                            className="trades-dtls__doc-textarea trades-dtls__doc-textarea_short"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Destination*</label>
                                        <input
                                            defaultValue={`${Countries[trade.destCountry]}, ${trade.destPort}`}
                                            name="portOfLoad"
                                            disabled
                                            className="trades-dtls__doc-input trades-dtls__doc-input_fluid"
                                            type="text"
                                        />
                                    </div>
                                    {trade.incoterm === INCOTERMOPT.FOB && (
                                        <div className="form-group">
                                            <label htmlFor="">Port of loading*</label>
                                            <input
                                                defaultValue={`${Countries[trade.loadCountry]}, ${trade.loadPort}`}
                                                name="portOfLoad"
                                                disabled
                                                className="trades-dtls__doc-input trades-dtls__doc-input_fluid"
                                                type="text"
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label htmlFor="">Port of discharge*</label>
                                        <input
                                            value={isPreview ? bol.PortOfDischarge : this.state.billOfLading.portOfDischarge.value}
                                            name="portOfDischarge"
                                            disabled={isPreview}
                                            className={
                                                'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                                (this.state.required && this.state.required.hasOwnProperty('portOfDischarge')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            type="text"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Description of Packages and Goods*</label>
                                        <textarea
                                            value={isPreview ? bol.PackGoodsDescript : this.state.billOfLading.PackGoodsDescript.value}
                                            disabled={isPreview}
                                            name="PackGoodsDescript"
                                            className={
                                                'trades-dtls__doc-textarea trades-dtls__doc-textarea_short' +
                                                (this.state.required && this.state.required.hasOwnProperty('PackGoodsDescript')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="fix">Marking</label>
                                        <textarea
                                            value={isPreview ? bol.Marking : this.state.billOfLading.Marking.value}
                                            disabled={isPreview}
                                            name="Marking"
                                            className="trades-dtls__doc-textarea trades-dtls__doc-textarea_short"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">
                                            Carrier’s receipt*
                                            <span>No of Cntrs or Pkgs received by Carrier</span>
                                        </label>
                                        <input
                                            value={isPreview ? bol.CarrierReceipt : this.state.billOfLading.CarrierReceipt.value}
                                            disabled={isPreview}
                                            name="CarrierReceipt"
                                            className={
                                                'trades-dtls__doc-input trades-dtls__doc-input_fluid' +
                                                (this.state.required && this.state.required.hasOwnProperty('CarrierReceipt')
                                                    ? ' account-input_error input_error '
                                                    : '')
                                            }
                                            type="text"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="">Shipped on board date*</label>
                                        {/*console.log(isPreview, bol, this.state)*/}
                                        <FormDateField
                                            time={false}
                                            dateFormat={DATEFORMAT}
                                            validation={this.state.required}
                                            className="trades-dtls__doc-input trades-dtls__doc-input_fluid "
                                            disabled={isPreview}
                                            name="ShippedOnBoard"
                                            item={isPreview ? {value: moment(bol.ShippedOnBoard)} : this.state.billOfLading.ShippedOnBoard}
                                            onSelect={(name, date) => this.setField(name, date)}
                                            isClearable={false}
                                            label={null}
                                            minDate={null}
                                            maxDate={moment()}
                                        />
                                    </div>
                                    {!isPreview && (
                                        <Fragment>
                                            <span className="trades-dtls__bol-required">* Required fields</span>
                                            {this.state.required && Object.keys(this.state.required).length > 0 && (
                                                <div className="trades-dtls__error-message">
                                                    Please, complete all required fields before submitting
                                                </div>
                                            )}
                                            <div className="trades-dtls__submit trades-dtls__submit--bill">
                                                <Link to={`/trades/details/${this.props.id}/documents`}
                                                      className="cancel">
                                                    Cancel
                                                </Link>
                                                <button className="trades-dtls__doc-submit mr-0" disabled={this.props.loading}>
                                                    <Preloader style="dots" loading={this.props.loading}>
                                                        Save
                                                    </Preloader>
                                                </button>
                                            </div>
                                        </Fragment>
                                    )}
                                </div>
                            </div>
                        </form>
                        {isPreview && !isPrint && (
                            <div className="mb-3 text-center">
                                <Link to={`/trades/details/${this.props.id}/documents`}
                                      className="cancel">
                                    Cancel
                                </Link>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        trade: state.trade,
        loading: state.loading.loadingDocuments[DOCUMENT_TYPES.BILL]
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            loadRequestDetails,
            GetTradeBill,
            LoadRequestInfo,
            getDocInstructions,
            UpdateBill,
            PostTradeDocument,
            GetVesselNomination,
            navigateDocs: path => push(`/trades/details/${path}/documents`)
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(BillOfLading);
