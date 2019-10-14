import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';
import moment from 'moment-timezone';
import scrollToElement from 'scroll-to-element';
import ReactGA from 'react-ga';
//COMPONENTS
import Autosuggest from 'react-autosuggest';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';

import FormInputField from '../../components/form/FormInputField';
import FormSelectDropdown from '../../components/form/FormSelectDropdown';
import FormDateField from '../../components/form/FormDateField';
import FormRadioField from '../../components/form/FormRadioField';
import FormUnitsInputField from '../../components/form/FormUnitsInputField';
import FormDateFieldFromTo from '../../components/form/FormDateFieldFromTo';

import './requests.create.css';

//ICONS
import MdClose from 'react-icons/lib/md/close';

//ACTIONS
import {
    CreateTradeRequest,
    searchCompanies,
    preloadInspectionCompanies,
    UpdateTradeRequest, loadRequestDetails, ClearTradeState
} from '../../../modules/module.trade';
import { EnumsService } from '../../../services/service.utils';

//values
import {
    DATEFORMATHOURS,
    MEASUREMENTS,
    THAILAND_RICE,
    VIETNAM_RICE,
    QUALITYSTANDARD,
    PAYMENTTERMSOPT,
    PAYMENTPERIODOPT,
    INCOTERMOPT,
    DISCHARGEFOB,
    DISCHARGECIF,
    REQUESTTYPES,
    SHIPPINGTYPES,
    PACKAGING, TYPES_OF_RICE, REQUEST_PRIVACY_TYPE
} from '../../../services/service.values';

//styles
import 'react-day-picker/lib/style.css';
import 'react-datepicker/dist/react-datepicker.css';
import { Link } from 'react-router-dom';
import Preloader from '../../components/preloader/Preloader';
import omitBy from 'lodash/omitBy';
//VALUES

// var scrollToElement = require('scroll-to-element');

const THAILAND = 'TH';
const VIETNAM = 'VN';

const seaPorts = EnumsService.ports.JSON;

let date = new Date().getFullYear();

const Countries = EnumsService.countries();

let CropYear = {
    ['Current crop']: 'Current crop'
};

for (let i = 0; i <= 4; i++) {
    CropYear[date - i] = date - i;
}

class CreateRequest extends Component {
    state = {
        request: {},
        value: '',
        suggestions: [],
        counterparty: '',
        selectedDay: '',
        disabled: false,
        countries: {},
        privacyType: 'PRIVATE',
        initiated: false
    };

    constructor(props) {
        super(props);
        this.handleDayClick = this.handleDayClick.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (this.isUpdate && !this.state.loaded && this.props.trade.items.single && Object.keys(this.props.trade.items.single).length > 0) {
            const request = this.props.trade.items.single;
            this.updateState(request);
            this.setState({
                loadedRequest: request,
                loaded: true
            });
        }
        // if it was update trade earlier and now it is create
        if (prevProps.match.params.id !== undefined && !this.isUpdate) {
            this.props.ClearTradeState();
            this.initiateState();
        }
        // if it was create trade and now it is update
        if (prevProps.match.params.id === undefined && this.isUpdate) {
            this.setState({loaded: false});
            this.loadTradeRequest();
        }
    }

    componentDidMount() {
        this.initiateState();
        if (this.isUpdate) {
            setTimeout(() => {
                this.loadTradeRequest();
            });
        }
    }

    setCountriesValues() {
        const Countries = EnumsService.countries();
        let arrayOfCountries = [];
        const allowCountries = {
            KH: 'Cambodia',
            TH: 'Thailand',
            VN: 'Vietnam',
            MM: 'Myanmar',
            IN: 'India',
            CN: 'China, People\'s Republic of',
            PK: 'Pakistan',
            ES: 'Spain',
            FR: 'France',
            GR: 'Greece',
            IT: 'Italy',
            EG: 'Egypt',
            US: 'United States',
            BR: 'Brazil',
            GY: 'Guyana',
            UY: 'Uruguay',
            PY: 'Paraguay',
            AR: 'Argentina',
            SR: 'Suriname'
        };
        Object.keys(allowCountries).map(i => {
            arrayOfCountries.push({
                [i]: Countries[i]
            });
        });
        arrayOfCountries.sort(function (a, b) {
            if (a[Object.keys(a)[0]].toUpperCase() < b[Object.keys(b)[0]].toUpperCase()) {
                return -1;
            }
            if (a[Object.keys(a)[0]].toUpperCase() > b[Object.keys(b)[0]].toUpperCase()) {
                return 1;
            }
            // names must be equal
            return 0;
        });
        let result = {};

        arrayOfCountries.map(i => {
            result[Object.keys(i)[0]] = i[Object.keys(i)[0]];
        });
        this.setState({
            countries: result
        });
    }

