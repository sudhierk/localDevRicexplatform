import React from 'react';
import { DATEFORMAT, TRADE_STATUS, STEPS } from '../../../../services/service.values';
import moment from 'moment-timezone';
import { EnumsService } from '../../../../services/service.utils';

const COUNTRIES = EnumsService.countries();
const ShippingAdvice = ({trade, bills, userName, isModal, status}) => {
    status = status || trade.status;
    const showError = !isModal && STEPS.indexOf(status) < STEPS.indexOf(TRADE_STATUS.ADVICE);
    return (
        <div className={`shipping-advice-form${isModal ? ' shipping-advice-form--modal' : ''}`}>
            {showError
                ? 'Shipping advice has not been issued yet'
                : Object.keys(bills).map(shipmentId => (
                        <React.Fragment key={shipmentId}>
                            <h3 className="modal__heading">Bill Of Lading
                                No. {bills[shipmentId].BillNumber}</h3>
                            <span className="modal__label" style={{lineHeight: 'initial'}}>
                                Contract No.{' '}
                                {trade.id}{' '}
                                dated{' '}
                                {moment(trade.CreatedAt).format(DATEFORMAT)}{' '}
                                covering{' '}
                                {bills[shipmentId].QuantCleanOnBoard} {trade.measurement === 'TONS' ? 'tons' : 'cwt'},{' '}
                                {trade.riceType}
                            </span>
                            <div className="modal__textarea modal__textarea_dark textarea"
                                 id={`shipment-advice-text-${shipmentId}`}>
                                <p>
                                    <span className="bold">Dear Sirs</span>,
                                </p>
                                <p>
                                    U.U.R. and in complete fulfilment of the captioned contract we tender
                                    hereby as
                                    follows:<br/>
                                    <span
                                        className="bold bold--underline">{bills[shipmentId].QuantCleanOnBoard}</span> tons
                                    of{' '}
                                    <span
                                        className="bold bold--underline">{bills[shipmentId].PackGoodsDescript}</span> shipped
                                    on
                                    MV <span
                                    className="bold bold--underline">{bills[shipmentId].VessVoyage}</span> dated{' '}
                                    <span className="bold bold--underline">
                                            {moment(bills[shipmentId].ShippedOnBoard).format(DATEFORMAT)}
                                        </span>{' '}
                                    shipped from{' '}
                                    <span
                                        className="bold bold--underline">{COUNTRIES[trade.origin]}</span>{' '}
                                    to{' '}
                                    <span className="bold bold--underline">
                                            {COUNTRIES[trade.destCountry]}
                                        </span>
                                </p>

                                {trade.incoterm === 'FOB' && (
                                    <p>Kindly cover the marine insurance for this parcel.</p>
                                )}
                                <p>With kind regards.</p>
                                <p>
                                    <span className="bold">{userName}</span>
                                </p>
                            </div>
                        </React.Fragment>
                    ))
            }
        </div>
    );
};

export default ShippingAdvice;