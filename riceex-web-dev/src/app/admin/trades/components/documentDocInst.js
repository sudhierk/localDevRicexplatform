import React, { Component } from 'react';
import { EnumsService } from '../../../../services';
import { INCOTERMOPT } from '../../../../services/service.values';
import FormSelectDropdown from '../../../components/form/FormSelectDropdown';
import FormInputField from '../../../components/form/FormInputField';
import { getPortsByCountry } from '../../../../services/service.utils';

const Countries = EnumsService.countries();
const seaPorts = EnumsService.ports.JSON;

export default class DocumentaryInstructions extends Component {
    constructor(props) {
        super(props);
        const data = props.data
            ? {
                ...props.data.documentaryInstructions,
                instructions: props.data.shipments.map(shipment => ({
                    id: Math.floor(Math.random() * 10000),
                    amount: shipment.amount
                }))
            } : {
                instructions: [],
                packingAndMarkings: '',
                billOfLadingNotify: '',
                billOfLadingConsignee: '',
                certOfOriginNotify: '',
                certOfOriginConsignee: ''
            };
        this.state = {
            multipleSets: data.instructions && data.instructions.length > 0,
            packingAndMarkings: data.packingAndMarkings,
            instructions: data.instructions || [],
            billOfLading: {
                notify: data.billOfLadingNotify,
                consignee: data.billOfLadingConsignee
            },
            certificateOfOrigin: {
                notify: data.certOfOriginNotify,
                consignee: data.certOfOriginConsignee,
                sameAsBillOfLading: !props.data
            },
            destination: {
                country: props.trade.destCountry,
                port: props.trade.destPort
            },
            showError: false
        };
        this.updateInstruction = this.updateInstruction.bind(this);
        this.addInstruction = this.addInstruction.bind(this);
        this.removeInstruction = this.removeInstruction.bind(this);
        this.onSubmitHandler = this.onSubmitHandler.bind(this);
    }

    componentWillMount() {
        if (this.state.instructions.length === 0) {
            this.addBalanceItem();
        }
    }

    get trade() {
        return this.props.trade;
    }

    addBalanceItem() {
        this.setState({
            instructions: [{
                id: 'balance',
                amount: parseInt(this.trade.measure)
            }]
        })
    }

    addInstruction(id, amount) {
        this.setState({
            instructions: [
                ...this.state.instructions.slice(0, this.state.instructions.length - 1),
                {
                    id: id || Math.floor(Math.random() * 10000),
                    amount: amount || ''
                },
                this.state.instructions[this.state.instructions.length - 1]
            ]
        })
    }

    updateInstruction(id, index, amount) {
        const items = [...this.state.instructions];
        items[index].amount = parseInt(amount) || '';
        this.recalculateBalanceItem(items);
        this.setState({
            instructions: items
        })
    }

    removeInstruction(index) {
        const items = [...this.state.instructions];
        items.splice(index, 1);
        this.recalculateBalanceItem(items);
        this.setState({
            instructions: items
        })
    }

    recalculateBalanceItem(items) {
        const balanceItem = items.find(item => item.id === 'balance');
        balanceItem.amount = this.trade.measure - items.reduce((prev, current) => {
            if (current.id === 'balance') {
                return prev;
            }
            return prev + (parseInt(current.amount) || 0);
        }, 0);
    }

    mapInstructionsToPostParams(instructions = []) {
        if (!this.state.multipleSets) {
            return [{
                amount: parseInt(this.trade.measure),
                text: ''
            }]
        }
        return instructions.reduce((memo, instruction) => {
            if (instruction.amount && instruction.amount > 0) {
                memo.push({
                    text: '',
                    amount: instruction.amount
                });
            }
            return memo;
        }, [])
    }