    loadTradeRequest() {
        const {match, trade} = this.props;

        const request = trade.items.single;
        if (!request) {
            this.props.loadRequestDetails(match.params.id);
        } else {
            this.updateState(request);
            this.setState(prevState => ({
                loadedRequest: request,
            }));
        }
    }

    isEmpty = value => !value || value === undefined || value === '';

    initiateState() {
        this.props.searchCompanies('');
        this.props.preloadInspectionCompanies();
        this.setState(prevState => ({
            request: {},
            value: '',
            suggestions: [],
            counterparty: '',
            selectedDay: '',
            disabled: false,
            countries: {},
            privacyType: 'PRIVATE'
        }));
        const isEmpty = this.isEmpty;

        this.initField('requestType', 'Request Type', 'BUY', isEmpty);
        this.initField('counterparty', 'Select counterparty', [], false);
        this.initField('price', 'Your Price', '', false);
        this.initField('origin', 'Origin', '', isEmpty);
        this.initField('shipping', 'Please choose', 'VESSEL', isEmpty);
        this.initField('measure', 'Tonnage / quantity', '', isEmpty);
        this.initField('measurement', '', 'TONS', isEmpty);
        this.initField('riceType', 'Type of rice', '', isEmpty);
        this.initField('cropYear', 'Crop year', '', isEmpty);
        this.initField('quality', 'Quality standard', '', false);
        this.initField('incoterm', 'Incoterm', '', isEmpty);
        this.initField('destCountry', 'Destination', '', false);
        this.initField('destPort', '', '', false);
        this.initField('loadCountry', 'Port of load', '', false);
        this.initField('loadPort', '', '', false);
        this.initField('deliveryStartDate', 'Shipping / Delivery period', null, isEmpty);
        this.initField('deliveryEndDate', 'Shipping / Delivery period', null, isEmpty);
        this.initField('packaging', 'Packaging', '', isEmpty);
        this.initField('payment', 'Payment terms', '', isEmpty);
        this.initField('paymentPeriod', 'Payment period', '', isEmpty);
        this.initField('inspection', 'Inspection', undefined);
        this.initField('discharge', 'Load/ Discharge terms', '', isEmpty);
        this.initField('specialRequest', 'Special documentary request', '', false);
        this.initField('validateDate', 'Valid until', null, isEmpty);

        this.setCountriesValues();

        this.setState({
            initiated: true
        });
    }

    get requestId() {
        return this.props.match.params.id;
    }

    get isUpdate() {
        return this.requestId !== undefined;
    }

    initField(name, label, value, required) {
        this.setState(prevState => ({
            ...prevState,
            request: {
                ...prevState.request,
                [name]: {
                    name: name,
                    label: label,
                    required: required,
                    value: value,
                    disabled: false
                }
            }
        }));
    }

