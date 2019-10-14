import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';

//COMPONENTS
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';
import Pagination from '../../components/Pagination/pagination';
import './requests.css';
import { LoadRequests } from '../../../modules/module.trade';
import Tab from './components/Tab';
import moment from 'moment';
import { EnumsService } from '../../../services/service.utils';
import MdMoreVert from 'react-icons/lib/md/more-vert';
import SortArrows from './components/SortArrows';

//values
import { REQUESTTYPES, DATEFORMAT } from '../../../services/service.values';
import Preloader from '../../components/preloader/Preloader';

const Countries = EnumsService.countries();

class Requests extends Component {
    state = {
        requests: {},
        skip: 0,
        take: 25,
        selectedTabId: 1,
        type: 'all',
        sorting: {
            createdAt: 'desc'
        }
    };

    componentWillMount = () => {
        this.fetchFunction(0, 25);
    };

    isActive = id => {
        return this.state.selectedTabId === id;
    };

    setActiveTab = selectedTabId => {
        let type;
        selectedTabId == 1 ? (type = 'all') : selectedTabId == 2 ? (type = 'inbound') : (type = 'outbound');
        this.setState({selectedTabId: selectedTabId, type: type}, () => {
            this.fetchFunction(0, 25, this.state.type);
        });
    };

    getItems = type => {
        let test = 'all';
        let requests = this.props.trade.items;
        return requests[type];
    };

    getStatus = item => {
        return item.validateDate && moment().diff(moment(item.validateDate), 'minutes') > 0
            ? 'CANCELED'
            : item.requestStatus;
    };

    fetchFunction = (skipNumber, take) => {
        const data = {
            skip: skipNumber,
            take: take,
            type: this.state.type,
            sort: Object.keys(this.state.sorting)[0], // ge the first key of sorting (because we can't know, what user gonna choose)
            order: this.state.sorting[Object.keys(this.state.sorting)[0]] // get value of first key
        };
        this.props.LoadRequests(data);
        this.setState({
            skip: skipNumber,
            take
        });
    };

    pushFunction = (status, itemId) => {
        switch (status) {
            case 'NEW':
            case 'DECLINED':
            case 'CANCELED':
                this.props.navigate('/details/' + itemId);
                break;
            case 'DEAL':
            case 'INITIATE':
                this.props.history.push(`/trades/details/` + itemId);
                break;
            default:
                this.props.history.push(`/requests/details/` + itemId);
                break;
        }
    };

    setSorting = (sortName, value) => {
        if (this.state.sorting[sortName] === value) {
            // if sorting was already on - disable it (just how ux is works)
            this.setState(
                {
                    sorting: {
                        createdAt: 'desc'
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
        const tabsItems = [{id: 1, name: 'My Requests'}, {id: 2, name: 'Inbound'}, {id: 3, name: 'Outbound'}];

        const tabs = tabsItems.map((el, i) => {
            return (
                <Tab key={i} content={el.name} isActive={this.isActive(el.id)}
                     onActiveTab={() => this.setActiveTab(el.id)}/>
            );
        });

        return (
            <div>
                <Header/>
                <section className="requests">
                    <h2 className="requests__heading">
                        Trade Requests
                    </h2>
                    <div className="requests__tabs">{tabs}</div>
                    <div className="requests__table">
                        <div className="requests__row requests__row_heading">
                            <div className="requests__cell requests__cell_heading">ID</div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Type</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="requestType"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Buyer</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="buyer"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Seller</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="seller"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Vessel/ container</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="shipping"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Quantity</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="measurement"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Price</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="price"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Origin</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="origin"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Rice Type</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="riceType"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">
                                    Shipping/ <br/>Delivery period start
                                </span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="deliveryStartDate"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">
                                    Shipping/ <br/>Delivery period end
                                </span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="deliveryEndDate"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Creation Date</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="createdAt"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                            <div className="requests__cell requests__cell_heading">
                                <span className="requests__hwrapper">Request Status</span>
                                <SortArrows
                                    selected={this.state.sorting}
                                    name="request_status"
                                    onClick={(name, value) => this.setSorting(name, value)}
                                />
                            </div>
                        </div>

                        <Preloader style="swirl" loading={this.props.loading}>
                            {this.props.trade.items[this.state.type] &&
                            this.getItems(this.state.type).map((k, i) => {
                                let item = k;
                                return (
                                    <div
                                        className={`requests__row requests__row_${this.getStatus(item).toLowerCase()}${item.ownerId === this.props.user.id ? ' requests__row--own' : ''}`}
                                        onClick={() => {
                                            this.pushFunction(
                                                item.status === 'NEW' || item.status === 'CANCELED' || item.status === 'DECLINED'
                                                    ? item.status
                                                    : 'DEAL',
                                                item.id
                                            );
                                        }}
                                        key={i}>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">{item.id}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">{REQUESTTYPES[item.requestType]}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">{item.buyer ? item.buyer :
                                                <span>-</span>}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">{item.seller ? item.seller :
                                                <span>-</span>}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">{item.shipping}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">
                                                {item.measure} {item.measurement === 'TONS' ? 'tons' : 'cwt'}
                                            </span>
                                        </div>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">${item.price}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">{Countries[item.origin]}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span className="requests__overflow">{item.riceType}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span
                                                className="requests__overflow">{moment(item.deliveryStartDate).format(DATEFORMAT)}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span
                                                className="requests__overflow">{moment(item.deliveryEndDate).format(DATEFORMAT)}</span>
                                        </div>
                                        <div className="requests__cell">
                                            <span
                                                className="requests__overflow">{moment(item.createdAt).format(DATEFORMAT)}</span>
                                        </div>
                                        <div className="requests__cell requests__cell__status">
                                            <span className="status">{this.getStatus(item)}</span>
                                        </div>
                                        <span className="requests__more-circle">
                                            <MdMoreVert className="more-icon"/>
                                        </span>
                                    </div>
                                );
                            })}
                        </Preloader>
                    </div>

                    {this.props.trade.counts != undefined && //check, that counts even exist
                    this.props.trade.counts != 0 && // check, that count snot 0
                    (this.state.type === 'all' // in parenthesis one big bool, and check, that we retrieving trades of type all
                        ? this.props.trade.counts > 25 // does trades more than 25?
                        : this.state.type === 'outbound' // is type of trades is sell?
                            ? this.props.trade.countsOutbound > 25 // does sell trades more than 25?
                            : this.props.trade.countsInbound > 25) && ( //does buy trades more than 25?
                        <Pagination // if all bool is true - show pagination
                            fetchFunction={(skipNumber, take) => this.fetchFunction(skipNumber, take)}
                            itemsPerPage={25}
                            pagesAtOnce={4}
                            totalItemsCount={
                                this.state.type === 'all'
                                    ? this.props.trade.counts
                                    : this.state.type === 'outbound'
                                    ? this.props.trade.countsOutbound
                                    : this.props.trade.countsInbound
                            }
                        />
                    )}
                </section>
                <Footer/>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        counts: state.trade.counts,
        trade: state.trade,
        loading: state.loading.requestLoading,
        user: state.account.user
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            navigate: path => push('/requests' + path),
            LoadRequests
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(Requests);