    onSubmitHandler(e) {
        e.preventDefault();
        const form = e.target;
        const isValid = form.checkValidity();
        if (!isValid) {
            this.setState({showError: true});
            form.reportValidity();
            return;
        }
        this.setState({showError: false});
        const params = {
            instructions: this.mapInstructionsToPostParams([...this.state.instructions]),
            packingAndMarkings: this.state.packingAndMarkings,
            billOfLadingNotify: this.state.billOfLading.notify,
            billOfLadingConsignee: this.state.billOfLading.consignee,
            certOfOriginNotify: this.state.certificateOfOrigin.notify,
            certOfOriginConsignee: this.state.certificateOfOrigin.consignee,
            destPort: this.state.destination.port,
            destCountry: this.state.destination.country
        };
        if (this.state.certificateOfOrigin.sameAsBillOfLading) {
            params.certOfOriginNotify = params.billOfLadingNotify;
            params.certOfOriginConsignee = params.billOfLadingConsignee;
        }
        this.props.onSubmit(params);
    }

    renderDocumentaryInstructions() {
        return (
            <div className="di-form__doc-info">
                {this.trade.payment} {this.trade.paymentPeriod}
                <br/>
                The original doc to consist of:<br/>
                <ul>
                    <li>
                        Full set of 3/3 originals plus 3 (three) non-negotiable copies of 'clean on board'
                        charter party bills
                        of lading made out to order and blanked endorsed, marked 'freight prepaid' as per
                        Charter Party
                        {this.trade.incoterm === 'CIF' ? `, and showing ${Countries[this.trade.destCountry]}` : '.'}
                    </li>
                    <li>
                        Seller's original signed Invoice for the value of Product based on the Bill of
                        Lading quantity payable
                        3 business days after receipt.
                    </li>
                    <li>Certificate of origin issued by competent authority.</li>
                    <li>
                        Certificate of quality issued by contractual appointed {this.trade.inspectionName} certifying
                        that the goods
                        loaded comply fully with the specifications set forth above under clause entitled
                        "Quality".
                    </li>
                    <li>
                        Certificate issued by contractual appointed {this.trade.inspectionName} certifying that the
                        quality and
                        appearance of rice delivered is equal to or better than the above
                        mentioned {this.trade.inspectionName} sealed
                        sample.
                    </li>
                    <li>Certificate of weight issued by contractual appointed {this.trade.inspectionName}.</li>
                    <li>Certificate of packing issued by contractual appointed {this.trade.inspectionName}.</li>
                    <li>
                        Certificate of fumigation of goods effected at time of shipment of the goods from
                        the origin issued by{` `}
                        {this.trade.inspectionName}. Fumigation certificate with date after B/L date is acceptable.
                    </li>
                    <li>Phytosanitary certificate issued by competent authority</li>
                    <li>Non-GMO certificate issued by shippers.</li>
                    <li>Copy of export declaration.</li>
                    {this.trade.incoterm === 'CIF' && <li>Insurance Certificate.</li>}
                    {this.trade.specialRequest !== '' && <li>{this.trade.specialRequest}</li>}
                </ul>
                Except for the commercial invoice, third party doc are acceptable. Letters of indemnity for
                missing doc
                are not acceptable.
            </div>
        )
    }