    setField = (name, value) => {
        switch (name) {
            case 'validateDate':
            case 'deliveryStartDate':
            case 'deliveryEndDate':
                if (typeof value === 'object' && value !== null) {
                    let request = this.state.request;
                    request[name] = {
                        ...request[name],
                        value: value
                    };

                    this.setState({
                        request: request
                    });
                }
                break;
            case 'incoterm': {
                let request = {...this.state.request};
                request.incoterm.value = value;
                if (value === INCOTERMOPT.FOB) {
                    request.destCountry.value = '';
                    request.destCountry.required = false;
                    request.destPort.value = '';
                    request.destPort.required = false;
                    request.loadCountry.required = this.isEmpty;
                    request.loadPort.required = this.isEmpty;
                    request.deliveryStartDate.label = 'Shipping period';
                    request.deliveryEndDate.label = 'Shipping period';
                    if (this.state.request.origin.value && !request.destCountry.value) {
                        request.loadCountry.value = this.state.request.origin.value;
                    }
                } else if (value === INCOTERMOPT.CIF) {
                    request.loadCountry.value = '';
                    request.loadCountry.required = false;
                    request.loadPort.value = '';
                    request.loadPort.required = false;
                    request.destCountry.required = this.isEmpty;
                    request.destPort.required = this.isEmpty;
                    request.deliveryStartDate.label = 'Delivery period';
                    request.deliveryEndDate.label = 'Delivery period';
                }
                this.setState({request});
                break;
            }
            case 'payment': {
                let request = {...this.state.request};
                request[name] = {
                    ...request[name],
                    value
                };
                if (value === 'CAD') {
                    request.paymentPeriod.value = PAYMENTPERIODOPT['at sight'];
                    request.paymentPeriod.disabled = true;
                } else {
                    request.paymentPeriod.disabled = false;
                }
                this.setState({request});
                break;
            }
            case 'privacyType': {
                let request = {...this.state.request};
                let inputValue = this.state.value;
                if (value === 'PUBLIC') {
                    request.counterparty.value = [];
                    inputValue = '';
                }
                this.setState({
                    request,
                    value: inputValue,
                    privacyType: value
                });
                break;
            }
            case 'destCountry': {
                let request = {...this.state.request};
                request.destCountry.value = value;
                request.destPort.value = '';
                this.setState({request});
                break;
            }
            case 'loadCountry': {
                let request = {...this.state.request};
                request.loadCountry.value = value;
                request.loadPort.value = '';
                this.setState({request});
                break;
            }
            case '':
                break;
            default: {
                let request = this.state.request;
                request[name] = {
                    ...request[name],
                    value: value
                };
                this.setState({
                    request: request
                });
                break;
            }
        }
    };

    updateState = request => {
        const counterparty =
            request.buyerId === this.props.account.token.companyId
                ? {ID: request.sellerId, name: request.seller}
                : {ID: request.buyerId, name: request.buyer};

        this.setState({
            counterparty: counterparty.name,
            value: counterparty.name,
            privacyType: !counterparty.name ? 'PUBLIC' : 'PRIVATE',
            request: {
                ...this.state.request,
                counterparty: {
                    ...this.state.request.counterparty,
                    value: counterparty.id ? [counterparty.id] : []
                },
                requestType: {
                    ...this.state.request.requestType,
                    value: request.requestType
                },
                price: {
                    ...this.state.request.price,
                    value: request.price
                },
                origin: {
                    ...this.state.request.origin,
                    value: request.origin
                },
                shipping: {
                    ...this.state.request.shipping,
                    value: request.shipping
                },
                measure: {
                    ...this.state.request.measure,
                    value: request.measure
                },
                measurement: {
                    ...this.state.request.measurement,
                    value: request.measurement.toString()
                },
                riceType: {
                    ...this.state.request.riceType,
                    value: request.riceType
                },
                cropYear: {
                    ...this.state.request.cropYear,
                    value: request.cropYear
                },
                quality: {
                    ...this.state.request.quality,
                    value: request.quality
                },
                incoterm: {
                    ...this.state.request.incoterm,
                    value: request.incoterm
                },
                destCountry: {
                    ...this.state.request.destCountry,
                    value: request.destCountry,
                    required: request.incoterm === INCOTERMOPT.CIF ? this.isEmpty : false
                },
                destPort: {
                    ...this.state.request.destPort,
                    value: request.destPort,
                    required: request.incoterm === INCOTERMOPT.CIF ? this.isEmpty : false
                },
                loadCountry: {
                    ...this.state.request.loadCountry,
                    value: request.loadCountry,
                    required: request.incoterm === INCOTERMOPT.FOB ? this.isEmpty : false
                },
                loadPort: {
                    ...this.state.request.loadPort,
                    value: request.loadPort,
                    required: request.incoterm === INCOTERMOPT.FOB ? this.isEmpty : false
                },
                deliveryStartDate: {
                    ...this.state.request.deliveryStartDate,
                    value: moment(request.deliveryStartDate),
                    label: request.incoterm === INCOTERMOPT.FOB ? 'Shipping period' : 'Delivery period'
                },
                deliveryEndDate: {
                    ...this.state.request.deliveryEndDate,
                    value: moment(request.deliveryEndDate),
                    label: request.incoterm === INCOTERMOPT.FOB ? 'Shipping period' : 'Delivery period'
                },
                packaging: {
                    ...this.state.request.packaging,
                    value: request.packaging
                },
                payment: {
                    ...this.state.request.payment,
                    value: request.payment
                },
                paymentPeriod: {
                    ...this.state.request.paymentPeriod,
                    value: request.paymentPeriod,
                    disabled: request.payment === 'CAD'
                },
                inspection: {
                    ...this.state.request.inspection,
                    value: request.inspection
                },
                validateDate: {
                    ...this.state.request.validateDate,
                    value: moment(request.validateDate)
                },
                discharge: {
                    ...this.state.request.discharge,
                    value: request.discharge
                },
                specialRequest: {
                    ...this.state.request.specialRequest,
                    value: request.specialRequest
                }
            }
        });
    };

