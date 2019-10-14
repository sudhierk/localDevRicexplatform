import React from 'react';
import FaInfoCircle from 'react-icons/lib/fa/info-circle';
import { Link } from 'react-router-dom';
import Preloader from '../../../components/preloader/Preloader';

const dealedBar = (trade, trader, action, loading) => {
    let render = () => {
        let signed =
            (trader === 'seller' && trade.requestInfo.signSeller) || (trader === 'buyer' && trade.requestInfo.signBuyer);
        return (
            <button onClick={() => action()}
                    className={`trades-dtls__button ${signed ? 'trades-dtls__button_success' : ''}`}>
                <Preloader style="dots" loading={loading}>
                    <span>{signed ? 'Pending Other Signature' : 'Sign Contract'}</span>
                </Preloader>
            </button>
        );
    };
    return {
        Buyer: render,
        Seller: render
    };
};

const vesselBar = (trade, info, nominate, acceptingNomination, loading) => {
    const isNominated = info && info.vesselNominated;
    const nominateButton = (
        <button onClick={nominate} className={`trades-dtls__button ${isNominated && 'trades-dtls__button_success'}`}>
            <Preloader style="dots" loading={loading}>
                <span>Nominate Vessel</span>
            </Preloader>
        </button>
    );

    const nominateAcceptingButton = (
        <button onClick={acceptingNomination} className={`trades-dtls__button`}>
            <Preloader style="dots" loading={loading}>
                <span>Approve Vessel Nomination</span>
            </Preloader>
        </button>
    );

    const waitNominationButton = (
        <button className="trades-dtls__button trades-dtls__button_info">Wait Vessel Nomination</button>);

    const waitApprovalButton = (
        <button className="trades-dtls__button trades-dtls__button_info">Wait Vessel Nomination Approval</button>);

    return {
        Buyer: () => {
            return trade.incoterm === 'FOB'
                ? isNominated
                    ? waitApprovalButton
                    : nominateButton
                : waitNominationButton;
        },
        Seller: () => {
            return trade.incoterm === 'CIF'
                ? nominateButton
                : isNominated
                    ? nominateAcceptingButton
                    : waitNominationButton;
        }
    };
};

const docInstBar = (trade, action, loading) => {
    return {
        Buyer: () => {
            return (
                <button onClick={() => action()} className="trades-dtls__button">
                    <Preloader style="dots" loading={loading}>
                        <span>Send Documentary Instructions</span>
                    </Preloader>
                </button>
            );
        },
        Seller: () => (
            <button className="trades-dtls__button trades-dtls__button_info">Wait For Documentary Instructions</button>
        )
    };
};

const shippingAdvice = (trade, action, loading) => {
    return {
        Buyer: () => <button className="trades-dtls__button trades-dtls__button_info">Wait For Shipping Advice</button>,
        Seller: () => {
            return (
                <button onClick={() => action()} className="trades-dtls__button">
                    <Preloader style="dots" loading={loading}>
                        Send Shipping Advice
                    </Preloader>
                </button>
            );
        }
    };
};

const documentsFill = url => {
    return {
        Buyer: () => <button className="trades-dtls__button trades-dtls__button_info">Documents being prepared</button>,
        Seller: () => (
            <button className="trades-dtls__button trades-dtls__button_info">
                <FaInfoCircle className="trades-dtls__info-sign"/>Please fill all{' '}
                <span>
          <Link to={url}>documents</Link>
        </span>
            </button>
        )
    };
};

const documentsFull = (url, loading) => {
    return {
        Buyer: () => <button className="trades-dtls__button trades-dtls__button_info">Documents filled in</button>,
        Seller: () => (
            <button className="trades-dtls__button trades-dtls__button_info">
                <Preloader style="dots" loading={loading}>
                    <React.Fragment>
                        <FaInfoCircle className="trades-dtls__info-sign"/>Please fill all{' '}
                        <span>
              <Link to={url}>documents</Link>
            </span>
                    </React.Fragment>
                </Preloader>
            </button>
        )
    };
};

const paymentRequired = (trade, action, loading) => {
    return {
        Buyer: () => {
            if (!trade.requestInfo.payed) {
                return (
                    <button onClick={() => action(true)} className={`trades-dtls__button`}>
                        <Preloader style="dots" loading={loading}>
                            Process Payment
                        </Preloader>
                    </button>
                );
            } else {
                return <button className="trades-dtls__button trades-dtls__button_info">Wait for Confirmation</button>;
            }
        },
        Seller: () => {
            if (trade.requestInfo.payed) {
                return (
                    <button onClick={() => action(false)} className={`trades-dtls__button`}>
                        <Preloader style="dots" loading={loading}>
                            Confirm Payment
                        </Preloader>
                    </button>
                );
            } else {
                return <button className="trades-dtls__button trades-dtls__button_info">Wait for Payment</button>;
            }
        }
    };
};

const waitCloseTrade = (action, loading) => {
    return {
        Buyer: () => <button className="trades-dtls__button trades-dtls__button_info">Waiting 90 days</button>,
        Seller: () => <button className="trades-dtls__button trades-dtls__button_info">Waiting 90 days</button>
    };
};

const closeTrade = (action, loading, trader, trade) => {
    let signed =
        (trader === 'seller' && trade.requestInfo.sellerClose) || (trader === 'buyer' && trade.requestInfo.buyerClose);
    return {
        Buyer: () => (
            <button onClick={signed ? undefined : () => action()}
                    className={`trades-dtls__button ${signed ? 'trades-dtls__button_success' : ''}`}>
                <Preloader style="dots" loading={loading}>
                    {signed ? 'Trade Closed' : 'Close Trade'}
                </Preloader>
            </button>
        ),
        Seller: () => (
            <button onClick={signed ? undefined : () => action()}
                    className={`trades-dtls__button ${signed ? 'trades-dtls__button_success' : ''}`}>
                <Preloader style="dots" loading={loading}>
                    {signed ? 'Trade Closed' : 'Close Trade'}
                </Preloader>
            </button>
        )
    };
};

export const ControlBar = {
    Deal: dealedBar,
    VesselBar: vesselBar,
    DocInst: docInstBar,
    ShippingAdvice: shippingAdvice,
    DocumentsFill: documentsFill,
    DocumentsFull: documentsFull,
    PaymentRequired: paymentRequired,
    Wait: waitCloseTrade,
    Close: closeTrade
};