    renderDestination = () => {
        const ports = getPortsByCountry(this.state.destination.country);
        return (
            <React.Fragment>
                <h3 className="di-form__heading">Destination</h3>
                <div className="row notify-consignee-block mb-4">
                    <div className="col">
                        <div className="row">
                            <div className="col-3">
                                <label className="modal__label" htmlFor="country">Country*:</label>
                            </div>
                            <div className="col-9">
                                <select
                                    className="di-form__input"
                                    id="country"
                                    value={this.state.destination.country}
                                    disabled={this.props.previewMode}
                                    required={true}
                                    onChange={e => this.setState({
                                            destination: {
                                                ...this.state.destination,
                                                country: e.target.value
                                            }
                                        }
                                    )}
                                >
                                    <option value="">
                                        Select
                                    </option>
                                    {Object.keys(Countries).map(i => {
                                        return (
                                            <option key={i} value={i}>
                                                {Countries[i]}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="col">
                        <div className="row">
                            <div className="col-3">
                                <label className="modal__label" htmlFor="port">Port*:</label>
                            </div>
                            <div className="col-9">
                                {Object.keys(ports).length !== 0 ? (
                                    <select
                                        className="di-form__input"
                                        id="port"
                                        value={this.state.destination.port}
                                        disabled={this.props.previewMode}
                                        required={true}
                                        onChange={e => this.setState({
                                                destination: {
                                                    ...this.state.destination,
                                                    port: e.target.value
                                                }
                                            }
                                        )}
                                    >
                                        <option value="">
                                            Select
                                        </option>
                                        {Object.keys(ports).map(i => {
                                            return (
                                                <option key={i} value={i}>
                                                    {ports[i]}
                                                </option>
                                            );
                                        })}
                                    </select>
                                ) : (
                                    <input
                                        className="di-form__input"
                                        type="text"
                                        id="port"
                                        value={this.state.destination.port}
                                        disabled={this.props.previewMode}
                                        onChange={e => this.setState({
                                                destination: {
                                                    ...this.state.destination,
                                                    port: e.target.value
                                                }
                                            }
                                        )}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    };

    render() {
        const className = this.props.isModal ? 'di-form di-form--modal' : 'di-form';
        return (
            <form onSubmit={this.onSubmitHandler} className={className} noValidate={true}>
                {this.props.isModal && (
                    <h3 className="di-form__heading">Documentary Instructions</h3>
                )}
                {!this.props.previewMode && (
                    <div className="form-check left-padded">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={this.state.multipleSets}
                            id="multipleSets"
                            disabled={this.props.previewMode}
                            onChange={e => this.setState({
                                multipleSets: e.target.checked
                            })}
                        />
                        <label className="form-check-label" htmlFor="multipleSets">
                            Multiple sets of bills of lading required
                        </label>
                    </div>
                )}
                <div className={this.state.multipleSets ? 'left-padded' : 'd-none'}>
                    <div className="row">
                        {this.state.instructions.map((instruction, index) =>
                            <div className="col-sm-12 col-md-4 mb-3" key={instruction.id}>
                                <div className="row instruction-items">
                                    <div className="col-1">
                                        {index + 1}.
                                    </div>
                                    <div className="col-4">
                                        <input
                                            type="number"
                                            className="di-form__input m-0 w-100"
                                            data-readonly={this.props.previewMode || instruction.id === 'balance'}
                                            min={1}
                                            max={this.trade.measure}
                                            disabled={this.props.previewMode}
                                            onChange={e => this.updateInstruction(instruction.id, index, e.target.value)}
                                            tabIndex={instruction.id === 'balance' ? -1 : null}
                                            value={instruction.amount}
                                        />
                                    </div>
                                    <div className="col-1">
                                        {this.trade.measurement === 'TONS' ? 'tons' : 'cwt'}
                                    </div>
                                    <div className="col-4">
                                        {!this.props.previewMode && instruction.id !== 'balance' && (
                                            <button
                                                className="btn btn-link"
                                                type="button"
                                                onClick={e => this.removeInstruction(index)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {!this.props.previewMode && (
                        <button className="btn btn-link" type="button" onClick={e => this.addInstruction()}>
                            + Add New
                        </button>
                    )}
                    <hr/>
                    <div className="total-measure">
                        Total
                        <input className="di-form__input d-inline" value={this.trade.measure}
                               readOnly={true}/>
                        {this.trade.measurement === 'TONS' ? 'tons' : 'cwt'}
                    </div>
                </div>
                {this.trade.incoterm === INCOTERMOPT.FOB && this.renderDestination()}
                <h3 className="di-form__heading">Bill of Lading</h3>
                <div className="row notify-consignee-block mb-4">
                    <div className="col">
                        <div className="row">
                            <div className="col-3">
                                <label className="modal__label" htmlFor="notifyBOL">Notify*:</label>
                            </div>
                            <div className="col-9">
                                <input
                                    className="di-form__input"
                                    type="text"
                                    id="notifyBOL"
                                    value={this.state.billOfLading.notify}
                                    disabled={this.props.previewMode}
                                    required={true}
                                    onChange={e => this.setState({
                                            billOfLading: {
                                                ...this.state.billOfLading,
                                                notify: e.target.value
                                            }
                                        }
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col">
                        <div className="row">
                            <div className="col-3">
                                <label className="modal__label" htmlFor="consigneeBOL">Consignee*:</label>
                            </div>
                            <div className="col-9">
                                <input
                                    className="di-form__input"
                                    type="text"
                                    id="consigneeBOL"
                                    value={this.state.billOfLading.consignee}
                                    disabled={this.props.previewMode}
                                    required={true}
                                    onChange={e => this.setState({
                                            billOfLading: {
                                                ...this.state.billOfLading,
                                                consignee: e.target.value
                                            }
                                        }
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {!this.props.previewMode && (
                    <div className="form-check left-padded">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={this.state.certificateOfOrigin.sameAsBillOfLading}
                            disabled={this.props.previewMode}
                            onChange={e => this.setState({
                                certificateOfOrigin: {
                                    ...this.state.certificateOfOrigin,
                                    sameAsBillOfLading: e.target.checked
                                }
                            })}
                            id="certificateOriginCheck"
                        />
                        <label className="form-check-label" htmlFor="certificateOriginCheck">
                            Use same info for certificate of origin
                        </label>
                    </div>
                )}
                <div
                    className={this.state.certificateOfOrigin.sameAsBillOfLading ? 'd-none' : ''}>
                    <h3 className="di-form__heading">Certificate of origin</h3>
                    <div className="row notify-consignee-block mb-4">
                        <div className="col">
                            <div className="row">
                                <div className="col-3">
                                    <label className="modal__label"
                                           htmlFor="certOfOriginNotify">Notify*:</label>
                                </div>
                                <div className="col-9">
                                    <input
                                        className="di-form__input"
                                        type="text"
                                        id="certOfOriginNotify"
                                        required={!this.state.certificateOfOrigin.sameAsBillOfLading}
                                        value={this.state.certificateOfOrigin.notify}
                                        disabled={this.props.previewMode}
                                        onChange={e => this.setState({
                                            certificateOfOrigin: {
                                                ...this.state.certificateOfOrigin,
                                                notify: e.target.value
                                            }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col">
                            <div className="row">
                                <div className="col-3">
                                    <label className="modal__label"
                                           htmlFor="certOfOriginConsignee">Consignee*:</label>
                                </div>
                                <div className="col-9">
                                    <input
                                        className="di-form__input"
                                        type="text"
                                        id="certOfOriginConsignee"
                                        required={!this.state.certificateOfOrigin.sameAsBillOfLading}
                                        value={this.state.certificateOfOrigin.consignee}
                                        disabled={this.props.previewMode}
                                        onChange={e => this.setState({
                                            certificateOfOrigin: {
                                                ...this.state.certificateOfOrigin,
                                                consignee: e.target.value
                                            }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <label className="modal__label">Packing & markings:</label>
                <textarea
                    onChange={e => this.setState({
                        packingAndMarkings: e.target.value
                    })}
                    placeholder="Changes in packing relative to the original trade request will not be reflected in platform prices."
                    disabled={this.props.previewMode}
                    value={this.state.packingAndMarkings}
                    className="di-form__textarea di-form__textarea--short"
                    rows="1"
                />
                {this.renderDocumentaryInstructions()}
                {!this.props.previewMode && (
                    <React.Fragment>
                        <div className="required-fields-note">
                            *Required fields
                        </div>
                        {this.state.showError && (
                            <div className="trades-dtls__error-message text-center">
                                Please, complete all required fields before submitting
                            </div>
                        )}
                        <button type="submit" className="di-form__button">
                            Submit
                        </button>
                    </React.Fragment>
                )}
            </form>
        );
    }
}