    trackAction(action) {
        ReactGA.event({
            category: 'Trade',
            action
        })
    }

    submit = e => {
        e.preventDefault();
        if (this.validate(this.state.request)) {
            this.setState({showError: false});
            this.setState({
                disabled: true
            });
            if (this.isUpdate) {
                this.submitUpdate();
            } else {
                this.props.CreateTradeRequest(this.getStateValue(this.state.request), () => {
                    this.props.navigate('/');
                    this.trackAction('Create Request');
                });
            }
        } else {
            this.setState({showError: true});
        }
    };

    submitUpdate = () => {
        const valFromState = this.getStateValue(this.state.request);
        const loaded = this.state.loadedRequest;

        const counterparty =
            loaded.buyerId === this.props.account.token.companyId
                ? {ID: loaded.sellerId, name: loaded.Seller}
                : {ID: loaded.buyerId, name: loaded.Buyer};

        let diff = omitBy(valFromState, function (v, k) {
            if (counterparty && k === 'counterparty') {
                if (valFromState.counterparty == counterparty.id) {
                    return valFromState.counterparty;
                }
            }
            return loaded[k] === v;
        });

        if (typeof diff.counterparty == 'number') {
            diff.counterparty = [diff.counterparty];
        } else {
            diff.counterparty = valFromState.counterparty;
        }

        this.props.UpdateTradeRequest(this.props.match.params.id, diff).then(() => {
            this.props.navigate('/');
            this.trackAction('Update Request');
        });
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
        if (this.state.privacyType === 'PRIVATE' && this.state.counterparty === '') {
            required.counterparty = this.state.request.counterparty;
        }
        if (Object.keys(required).length > 0) {
            this.setState({required: required}, () => {
                scrollToElement('.input_error', {
                    offset: -130,
                    ease: 'inOutQuad',
                    duration: 600
                });
            });
            return false;
        }
        return true;
    }

    getStateValue(container) {
        let result = {};
        Object.keys(container).map(key => {
            switch (key) {
                case 'price':
                case 'measure':
                    result[key] = parseFloat(container[key].value);
                    break;

                case 'inspection':
                    result[key] = container[key].value ? Number(container[key].value) : null;
                    break;
                case 'validateDate':
                    result[key] = container[key].value.unix();
                    break;
                case 'deliveryStartDate':
                case 'deliveryEndDate':
                    result[key] = container[key].value.format();
                    break;
                default:
                    result[key] = container[key].value;
                    break;
            }
            return false;
        });

        return result;
    }

    getPortCountryName(country) {
        switch (country) {
            case 'Vietnam':
                return 'Viet Nam';
            case 'Russia':
                return 'Russian Federation';
            default:
                return country;
        }
    }

