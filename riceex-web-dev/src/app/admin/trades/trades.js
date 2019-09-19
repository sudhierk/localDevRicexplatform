import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { LoadInspectionTradeList, LoadRequests } from '../../../modules/module.trade';
import { push } from 'react-router-redux';
import moment from 'moment';
//COMPONENTS
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';
import Pagination from '../../components/Pagination/pagination';
import SortArrows from './components/SortArrowsTrade';

import './trades.css';
import { DATEFORMAT, TRADE_STATUS, TRADE_STATUS_HUMANIZE } from '../../../services/service.values';
import AccessControl, { INSPECTION_COMPANY } from '../../components/AccessControl';
import Preloader from '../../components/preloader/Preloader';

class Trades extends Component {
    state = {
        skip: 0,
        take: 25,
        sorting: {
            createdAt: 'desc'
        }
    };

    componentWillMount = () => {
        this.fetchFunction(0, 25);
    };

    fetchFunction = (skip, take) => {
        const data = {
            skip: skip,
            take: take,
            type: 'all',
            status: 'DEAL',
            page: 'trade',
            sort: Object.keys(this.state.sorting)[0], // ge the first key of sorting (because we can't know, what user gonna choose)
            order: this.state.sorting[Object.keys(this.state.sorting)[0]] // get value of first key
        };
        if (this.props.user.companyType === INSPECTION_COMPANY) {
            this.props.LoadInspectionTradeList(data);
        } else {
            this.props.LoadRequests(data);
        }
        this.setState({});
    };

    getItems = () => {
        let requests = this.props.trade.items;
        return requests.all;
    };

    setSorting = (sortName, value) => {
        if (this.state.sorting[sortName] === value) {
            // if sorting was already on - disable it (just how ux is works)
            this.setState(
                {
                    sorting: {
                        [sortName]: ''
                    }
                },
                () => this.fetchFunction(this.state.skip, this.state.take)
            );
        } else {
            this.setState(
                {
                    sorting: {
                        [sortName]: value
                    }
                },
                () => this.fetchFunction(this.state.skip, this.state.take)
            );
        }
    };

    render() {
        return (
            <React.Fragment>
                <Header/>
                <section className="trades">
                    <h2 className="trades__heading">Trades Board</h2>
                    <div className="trades__table">
                        <div className="trades__row trades__row_heading">
                            <div className="trades__cell trades__cell_heading">
                                <span className="trades__hwrapper">Trade ID</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="ID"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="trades__cell trades__cell_heading">
                                <span className="trades__hwrapper">Buyer</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="buyer"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="trades__cell trades__cell_heading">
                                <span className="trades__hwrapper">Seller</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="seller"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="trades__cell trades__cell_heading">
                                <span className="trades__hwrapper">Trade Status</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="status"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="trades__cell trades__cell_heading">
                                <span className="trades__hwrapper">Quantity</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="measurement"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <AccessControl user={this.props.user} excludeCompanyTypes={[INSPECTION_COMPANY]} renderNoAccess={<div className="d-none"/>}>
                                <div className="trades__cell trades__cell_heading">
                                    <span className="trades__hwrapper">Price</span>
                                    <SortArrows
                                        selected={this.state.sorting}
                                        name="price"
                                        onClick={(name, value) => this.setSorting(name, value)}
                                    />
                                </div>
                            </AccessControl>
                            <div className="trades__cell trades__cell_heading">
                                <span className="trades__hwrapper">Rice Type</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="riceType"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <AccessControl user={this.props.user} renderNoAccess={<div className="d-none"/>} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                                <div className="trades__cell trades__cell_heading">
                                    <span className="trades__hwrapper">
                                        Contract<br/> creation date
                                    </span>
                                    <SortArrows
                                        selected={this.state.sorting}
                                        name="createdAt"
                                        onClick={(name, value) => this.setSorting(name, value)}
                                    />
                                </div>
                            </AccessControl>
                            <div className="trades__cell trades__cell_heading">
                                <span className="trades__hwrapper">
                                    Shipping/ <br/>Delivery period start
                                </span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="deliveryStartDate"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="trades__cell trades__cell_heading">
                                <span className="trades__hwrapper">
                                    Shipping/ <br/>Delivery period end
                                </span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="deliveryEndDate"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                        </div>

                        <Preloader style="swirl" loading={this.props.loading}>
                            {this.props.trade &&
                            this.getItems().map((item, i) => {

                                return (
                                    <div className={`trades__row${item.ownerId === this.props.user.id ? ' trades__row--own' : ''}`} key={i}
                                         onClick={() => this.props.navigate('/details/' + item.id)}>
                                        <div className="trades__cell">
                                            <span className="trades__overflow">{item.id}</span>
                                        </div>
                                        <div className="trades__cell">
                                            <span className="trades__overflow">{item.buyer}</span>
                                        </div>
                                        <div className="trades__cell">
                                            <span className="trades__overflow">{item.seller}</span>
                                        </div>
                                        <div className={`trades__cell trades__cell_status trades__cell_status--${TRADE_STATUS[item.status]}`}>
                                            {TRADE_STATUS_HUMANIZE[TRADE_STATUS[item.status]]}
                                        </div>
                                        <div className="trades__cell">
                                        <span className="trades__overflow">
                                            {item.measure} {item.measurement === 'TONS' ? 'tons' : 'cwt'}
                                        </span>
                                        </div>
                                        <AccessControl user={this.props.user} excludeCompanyTypes={[INSPECTION_COMPANY]} renderNoAccess={<div className="d-none"/>}>
                                            <div className="trades__cell">
                                                <span className="trades__overflow">${item.price}</span>
                                            </div>
                                        </AccessControl>
                                        <div className="trades__cell">
                                            <span className="trades__overflow">{item.riceType}</span>
                                        </div>
                                        <AccessControl user={this.props.user} excludeCompanyTypes={[INSPECTION_COMPANY]} renderNoAccess={<div className="d-none"/>}>
                                            <div className="trades__cell">
                                            <span
                                                className="trades__overflow">{moment(item.createdAt).format(DATEFORMAT)}</span>
                                            </div>
                                        </AccessControl>
                                        <div className="trades__cell">
                                        <span
                                            className="trades__overflow">{moment(item.deliveryStartDate).format(DATEFORMAT)}</span>
                                        </div>
                                        <div className="trades__cell">
                                        <span
                                            className="trades__overflow">{moment(item.deliveryEndDate).format(DATEFORMAT)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </Preloader>
                    </div>
                    {this.props.counts > 25 && (
                        <Pagination
                            fetchFunction={(skipNumber, take) => this.fetchFunction(skipNumber, take)}
                            itemsPerPage={25}
                            pagesAtOnce={4}
                            totalItemsCount={this.props.counts}
                        />
                    )}
                </section>
                <Footer/>
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => {
    return {
        counts: state.trade.counts,
        trade: state.trade,
        user: state.account.user,
        loading: state.loading.requestLoading
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            LoadRequests,
            LoadInspectionTradeList,
            navigate: path => push('/trades' + path)
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(Trades);
