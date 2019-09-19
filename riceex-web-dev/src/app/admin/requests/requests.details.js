import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';
import {
    getMessage,
    ReplyMessage,
    PostMessage,
    loadRequestDetails,
    SmartTrade,
    ClearTradeState, CounterTrade, AcceptTradeBid, DeclineTradeBid, LoadTradeBids, AutoupdateTriggered
} from '../../../modules/module.trade';
import { LoadingInitiate } from '../../../modules/module.loading';
import './requests.details.css';

//COMPONENTS
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';
import Message from './components/Message';
import moment from 'moment-timezone';
import { EnumsService } from '../../../services/service.utils';

import GoPencil from 'react-icons/lib/go/pencil';
// values
import {
    DATEFORMAT,
    PAYMENTTERMSOPT,
    MEASUREMENTS,
    DATEFORMATHOURS,
    TRADE_STATUS, INCOTERMOPT
} from '../../../services/service.values';
import { Link } from 'react-router-dom';
import Preloader from '../../components/preloader/Preloader';
import FormInputField from '../../components/form/FormInputField';
import CounterProposal from './components/CounterProposal';
import CounterList from './components/CounterList';

const Countries = EnumsService.countries();

class RequestDetails extends Component {
    constructor(props) {
        super(props);
        this.textArea = React.createRef();
    }

    state = {
        input: '',
        counterModal: {
            show: false,
            bid: {}
        }
    };

    componentWillMount() {
        this.loadRequestData();
    }

    componentWillUnmount = () => {
        this.props.ClearTradeState();
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const params = new URLSearchParams(window.location.search);
        const forceUpdateParam = params.get('forceUpdate');
        if (forceUpdateParam) {
            const forceUpdate = forceUpdateParam === 'true';
            if (forceUpdate) {
                this.loadRequestData();
            }
            const newLocationSearch = this.props.locationSearch.replace(/(&|\\?)forceUpdate=(true|false)/g, '');
            this.props.navigate(window.location.pathname + newLocationSearch);
        }
        if (prevProps.match.params.id !== this.props.match.params.id) {
            this.props.ClearTradeState();
            this.loadRequestData();
        }
        if (!prevProps.trade.shouldTriggerTradeUpdate && this.props.trade.shouldTriggerTradeUpdate) {
            this.props.AutoupdateTriggered();
            this.loadRequestData();
        }
        if (this.props.trade.items.single && this.props.trade.items.single.status && !['NEW', 'DECLINED', 'CANCELED'].includes(this.props.trade.items.single.status)) {
            this.props.navigateDeal('/details/' + this.props.match.params.id);
        }
    }

    loadRequestData() {
        const {match, getMessage, PostMessage} = this.props;
        this.props.loadRequestDetails(match.params.id);
        this.props.loadBids(match.params.id);
        getMessage(match.params.id);
    }

    acceptBid = () => {
        this.props.acceptBid(this.props.match.params.id, () => {
            this.props.navigateDeal('/details/' + this.props.match.params.id);
        });
    };

    declineBid = () => {
        this.props.declineBid(this.props.match.params.id);
    };

    closeCounterModal = () => {
        this.setState({counterModal: {...this.state.counterModal, show: false, bid: {}}});
    };

    reply = messageID => {
        this.props.ReplyMessage(messageID, this.props.account.user.id);
        this.setState({});
    };

    get canComment() {
        const trade = this.props.trade.items.single || {};
        return ['NEW', 'DEAL'].includes(trade.status);
    }

    postMessage = (e, messageID) => {
        e.preventDefault();
        if (this.state.input !== '') {
            let message = {
                parentId: messageID,
                requestId: parseInt(this.props.match.params.id),
                userId: this.props.account.user.id,
                companyId: this.props.account.token.companyId,
                text: this.state.input
            };
            this.props.PostMessage(this.props.match.params.id, message);
        }
    };

    postRootMessage = (e, value) => {
        e.preventDefault();
        if (value !== '') {
            let message = {
                parentId: null,
                requestId: parseInt(this.props.match.params.id),
                userId: this.props.account.user.id,
                companyId: this.props.account.token.companyId,
                text: value
            };
            this.props.PostMessage(this.props.match.params.id, message);
            this.textArea.current.value = '';
        }
    };