    getPorts = country => {
        if (country !== '') {
            let arrayOfPorts = [];

            Object.keys(seaPorts).map(i => {
                arrayOfPorts.push({
                    [i]: seaPorts[i]
                });
            });

            const countryName = this.getPortCountryName(Countries[country]);
            let filteredPorts = arrayOfPorts.filter(port => {
                return port[Object.keys(port)[0]].country === countryName;
            });

            let result = {};

            filteredPorts.map(i => {
                result[i[Object.keys(i)[0]].name] = i[Object.keys(i)[0]].name;
            });

            let orderedResult = {};

            Object.keys(result)
                .sort((a, b) => {
                    if (a < b) {
                        return -1;
                    }
                    if (a > b) {
                        return 1;
                    }
                    return 0;
                })
                .forEach(key => {
                    orderedResult[key] = result[key];
                });

            return orderedResult;
        } else {
            return {};
        }
    };

    formRiceType = ricetype => {
        return (
            <div className="create-req__wrapper">
                <FormSelectDropdown
                    validation={this.state.required}
                    name="riceType"
                    items={ricetype}
                    onSelect={val => this.setField('riceType', val)}
                    value={this.state.request.riceType}
                />
            </div>
        );
    };

    formDischarge = discharge => {
        return (
            <div className="create-req__wrapper">
                <FormSelectDropdown
                    validation={this.state.required}
                    name="discharge"
                    items={discharge}
                    onSelect={val => this.setField('discharge', val)}
                    value={this.state.request.discharge}
                />
            </div>
        );
    };

    getFormCountryWithPortParams() {
        const destinationParams = {
            country: {
                name: 'destCountry',
                value: this.state.request.destCountry
            },
            port: {
                name: 'destPort',
                value: this.state.request.destPort
            }
        };
        const loadParams = {
            country: {
                name: 'loadCountry',
                value: this.state.request.loadCountry
            },
            port: {
                name: 'loadPort',
                value: this.state.request.loadPort
            }
        };
        return  this.state.request.incoterm.value === 'CIF' ? destinationParams : loadParams;
    }

    renderFormCountryWithPort = () => {
        const params = this.getFormCountryWithPortParams();
        return (
            <React.Fragment>
                <div className="create-req__wrapper">
                    <FormSelectDropdown
                        validation={this.state.required}
                        name={params.country.name}
                        items={Countries}
                        onSelect={val => this.setField(params.country.name, val)}
                        value={params.country.value}
                        placeholder="Country"
                    />
                </div>

                <div className="create-req__wrapper">
                    {Object.keys(this.getPorts(params.country.value.value)).length !== 0 ? (
                        <FormSelectDropdown
                            validation={this.state.required}
                            name={params.port.name}
                            items={this.getPorts(params.country.value.value)}
                            onSelect={val => this.setField(params.port.name, val)}
                            value={params.port.value}
                            placeholder="Port"
                        />
                    ) : (
                        <FormInputField
                            name={params.port.name}
                            validation={this.state.required}
                            value={params.port.value}
                            onChange={e => this.setField(params.port.name, e.target.value)}
                            placeholder="Port"
                        />
                    )}
                </div>
            </React.Fragment>
        );
    };

