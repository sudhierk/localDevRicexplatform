import React from 'react';
import moment from 'moment';
import { EnumsService } from '../../../../services/service.utils';
//values
import { DATEFORMATHOURS, DATEFORMAT, INCOTERMOPT } from '../../../../services/service.values'

const Countries = EnumsService.countries();

const Info = ({trade, info, user}) => (
    <div className="trades-dtls__general">
        <div className="row">
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Origin</div>
                <div className="trades-dtls__value">{Countries[trade.origin]}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Vessel or container</div>
                <div className="trades-dtls__value">{trade.shipping}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Tonnage / quantity</div>
                <div className="trades-dtls__value">
                    {trade.measure} {trade.measurement === 'TONS' ? 'tons' : 'cwt'}
                </div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Type of rice</div>
                <div className="trades-dtls__value">{trade.riceType}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Crop year</div>
                <div className="trades-dtls__value">{trade.cropYear}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Quality standard</div>
                <div className="trades-dtls__value">{trade.quality}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Incoterm</div>
                <div className="trades-dtls__value">{trade.incoterm}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Destination</div>
                <div className="trades-dtls__value">
                    {Countries[trade.destCountry]}{trade.destPort ? `, ${trade.destPort}` : ''}
                </div>
            </div>
            {trade.incoterm === INCOTERMOPT.FOB && (
                <div className="trades-dtls__prop">
                    <div className="trades-dtls__key">Port of load</div>
                    <div className="trades-dtls__value">
                        {Countries[trade.loadCountry]}{trade.loadPort ? `, ${trade.loadPort}` : ''}
                    </div>
                </div>
            )}
            <div className="trades-dtls__prop">
                <div
                    className="trades-dtls__key">{trade.incoterm === 'CIF' ? 'Delivery Period' : 'Shipping period'}</div>
                <div className="trades-dtls__value">
                    {moment(trade.deliveryStartDate).format(DATEFORMAT)} /{' '}
                    {moment(trade.deliveryEndDate).format(DATEFORMAT)}
                </div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Packaging</div>
                <div className="trades-dtls__value">{trade.packaging}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Payment terms</div>
                <div className="trades-dtls__value">
                    {trade.payment} {trade.paymentPeriod}
                </div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Inspection</div>
                <div className="trades-dtls__value">{trade.inspectionName}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Load/ Discharge terms</div>
                <div className="trades-dtls__value">{trade.discharge}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Special documentary request</div>
                <div className="trades-dtls__value">{trade.specialRequest}</div>
            </div>
            <div className="trades-dtls__prop">
                <div className="trades-dtls__key">Valid until</div>
                <div className="trades-dtls__value">
                    {user.id !== trade.ownerId // IF IT IS NOT OWNER
                        ? `${moment(trade.validateDate).format(DATEFORMATHOURS)}  UTC (${moment(trade.validateDate).format('Z')})` // CONVERT TO LOCAL TIME
                        : `${moment(trade.validateDate) // IF IT IS OWNER SHOW TIME THAT HE CHOOSE
                            .utcOffset(moment(trade.validateDate)._tzm)
                            .format(DATEFORMATHOURS)}
              UTC (${moment(trade.validateDate)
                            .utcOffset(moment(trade.validateDate)._tzm)
                            .format('Z')})
              `}
                </div>
            </div>
        </div>
    </div>
);

export default Info;