    getReply = value => {
        this.setState({
            input: value
        });
    };

    smartNewActions = request => {
        // console.log(this.props.account.token.companyId, request.sellerId, request.buyerId )
        let isOwner = this.props.account.token.companyId === request.ownerId;
        // console.log(isOwner)
        if (isOwner) {
            return (
                <button
                    className="request-dtls__button request-dtls__button_cancel"
                    disabled={this.props.loadingInitiate}
                    onClick={r => {
                        this.props.LoadingInitiate(true);
                        this.props.cancel(request.id, r => {
                            this.props.LoadingInitiate(false);
                            if (r.status === TRADE_STATUS.DEAL) {
                                this.props.navigateDeal('/details/' + this.props.match.params.id);
                            } else {
                                this.props.navigateDecline('/requests');
                            }
                        })
                    }}
                >
                    <Preloader style="dots" loading={this.props.loadingInitiate}>
                        <span>Cancel</span>
                    </Preloader>
                </button>
            );
        } else {
            // console.log('Not owner')
            if (request.price !== 0 && request.price !== '0' && (!request.sellerId || !request.buyerId)) {
                return (
                    <button
                        className="request-dtls__button request-dtls__button_accept"
                        disabled={this.props.loadingInitiate}
                        onClick={() => {
                            this.props.LoadingInitiate(true);
                            this.props.accept(request.id, () => {
                                this.props.LoadingInitiate(false);
                                this.props.navigateDeal('/details/' + this.props.match.params.id);
                            });
                        }}
                    >
                        <Preloader style="dots" loading={this.props.loadingInitiate}>
                            <span>Accept</span>
                        </Preloader>
                    </button>
                );
            } else if (
                (request.sellerId === this.props.account.token.companyId ||
                    request.buyerId === this.props.account.token.companyId) &&
                this.props.trade.bids.length === 0
            ) {
                return (
                    <React.Fragment>
                        {request.price !== 0 && request.price !== '0' && (
                            <button
                                className="request-dtls__button request-dtls__button_accept"
                                onClick={() => {
                                    this.props.LoadingInitiate(true);
                                    this.props.accept(request.id, () => {
                                        this.props.LoadingInitiate(false);
                                        this.props.navigateDeal('/details/' + this.props.match.params.id);
                                    });
                                }}
                            >
                                <Preloader style="dots" loading={this.props.loadingInitiate}>
                                    <span>Accept</span>
                                </Preloader>
                            </button>
                        )}
                        <button
                            className="request-dtls__button request-dtls__button_decline"
                            onClick={() =>
                                this.props.reject(request.id, r => {
                                    this.props.navigateDecline('/requests');
                                })
                            }
                        >
                            Decline
                        </button>
                        <button
                            className="request-dtls__button request-dtls__button_counter"
                            onClick={() => this.setState({counterModal: {...this.state.counterModal, show: true}})}
                        >
                            Counter
                        </button>
                    </React.Fragment>
                );
            }
        }
    };

    smartActions = request => {
        // console.log(request)
        // console.log(request.Status)
        switch (request.status) {
            case 'NEW':
                return this.smartNewActions(request);
            default:
                // this.displayState(request);
                return;
        }
    };

    displayState = request => {
        switch (request.status) {
            case 'NEW':
                return null;

            default:
                break;
        }
    };