    renderFields = field => {
        switch (field) {
            case 'PRICE':
                if (this.state.privacyType === 'PRIVATE' && this.state.request.requestType.value === 'BUY') {
                    this.state.request.price.required = false;
                } else {
                    let isEmpty = value => !value || value === undefined || value === '';
                    this.state.request.price.required = isEmpty;
                }
                return (
                    <div className="create-req__wrapper create-req__wrapper_price">
                        <FormInputField
                            max={9999999}
                            type="number"
                            name="price"
                            validation={this.state.required}
                            value={this.state.request.price}
                        />
                    </div>
                );
            case 'TYPE_OF_RICE':
                const riceTypes = TYPES_OF_RICE[this.state.request.origin.value];
                if (riceTypes) {
                    return this.formRiceType(riceTypes);
                } else {
                    return (
                        <div className="create-req__wrapper">
                            <FormInputField
                                validation={this.state.required}
                                name="riceType"
                                value={this.state.request.riceType}
                            />
                        </div>
                    );
                }
            case 'DISCHARGE':
                if (this.state.request.incoterm.value === 'CIF' && this.state.request.shipping.value === 'VESSEL') {
                    if (this.state.request.discharge.label !== 'Discharge terms') {
                        const discharge = {...this.state.request.discharge};
                        discharge.label = 'Discharge terms';
                        this.setState(prevState => ({
                            ...prevState,
                            request: {
                                ...prevState.request,
                                discharge
                            }
                        }));
                    }
                    return this.formDischarge(DISCHARGECIF);
                } else if (this.state.request.incoterm.value === 'FOB' && this.state.request.shipping.value === 'VESSEL') {
                    if (this.state.request.discharge.label !== 'Load terms') {
                        const discharge = {...this.state.request.discharge};
                        discharge.label = 'Load terms';
                        this.setState(prevState => ({
                            ...prevState,
                            request: {
                                ...prevState.request,
                                discharge
                            }
                        }));
                    }
                    return this.formDischarge(DISCHARGEFOB);
                } else if (this.state.request.shipping.value === 'CONTAINER') {
                    if (this.state.request.discharge.label !== 'Load/Discharge terms') {
                        const discharge = {...this.state.request.discharge};
                        discharge.label = 'Load/Discharge terms';
                        discharge.value = '';
                        discharge.required = false;
                        this.setState(prevState => ({
                            ...prevState,
                            request: {
                                ...prevState.request,
                                discharge
                            }
                        }));
                    }
                    return null;
                } else {
                    if (this.state.request.discharge.label !== 'Load terms') {
                        const discharge = {...this.state.request.discharge};
                        discharge.label = 'Load terms';
                        this.setState(prevState => ({
                            ...prevState,
                            request: {
                                ...prevState.request,
                                discharge
                            }
                        }));
                    }
                    return this.formDischarge(DISCHARGEFOB);
                }
            default:
                return null;
        }
    };

    getSuggestions = value => {
        let companiesArray = this.props.trade.companies.companies;
        if (companiesArray !== null && companiesArray !== undefined) {
            const regex = new RegExp('^' + value, 'i');
            return companiesArray.filter(company => {
                return regex.test(company.Name);
            });
        } else {
            return [];
        }
    };

    getSuggestionValue = suggestion => {
        this.setState({
            counterparty: suggestion.Name,
            request: {
                ...this.state.request,
                counterparty: {
                    ...this.state.request.counterparty,
                    value: [suggestion.ID]
                }
            }
        });
        return suggestion.Name;
    };

    renderSuggestion = suggestion => {
        return (
            <div>
                <span>{suggestion.Name}</span>
                <span className="country"> ({suggestion.ID})</span>
            </div>
        );
    };

