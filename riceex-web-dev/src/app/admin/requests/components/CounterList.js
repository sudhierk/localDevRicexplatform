import React, { Component } from 'react';
import { PAYMENTTERMSOPT } from '../../../../services/service.values';


class CounterList extends Component {

    getCompanyName = companyId => {
        if (this.props.trade.buyerId === companyId) {
            return this.props.trade.buyer;
        } else if (this.props.trade.sellerId === companyId) {
            return this.props.trade.seller;
        } else {
            return '';
        }
    };

    onCounter = bid => {
        return () => this.props.onCounter(bid);
    };

    renderButtons = (bid, index) => {
        if (index !== 0) {
            return null;
        }
        if (bid.status === 'NEW' && bid.toCompanyID === this.props.user.id) {
            return (
                <React.Fragment>
                    {bid.price !== 0 && bid.price !== '0' && (
                        <button className="accept" onClick={this.props.onAccept}>
                            Accept
                        </button>
                    )}
                    <button className="decline" onClick={this.props.onDecline}>
                        Decline
                    </button>
                    <button className="counter" onClick={this.onCounter(bid)}>
                        Counter
                    </button>
                </React.Fragment>
            );
        } else if (bid.status === 'DECLINED' && bid.fromCompanyID === this.props.user.id) {
            return (
                <button className="counter" onClick={this.onCounter(bid)}>
                    Counter
                </button>
            )
        }
        return null;
    };

    render() {
        const {trade} = this.props;
        return (
            <div className="counter__table">
                <div className="counter__row counter__row_heading">
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">From</span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">To</span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span
                            className="counter__hwrapper">Quantity {trade.measurement === 'TONS' ? 'tons' : 'cwt'}</span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">Price</span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">Crop year</span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">Shipping</span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">Payment terms</span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">Load/Discharge terms</span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">
                            Required Documents
                        </span>
                    </div>
                    <div className="counter__cell counter__cell_heading">
                        <span className="counter__hwrapper">
                            Actions
                        </span>
                    </div>
                </div>

                {this.props.bids &&
                this.props.bids.map((k, i) => {
                    let item = k;
                    return (
                        <div className={`counter__row`} key={i}>
                            <div className="counter__cell">
                                    <span
                                        className="counter__overflow">{this.getCompanyName(item.fromCompanyID)}</span>
                            </div>
                            <div className="counter__cell">
                                    <span
                                        className="counter__overflow">{this.getCompanyName(item.toCompanyID)}</span>
                            </div>
                            <div className="counter__cell">
                                    <span className="counter__overflow">
                                        {trade.measure}
                                    </span>
                            </div>
                            <div className="counter__cell">
                                    <span className="counter__overflow">
                                        ${item.price}
                                    </span>
                            </div>
                            <div className="counter__cell">
                                <span className="counter__overflow">{trade.cropYear}</span>
                            </div>
                            <div className="counter__cell">
                                    <span className="counter__overflow">
                                        {trade.shipping}
                                    </span>
                            </div>
                            <div className="counter__cell">
                                <span
                                    className="counter__overflow">{PAYMENTTERMSOPT[trade.payment]} {trade.paymentPeriod}</span>
                            </div>
                            <div className="counter__cell">
                                <span className="counter__overflow">{trade.discharge}</span>
                            </div>
                            <div className="counter__cell">
                                <span className="counter__overflow">Default list of required documents</span>
                            </div>
                            <div className="counter__cell">
                                <span className="counter__overflow">
                                    {this.renderButtons(item, i)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    }
}

export default CounterList;