    render() {
        const request = this.props.trade.items.single || {};

        return (
            <div>
                <Header/>
                <Preloader loading={this.props.requestLoading} style="overflow-spinner"/>

                <div className="request-dtls">
                    <div className="request-dtls__wrapper">
                        <div className="container-fluid">
                            <div className="row justify-content-between mb-2 mt-2">
                                <Link
                                    to={request.sellerId === null || request.buyerId === null ? '/exchange' : '/requests'}>
                                    <div className="request-dtls__back">Back</div>
                                </Link>
                                {request.ownerId === this.props.account.token.companyId && request.status === 'NEW' ? (
                                    <div
                                        className="request-dtls__edit"
                                        onClick={() => {
                                            this.props.navigate(`/requests/update/${request.id}`);
                                        }}
                                    >
                                        {request.validateDate && moment().diff(moment(request.validateDate), 'minutes') > 0 ? null : (
                                            <React.Fragment>
                                                <GoPencil/> Edit request
                                            </React.Fragment>
                                        )}
                                    </div>
                                ) : (
                                    ''
                                )}
                            </div>
                            <div className="row localChanges">
                                <div className="col-lg-12 mb-3">
                                    <div className="request-dtls__status-block">
                                        <div className="row">
                                            <span className="request-dtls__id">ID{request.id}</span>
                                            <span className="request-dtls__date">
                                                Creation Date {moment(request.createdAt).format(DATEFORMAT)}{' '}
                                                <span
                                                    className={`bold status status--${
                                                        request.validateDate && moment().diff(moment(request.validateDate), 'minutes') > 0
                                                            ? 'CANCELED'
                                                            : request.status
                                                        }`}
                                                >
                                                    Status:{request.validateDate && request.validateDate && moment().diff(moment(request.validateDate), 'minutes') > 0 ? (
                                                    <span>CANCELED</span>
                                                ) : (
                                                    <span>{request.status}</span>
                                                )}
                                                </span>
                                            </span>
                                            <span className="request-dtls__price ml-auto">
                                                {request.price === 0 || request.price === '0' ? 'Not specified' : '$' + request.price}
                                            </span>
                                        </div>
                                        <div className="row mt-2">
                                            <div className="col-lg-6 flex-column">
                                                <div className="request-dtls__buyer">
                                                    {request.buyer ? (
                                                        `${request.buyer} (${request.buyerId})`
                                                    ) : (
                                                        <span>-</span>
                                                    )}
                                                </div>
                                                <div className="request-dtls__seller">
                                                    {request.seller ? (
                                                        `${request.seller} (${request.sellerId})`
                                                    ) : (
                                                        <span>-</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                {request.status === 'NEW' ? ( // if request status new, we check his validation date
                                                    <div className="request-dtls__buttons-wrapper">
                                                        {request.validateDate && moment().diff(moment(request.validateDate), 'minutes') > 0
                                                            ? this.displayState(request)
                                                            : this.smartActions(request)}
                                                    </div>
                                                ) : (
                                                    ''
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {this.props.trade.bids && this.props.trade.bids.length > 0 && (
                                    <div className="col-lg-12">
                                        <CounterList
                                            trade={request}
                                            bids={this.props.trade.bids}
                                            user={this.props.account.user}
                                            onCounter={bid => {
                                                this.setState({
                                                    counterModal: {
                                                        ...this.state.counterModal,
                                                        show: true,
                                                        bid
                                                    }
                                                })
                                            }
                                            }
                                            onAccept={this.acceptBid}
                                            onDecline={this.declineBid}
                                        />
                                    </div>
                                )}
                                <div className="col-lg-6 half">
                                    <div className="request-dtls__props">
                                        <div className="row">
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Origin</div>
                                                <div className="request-dtls__value">{Countries[request.origin]}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Vessel or container</div>
                                                <div className="request-dtls__value">{request.shipping}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Tonnage / quantity</div>
                                                <div className="request-dtls__value">
                                                    {request.measure} {MEASUREMENTS[request.measurement]}
                                                </div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Type of rice</div>
                                                <div className="request-dtls__value">{request.riceType}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Crop year</div>
                                                <div className="request-dtls__value">{request.cropYear}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Quality standard</div>
                                                <div className="request-dtls__value">{request.quality}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Incoterm</div>
                                                <div className="request-dtls__value">{request.incoterm}</div>
                                            </div>
                                            {request.incoterm === INCOTERMOPT.CIF && (
                                                <div className="request-dtls__prop">
                                                    <div className="request-dtls__key">
                                                        Destination
                                                    </div>
                                                    <div className="request-dtls__value">
                                                        {Countries[request.destCountry]}, {request.destPort}
                                                    </div>
                                                </div>
                                            )}
                                            {request.incoterm === INCOTERMOPT.FOB && (
                                                <div className="request-dtls__prop">
                                                    <div className="request-dtls__key">
                                                        Port of load
                                                    </div>
                                                    <div className="request-dtls__value">
                                                        {Countries[request.loadCountry]}, {request.loadPort}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">
                                                    {request.Incoterm === 'CIF' ? 'Delivery Period' : 'Shipping period'}
                                                </div>
                                                <div className="request-dtls__value">
                                                    {`${moment(request.deliveryStartDate).format(DATEFORMAT)}`} /{' '}
                                                    {`${moment(request.deliveryEndDate).format(DATEFORMAT)}`}
                                                </div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Packaging</div>
                                                <div className="request-dtls__value">{request.packaging}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Payment terms</div>
                                                <div className="request-dtls__value">
                                                    {PAYMENTTERMSOPT[request.payment]} {request.paymentPeriod}
                                                </div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Inspection</div>
                                                <div className="request-dtls__value">{request.inspectionName}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Load/ Discharge terms</div>
                                                <div className="request-dtls__value">{request.discharge}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Special documentary request</div>
                                                <div className="request-dtls__value">{request.specialRequest}</div>
                                            </div>
                                            <div className="request-dtls__prop">
                                                <div className="request-dtls__key">Valid until</div>
                                                <div className="request-dtls__value">
                                                    {this.props.account.token.companyId !== request.ownerId // IF IT IS NOT OWNER
                                                        ? `${moment(request.validateDate).format(DATEFORMATHOURS)}  UTC (${moment(
                                                            // CONVERT TO LOCAL TIME
                                                            request.validateDate
                                                        ).format('Z')})`
                                                        : `${
                                                            moment(request.validateDate) // IF IT IS OWNER SHOW TIME THAT HE CHOOSE
                                                                .format(DATEFORMATHOURS)
                                                            } UTC (${moment(request.validateDate).format('Z')})`
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 half">
                                    {!this.canComment && this.props.messages.length === 0
                                        ? null
                                        : (
                                            <div className="request-dtls__comments-wrapper">
                                                <div className="request-dtls__comment-writing">
                                                    <div className="request-dtls__comment-heading">Comments</div>
                                                    {this.canComment && (
                                                        <React.Fragment>
                                                            <textarea
                                                                className="request-dtls__comment-area"
                                                                name="comment"
                                                                id="comment"
                                                                placeholder="Add your message..."
                                                                ref={this.textArea}
                                                            />
                                                            <button
                                                                className="request-dtls__comment-send mt-2"
                                                                disabled={this.props.loadingTradeMessages}
                                                                onClick={e => this.postRootMessage(e, this.textArea.current.value)}
                                                            >
                                                                Send
                                                            </button>
                                                        </React.Fragment>
                                                    )}
                                                </div>
                                                {this.props.messages.map((message, i) => {
                                                    return (
                                                        <Message
                                                            key={i}
                                                            message={message}
                                                            onSubmit={(e, messageID, message) => this.postMessage(e, messageID, message)}
                                                            onClick={messageID => this.reply(messageID)}
                                                            onChange={value => this.getReply(value)}
                                                            showReplyButton={this.canComment}
                                                            loading={this.props.loadingTradeMessages}
                                                        />
                                                    );
                                                })}
                                                <Preloader style="swirl" loading={this.props.loadingTradeMessages}/>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {this.state.counterModal.show && (
                    <CounterProposal onClose={this.closeCounterModal}
                                     trade={request}
                                     bid={this.state.counterModal.bid}
                                     onSubmit={value => {
                                         this.props.counter(request.id, value);
                                         this.closeCounterModal();
                                     }}
                    />
                )}
                <Footer/>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        trade: state.trade,
        account: state.account,
        messages: state.trade.messages,
        loadingInitiate: state.loading.loadingInitiate,
        requestLoading: state.loading.requestLoading,
        loadingTradeMessages: state.loading.loadingTradeMessages
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            loadRequestDetails,
            accept: SmartTrade.Accept,
            cancel: SmartTrade.Cancel,
            reject: SmartTrade.Rejcet,
            counter: CounterTrade,
            acceptBid: AcceptTradeBid,
            declineBid: DeclineTradeBid,
            loadBids: LoadTradeBids,
            AutoupdateTriggered,
            getMessage,
            ReplyMessage,
            PostMessage,
            LoadingInitiate,
            ClearTradeState,
            navigate: path => push(path),
            navigateDecline: path => push('/requests' + path),
            navigateDeal: path => push('/trades' + path)
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(RequestDetails);
