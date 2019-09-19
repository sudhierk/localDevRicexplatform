import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';

import Pagination from '../../components/Pagination/pagination';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';
import { LoadRequests } from '../../../modules/module.trade';
import TableHeader from './components/TableHeader';
import TableContent from './components/TableContent';
import Preloader from '../../components/preloader/Preloader';
import './exchange.css';

class Exchange extends Component {
    state = {
        isBidsShow: true,
        isBidsFull: false,
        isOffersShow: true,
        isOffersFull: false,
        skipBids: '',
        takeBids: '',
        skipOffers: '',
        takeOffers: '',
        sortingBids: {
            createdAt: 'desc'
        },
        sortingOffers: {
            createdAt: 'desc'
        }
    };

    componentWillMount = () => {
        this.fetchFunctionBids(0, 25);
        this.fetchFunctionOffers(0, 25);
    };

    handleInfoBids = () => {
        if (this.state.isBidsShow && !this.state.isOffersShow) {
            this.setState({
                isBidsFull: false,
                isOffersFull: false
            });
        } else {
            this.setState({
                isBidsFull: true
            });
        }
        this.setState({
            isOffersShow: !this.state.isOffersShow,
            isBidsShow: true
        });
    };

    handleInfoOffers = () => {
        if (!this.state.isBidsShow && this.state.isOffersShow) {
            this.setState({
                isBidsFull: false,
                isOffersFull: false
            });
        } else {
            this.setState({
                isOffersFull: true
            });
        }
        this.setState({
            isBidsShow: !this.state.isBidsShow,
            isOffersShow: true
        });
    };

    fetchFunctionBids = (skipNumber, take) => {
        const data = {
            skip: skipNumber,
            type: 'buy',
            take: take,
            page: 'exchange',
            sort: Object.keys(this.state.sortingBids)[0], // ge the first key of sorting (because we can't know, what user gonna choose)
            order: this.state.sortingBids[Object.keys(this.state.sortingBids)[0]] // get value of first key
        };
        this.props.LoadRequests(data);
        this.setState({
            skipBids: skipNumber,
            takeBids: take
        });
    };
    fetchFunctionOffers = (skipNumber, take) => {
        const data = {
            skip: skipNumber,
            type: 'sell',
            take: take,
            page: 'exchange',
            sort: Object.keys(this.state.sortingOffers)[0], // ge the first key of sorting (because we can't know, what user gonna choose)
            order: this.state.sortingOffers[Object.keys(this.state.sortingOffers)[0]] // get value of first key
        };
        this.props.LoadRequests(data);
        this.setState({
            skipOffers: skipNumber,
            takeOffers: take
        });
    };

    setSortingBids = (sortName, value) => {
        // console.log(sortName, value, this.state);

        if (this.state.sortingBids[sortName] === value) {
            // if sorting was already on - disable it (just how ux is works)
            this.setState(
                {
                    sortingBids: {
                        createdAt: 'desc'
                    }
                },
                () => this.fetchFunctionBids(this.state.skipBids, this.state.takeBids)
            );
        } else {
            this.setState(
                {
                    sortingBids: {
                        [sortName]: value
                    }
                },
                () => this.fetchFunctionBids(this.state.skipBids, this.state.takeBids)
            );
        }
    };

    setSortingOffers = (sortName, value) => {
        if (this.state.sortingOffers[sortName] === value) {
            // if sorting was already on - disable it (just how ux is works)
            this.setState(
                {
                    sortingOffers: {
                        createdAt: 'desc'
                    }
                },
                () => this.fetchFunctionOffers(this.state.skipOffers, this.state.takeOffers)
            );
        } else {
            this.setState(
                {
                    sortingOffers: {
                        [sortName]: value
                    }
                },
                () => this.fetchFunctionOffers(this.state.skipOffers, this.state.takeOffers)
            );
        }
    };