    onChange = (event, {newValue}) => {
        // this.props.searchCompanies(newValue)
        this.setState({
            value: newValue
        });
    };
    onSuggestionsFetchRequested = ({value}) => {
        this.setState({
            suggestions: this.getSuggestions(value)
        });
    };
    onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: []
        });
    };

    deleteCounterParty = () => {
        this.setState({
            counterparty: '',
            request: {
                ...this.state.request,
                counterparty: {
                    ...this.state.request.counterparty,
                    value: []
                }
            },
            value: ''
        });
    };

    handleDayClick(date) {
        this.setState({
            request: {
                ...this.state.request,
                validateDate: {
                    ...this.state.request.validateDate,
                    value: date
                }
            }
        });
    }

    render() {
        const {value, suggestions} = this.state;
        const inputProps = {
            placeholder: 'Search',
            value,
            onChange: this.onChange,
            maxLength: 50,
            required: true
        };
        if (!this.state.initiated) {
            return null;
        }
        return (
            <React.Fragment>
                <Header/>
                <div className="create-req">
                    <form
                        action="submit"
                        className="create-request__form "
                        onChange={e => this.setField(e.target.name, e.target.rawValue || e.target.value)}
                        onSubmit={e => this.submit(e)}
                        noValidate={true}
                    >

                        <h2 className="create-req__heading">{this.isUpdate ? 'Update Request' : 'Create New Request'}</h2>

                        <div className="create-req__wrapper">
                            <FormRadioField name="requestType" items={REQUESTTYPES}
                                            onChange={e => this.setField('requestType', e.target.value)}
                                            value={this.state.request.requestType}/>
                        </div>

                        <div className="create-req__wrapper">
                            <FormRadioField name="privacyType" items={REQUEST_PRIVACY_TYPE}
                                            onChange={e => this.setField('privacyType', e.target.value)}
                                            value={{value: this.state.privacyType}}/>
                        </div>

                        {this.state.privacyType === 'PRIVATE' && (
                            <div className="create-req__wrapper">
                                <div className="form-input">
                                    <label htmlFor="counterparty" className="account-label input-label">
                                        Select counterparty*
                                    </label>
                                    <Autosuggest
                                        theme={{
                                            container: 'react-autosuggest__container',
                                            containerOpen: 'react-autosuggest__container--open',
                                            input: `input react-autosuggest__input ${
                                                this.state.required && this.state.required.hasOwnProperty('counterparty')
                                                    ? this.state.counterparty === ''
                                                    ? ' input_error '
                                                    : null
                                                    : ''
                                                }`,
                                            inputOpen: 'react-autosuggest__input--open',
                                            inputFocused: 'react-autosuggest__input--focused',
                                            suggestionsContainer: 'react-autosuggest__suggestions-container',
                                            suggestionsContainerOpen: 'react-autosuggest__suggestions-container--open',
                                            suggestionsList: 'react-autosuggest__suggestions-list',
                                            suggestion: 'react-autosuggest__suggestion',
                                            suggestionFirst: 'react-autosuggest__suggestion--first',
                                            suggestionHighlighted: 'react-autosuggest__suggestion--highlighted',
                                            sectionContainer: 'react-autosuggest__section-container',
                                            sectionContainerFirst: 'react-autosuggest__section-container--first',
                                            sectionTitle: 'react-autosuggest__section-title'
                                        }}
                                        id="counterparty"
                                        suggestions={suggestions}
                                        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                                        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                                        getSuggestionValue={this.getSuggestionValue}
                                        renderSuggestion={this.renderSuggestion}
                                        inputProps={inputProps}
                                        focusInputOnSuggestionClick={false}
                                        highlightFirstSuggestion={true}
                                        shouldRenderSuggestions={() => true}
                                    />
                                </div>
                            </div>
                        )}

                        {this.state.required && this.state.required.hasOwnProperty('counterparty') ? (
                            this.state.counterparty === '' ? (
                                <div className="create-req__wrapper">
                                    <p className="counterparty__error">Please select from the list of registered
                                        companies</p>
                                </div>
                            ) : null
                        ) : null}

                        <div className="create-req__wrapper">
                            <div className="counterparty">
                                {this.state.request.counterparty.value == '' ? null : (
                                    <div
                                        className={`counterparty__label ${window.innerWidth < 500 ? 'counterparty__label--dotsout' : null}`}
                                    >
                                        {this.state.counterparty}
                                        <MdClose className="counterparty__label__close"
                                                 onClick={() => this.deleteCounterParty()}/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {this.renderFields('PRICE')}

                        <div className="create-req__wrapper">
                            <FormDateField
                                dateFormat={DATEFORMATHOURS}
                                required={false}
                                validation={this.state.required}
                                name="validateDate"
                                minDate={moment().add(1, 'days')}
                                item={this.state.request.validateDate}
                                label={true}
                                onSelect={(name, date) => this.setField(name, date)}
                            />
                        </div>

                        <div className="create-req__wrapper">
                            <FormSelectDropdown
                                validation={this.state.required}
                                name="origin"
                                items={this.state.countries}
                                onSelect={val => this.setField('origin', val)}
                                value={this.state.request.origin}
                            />
                        </div>

                        <div className="create-req__wrapper">
                            <FormRadioField name="shipping" items={SHIPPINGTYPES} value={this.state.request.shipping}
                                            onChange={e => this.setField('shipping', e.target.value)}/>
                        </div>

                        <div className="create-req__wrapper create-req__wrapper_amount">
                            <FormUnitsInputField
                                name="measure"
                                dropName="measurement"
                                dropPlaceholder="tons"
                                placeholder="Amount"
                                items={MEASUREMENTS}
                                type="number"
                                numeralIntegerScale={5}
                                validation={this.state.required}
                                onSelect={val => this.setField('measurement', val)}
                                value={this.state.request.measure}
                                dropValue={this.state.request.measurement}
                            />
                        </div>

                        {this.renderFields('TYPE_OF_RICE')}

                        <div className="create-req__wrapper">
                            <FormSelectDropdown
                                validation={this.state.required}
                                name="cropYear"
                                items={CropYear}
                                onSelect={val => this.setField('cropYear', val)}
                                value={this.state.request.cropYear}
                            />
                        </div>

                        <div className="create-req__wrapper">
                            <FormSelectDropdown
                                validation={this.state.required}
                                name="quality"
                                items={QUALITYSTANDARD}
                                showDefault={true}
                                onSelect={val => this.setField('quality', val)}
                                value={this.state.request.quality}
                            />
                        </div>
                        <div className="create-req__wrapper">
                            <FormSelectDropdown
                                validation={this.state.required}
                                name="incoterm"
                                items={INCOTERMOPT}
                                onSelect={val => this.setField('incoterm', val)}
                                value={this.state.request.incoterm}
                            />
                        </div>

                        {this.renderFormCountryWithPort()}
                        <div className="create-req__wrapper">
                            <FormDateFieldFromTo
                                validation={this.state.required}
                                nameStart="deliveryStartDate"
                                itemStart={this.state.request.deliveryStartDate}
                                onSelect={(name, date) => this.setField(name, date)}
                                nameEnd="deliveryEndDate"
                                itemEnd={this.state.request.deliveryEndDate}
                            />
                        </div>
                        <div className="create-req__wrapper">
                            <FormSelectDropdown
                                validation={this.state.required}
                                name="packaging"
                                items={PACKAGING}
                                onSelect={val => this.setField('packaging', val)}
                                value={this.state.request.packaging}
                                placeholder=""
                            />
                        </div>

                        <div className="create-req__wrapper">
                            <FormSelectDropdown
                                validation={this.state.required}
                                name="payment"
                                items={PAYMENTTERMSOPT}
                                onSelect={val => this.setField('payment', val)}
                                value={this.state.request.payment}
                                placeholder="Payment"
                            />
                        </div>

                        <div className="create-req__wrapper">
                            <FormSelectDropdown
                                name="paymentPeriod"
                                items={PAYMENTPERIODOPT}
                                validation={this.state.required}
                                value={this.state.request.paymentPeriod}
                                disabled={this.state.request.paymentPeriod.disabled}
                                onSelect={val => this.setField('paymentPeriod', val)}
                                placeholder={this.state.request.paymentPeriod.value}
                                required={false}
                            />
                        </div>


                        <div className="create-req__wrapper">
                            <FormSelectDropdown
                                name="inspection"
                                items={this.props.trade.inspections}
                                validation={this.state.required}
                                value={this.state.request.inspection}
                                onSelect={val => this.setField('inspection', Number(val))}
                                placeholder={this.state.request.inspection.value}
                                required={false}
                                showDefault={true}
                            />

                        </div>

                        {this.renderFields('DISCHARGE')}

                        <div className="create-req__wrapper">
                            <FormInputField
                                name="specialRequest"
                                validation={this.state.required}
                                value={this.state.request.specialRequest}
                            />
                        </div>

                        {this.state.showError && (
                            <div className="create-req__wrapper">
                                <div className="trades-dtls__error-message m-0">
                                    Please, complete all required fields before submitting
                                </div>
                            </div>
                        )}
                        <div className="create-req__wrapper create-req__wrapper_btn">
                            <span className="create-req__required">* Required fields</span>
                            <button disabled={this.state.disabled} className="btn btn--blue" type="submit">
                                <Preloader style="dots" loading={this.props.loading}>
                                    <span>{this.isUpdate ? 'Save' : 'Send Trade Request'}</span>
                                </Preloader>
                            </button>
                        </div>
                        <div className="create-req__wrapper mt-3">
                            <Link to="/requests" className="cancel">
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
                <Footer/>
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => {
    return {
        trade: state.trade,
        request: state.trade.request,
        loading: state.loading.requestCreation,
        account: state.account
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            navigate: path => push('/requests' + path),
            CreateTradeRequest,
            UpdateTradeRequest,
            ClearTradeState,
            loadRequestDetails,
            searchCompanies,
            preloadInspectionCompanies,
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(CreateRequest);
