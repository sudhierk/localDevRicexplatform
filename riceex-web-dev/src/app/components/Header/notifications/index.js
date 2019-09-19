import React from "react";
import {DATEFORMAT, DATEFORMATHOURS} from "../../../../services/service.values";
import moment from 'moment';
import {Link} from "react-router-dom";
import { DOCUMENT_NAMES } from '../../../admin/trades/services/documents.service';
import MdDelete from 'react-icons/lib/md/delete';


/*

o) 12:00:00
p) 12:00:00
    q) 12:00:00

    */


// Open trade request <span className='notification-link'>{data.tradeID}</span> is created
const Notifications = {
    NEW_OPEN_TRADE_REQUEST_NOTIF: (initiator, data) => <React.Fragment>{initiator} has created open trade request <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    NEW_TRADE_REQUEST_NOTIF: (initiator, data) => <React.Fragment>{initiator} has sent you a private trade request <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_REQUEST_APPROVED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has approved trade request <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_REQUEST_REJECTED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has rejected trade request <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_REQUEST_CANCELED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has cancelled trade request <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_REQUEST_SIGNED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has signed trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_REQUEST_VESSEL_NOMINATED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has nominated vessel for trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_REQUEST_VESSEL_NOMINATION_APPROVED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has approved vessel nomination for trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_REQUEST_VESSEL_NOMINATION_REJECTED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has rejected vessel nomination for trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    INSPECTION_WAS_CHOOSED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has nominated inspection company for trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_REQUEST_DOCUMENT_INSTRUICTIONS_SENT_NOTIF: (initiator, data) => <React.Fragment>{initiator} has sent documentary instructions for trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    SHIPPING_ADVICE_NOTIF: (initiator, data) => <React.Fragment>{initiator} has issued shipping advice for trade <span className="notification-link">{data.tradeID}</span></React.Fragment>,
    DOCUMENT_UPLOADED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has uploaded document {data.docName}<span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    DOCUMENT_BILL_FILLED: (initiator, data) => <React.Fragment>{initiator} has filled in {data.docName} <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    DOCUMENT_INVOICE_FILLED: (initiator, data) => <React.Fragment>{initiator} has filled in {data.docName} <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    DOCUMENT_APPROVED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has approved document {data.docName} <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    DOCUMENT_REJECTED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has rejected document {data.docName} <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    COMMENT_ADDED_TO_DOC_NOTIF: (initiator, data) => <React.Fragment>{initiator} has added comment to the document {data.docName} <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    COMMENT_ADDED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has added comment to the trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    DocumentCommentRejected: (initiator, data) => <React.Fragment>{initiator} has rejected comment to the document <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    WatermarkLifted: (initiator, data) => <React.Fragment>{initiator} has lifted watermark for document<span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    DocumentFilled: (initiator, data) => <React.Fragment>{initiator} has filled in document <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    ShipmentInstructionsSent: (initiator, data) => <React.Fragment>{initiator} has sent shipping instructions for trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    PaymentConfirmed: (initiator, data) => <React.Fragment>{initiator} has confirmed payment for <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TradeClosed: (initiator, data) => <React.Fragment>{initiator} has closed trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    DOCUMENT_RELEASED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has released document {data.docName} for buyer review <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_PAYMENT_NOTIF: (initiator, data) => <React.Fragment>{initiator} has issued payment for trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_PAYED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has confirmed payment for trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_CLOSE_NOTIF: (initiator, data) => <React.Fragment>{initiator} has closed trade <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_BID_DECLINED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has rejected offer for trade request <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_COUNTERED_NOTIF: (initiator, data) => <React.Fragment>{initiator} has countered your offer for trade request <span className='notification-link'>{data.tradeID}</span></React.Fragment>,
    TRADE_BID_ACCEPTED: (initiator, data) => <React.Fragment>{initiator} has accepted your offer for trade request <span className='notification-link'>{data.tradeID}</span></React.Fragment>
};

const path = (type, data) => {
    switch (type) {
        case 'NEW_OPEN_TRADE_REQUEST_NOTIF':
            return "/exchange/details/" + (data.id || data.tradeID);
        case 'DocumentCommentRejected':
        case 'NEW_TRADE_REQUEST_NOTIF':
        case "COMMENT_ADDED_NOTIF":
        case 'TRADE_REQUEST_REJECTED_NOTIF':
        case 'TRADE_COUNTERED_NOTIF':
        case 'TRADE_BID_DECLINED_NOTIF':
        case 'TRADE_REQUEST_CANCELED_NOTIF':
            return "/requests/details/" + (data.id || data.tradeID);
        case 'COMMENT_ADDED_TO_DOC_NOTIF':
        case 'DOCUMENT_UPLOADED_NOTIF':
        case 'DOCUMENT_APPROVED_NOTIF':
        case 'DOCUMENT_REJECTED_NOTIF':
        case 'DOCUMENT_RELEASED_NOTIF':
            return `/trades/details/${data.tradeID}/documents?shipmentId=${data.shipmentID}`;
        case 'DOCUMENT_BILL_FILLED':
            return `/trades/details/${data.tradeID}/shipment/${data.shipmentID}/documents/bill/preview`;
        case 'DOCUMENT_INVOICE_FILLED':
            return `/trades/details/${data.tradeID}/documents/invoice/preview`;
        case 'SHIPPING_ADVICE_NOTIF':
            return `/trades/details/${data.tradeID}/advice`;
        case 'TRADE_REQUEST_DOCUMENT_INSTRUICTIONS_SENT_NOTIF':
            return `/trades/details/${data.tradeID}/instructions`;
        default:
            return "/trades/details/" + (data.id || data.tradeID);
    }
};

export const Notification = ({type, initiator, date, data, onClick, read, onDelete}) => {
    const jData =  data && JSON.parse(data);
    let template = Notifications[type];
    if (jData && jData.docType) {
        jData.docName = DOCUMENT_NAMES[jData.docType];
    }
    if (template) {
        return (
            <div className='notification-item' onClick={()=>onClick(path(type, jData))}>
                <div className='n-header'>
                    {date && moment(date).format(DATEFORMATHOURS)}
                    <div className="n-header__controls">
                        <div className="n-delete" title="Delete notification" onClick={e => {
                            e.stopPropagation();
                            onDelete();
                        }}>
                            <MdDelete />
                        </div>
                    </div>
                </div>
                <div className='n-content'>
                    {!read && <div className="n-new-badge" />}
                    {template(initiator, jData)}
                </div>
                <div className="n-controls">
                </div>
            </div>
        )
    }
    return '';
};