    render() {
        const {trade} = this.props;
        if (!trade) return null;
        return (
            <div>
                <Header/>
                {!this.state.isBidsFull &&
                !this.state.isOffersFull && (
                    <div className="container-fluid">
                        <div className="exchange">
                            <div className="row">
                                {this.state.isBidsShow && (
                                    <React.Fragment>
                                        <div
                                            className={`col-lg-6 pgn ${this.props.trade.countsBuy > 25 ? 'full' : ''}`}>
                                            <div className="row justify-content-between align-items-center">
                                                <span className="exchange__heading">
                                                    Buying interest
                                                </span>
                                                <span className="exchange__more exchange__more_bids"
                                                      onClick={this.handleInfoBids}>
                                                    {this.state.isBidsShow && this.state.isOffersShow ? 'More info' : 'Less info'}
                                                </span>
                                            </div>

                                            <div className="row exchange__equality">
                                                <div className="exchange__table exchange__table_bids">
                                                    <TableHeader
                                                        loading={this.props.loading}
                                                        isFull={this.state.isBidsFull}
                                                        name={'bids'}
                                                        selected={this.state.sortingBids}
                                                        onClickBids={(name, value) => this.setSortingBids(name, value)}
                                                    />

                                                    <Preloader style="swirl" loading={this.props.loading}>
                                                        {this.props.trade &&
                                                        this.state.isBidsShow &&
                                                        this.props.trade.items.buy &&
                                                        this.props.trade.items.buy.map((k, i) => {
                                                            let item = k;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`exchange__row${item.ownerId === this.props.user.id ? ' exchange__row--own' : ''}`}
                                                                    onClick={() => {
                                                                        this.props.navigate('/details/' + item.id);
                                                                    }}
                                                                >
                                                                    <TableContent item={item}
                                                                                  isFull={this.state.isBidsFull}/>
                                                                </div>
                                                            );
                                                        })}
                                                    </Preloader>
                                                </div>
                                            </div>

                                            {/*this.props.trade.countsBuy > 25 && (
                                              <Pagination
                                                fetchFunction={(skipNumber, take) => this.fetchFunctionBids(skipNumber, take)}
                                                itemsPerPage={25}
                                                pagesAtOnce={4}
                                                totalItemsCount={this.props.trade.countsBuy}
                                              />
                                            )*/}
                                        </div>
                                    </React.Fragment>
                                )}

                                {this.state.isOffersShow && (
                                    <div className={`col-lg-6 pgn ${this.props.trade.countsSell > 25 ? 'full' : ''}`}>
                                        <div className="row justify-content-between align-items-center">
                                            <span className="exchange__heading">Selling interest</span>
                                            <span className="exchange__more" onClick={this.handleInfoOffers}>
                                                {this.state.isBidsShow && this.state.isOffersShow ? 'More info' : 'Less info'}
                                            </span>
                                        </div>
                                        <div className="row exchange__equality">
                                            <div className="exchange__table">
                                                <TableHeader
                                                    selected={this.state.sortingOffers}
                                                    onClickOffers={(name, value) => this.setSortingOffers(name, value)}
                                                    isFull={this.state.isOffersFull}
                                                    name={'offers'}
                                                />

                                                <Preloader style="swirl" loading={this.props.loading}>
                                                    {this.props.trade &&
                                                    this.props.trade.items.sell &&
                                                    this.props.trade.items.sell.map((k, i) => {
                                                        let item = k;
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`exchange__row exchange__row_offers${item.ownerId === this.props.user.id ? ' exchange__row--own' : ''}`}
                                                                onClick={() => {
                                                                    this.props.navigate('/details/' + item.id);
                                                                }}>
                                                                <TableContent item={item} isFull={this.state.isOffersFull}/>
                                                            </div>
                                                        );
                                                    })}
                                                </Preloader>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="exchange__pagination">
                                    {this.props.trade.countsBuy > 25 && (
                                        <div className="exchange__pagination--item">
                                            <Pagination
                                                fetchFunction={(skipNumber, take) => this.fetchFunctionBids(skipNumber, take)}
                                                itemsPerPage={25}
                                                pagesAtOnce={4}
                                                totalItemsCount={this.props.trade.countsBuy}
                                            />
                                        </div>
                                    )}
                                    {this.props.trade.countsSell > 25 && (
                                        <div className="exchange__pagination--item">
                                            <Pagination
                                                fetchFunction={(skipNumber, take) => this.fetchFunctionOffers(skipNumber, take)}
                                                itemsPerPage={25}
                                                pagesAtOnce={4}
                                                totalItemsCount={this.props.trade.countsSell}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {this.state.isBidsFull &&
                this.state.isBidsShow && (
                    <section className="exchange-detailed">
                        <div className="container-fluid">
                            <div className="row justify-content-between">
                                <span className="exchange-detailed__heading">
                                    Buying interest
                                </span>
                                <span className="exchange-detailed__less" onClick={this.handleInfoBids}>
                                    {this.state.isBidsShow && this.state.isOffersShow ? 'More info' : 'Less info'}
                                </span>
                            </div>
                            <div className="row">
                                <div className="exchange-detailed__table">
                                    <TableHeader
                                        selected={this.state.sortingBids}
                                        onClickBids={(name, value) => this.setSortingBids(name, value)}
                                        isFull={this.state.isBidsFull}
                                        name={'bids'}
                                    />

                                    <Preloader style="swirl" loading={this.props.loading}>
                                        {this.props.trade &&
                                        this.state.isBidsShow &&
                                        this.props.trade.items.buy &&
                                        this.props.trade.items.buy.map((k, i) => {
                                            let item = k;
                                            return (
                                                <div
                                                    key={i}
                                                    className={`exchange-detailed__row exchange-detailed__row_deal${item.ownerId === this.props.user.id ? ' exchange__row--own' : ''}`}
                                                    onClick={() => {
                                                        this.props.navigate('/details/' + item.id);
                                                    }}
                                                >
                                                    <TableContent item={item} isFull={this.state.isBidsFull}/>
                                                </div>
                                            );
                                        })}
                                    </Preloader>
                                </div>
                                {this.props.trade.countsBuy > 25 && (
                                    <Pagination
                                        fetchFunction={(skipNumber, take) => this.fetchFunctionBids(skipNumber, take)}
                                        itemsPerPage={25}
                                        pagesAtOnce={4}
                                        totalItemsCount={this.props.trade.countsBuy}
                                    />
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {this.state.isOffersFull &&
                this.state.isOffersShow && (
                    <section className="exchange-detailed">
                        <div className="container-fluid">
                            <div className="row justify-content-between">
                                <span className="exchange-detailed__heading">Selling interest</span>
                                <span className="exchange-detailed__less" onClick={this.handleInfoOffers}>
                                    {this.state.isBidsShow && this.state.isOffersShow ? 'More info' : 'Less info'}
                                </span>
                            </div>
                            <div className="row">
                                <div className="exchange-detailed__table">
                                    <TableHeader
                                        selected={this.state.sortingOffers}
                                        onClickOffers={(name, value) => this.setSortingOffers(name, value)}
                                        isFull={this.state.isOffersFull}
                                        name={'offers'}
                                    />

                                    <Preloader style="swirl" loading={this.props.loading}>
                                        {this.props.trade &&
                                        this.props.trade.items.sell &&
                                        this.props.trade.items.sell.map((k, i) => {
                                            let item = k;
                                            return (
                                                <div
                                                    key={i}
                                                    className={`exchange-detailed__row${item.ownerId === this.props.user.id ? ' exchange__row--own' : ''}`}
                                                    onClick={() => {
                                                        this.props.navigate('/details/' + item.id);
                                                    }}
                                                >
                                                    <TableContent item={item} isFull={this.state.isOffersFull}/>
                                                </div>
                                            );
                                        })}
                                    </Preloader>
                                </div>
                                {this.props.trade.countsSell > 25 && (
                                    <Pagination
                                        fetchFunction={(skipNumber, take) => this.fetchFunctionOffers(skipNumber, take)}
                                        itemsPerPage={25}
                                        pagesAtOnce={4}
                                        totalItemsCount={this.props.trade.countsSell}
                                    />
                                )}
                            </div>
                        </div>
                    </section>
                )}
                <Footer/>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        trade: state.trade,
        loading: state.loading.requestLoading,
        user: state.account.user
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            navigate: path => push('/exchange' + path),
            LoadRequests
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(Exchange);
