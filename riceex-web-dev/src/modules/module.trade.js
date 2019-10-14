import React from 'react';
import { handleError, showErrorModal } from './module.app';
import { TradeApi } from '../services/service.api';
import {
    LoadingRequestData,
    LoadingCreateRequest,
    LoadingDocuments,
    LoadingDocumentComments,
    LoadingAllDocuments, LoadingTradeMessages
} from './module.loading';
import { TRADE_STATUS } from '../services/service.values';
import moment from 'moment';
import { push } from 'react-router-redux';
import { DOCUMENT_TYPES } from '../app/admin/trades/services/documents.service';
import { NOTIFICATION_NEW } from './module.notifications';

export const CREATE_REQUEST = 'trade/CREATE_REQUEST';
export const LOAD_REQUESTS = 'trade/LOAD_REQUESTS';
export const LOAD_COMPANIES = 'trade/LOAD_COMPANIES';
export const LOADED_INSPECTION_COMPANIES = 'trade/LOAD_INSPECTION_COMPANIES';
export const UPDATE_BILL = 'trade/UPDATE_BILL';
export const UPDATE_DOCUMENT = 'trade/UPDATE_DOCUMENT';
export const UPDATE_INVOICE = 'trade/UPDATE_INVOICE';
export const UPDATE_REQUEST = 'trade/UPDATE_REQUEST';
export const GET_MESSAGES = 'trade/GET_MESSAGES';
export const POST_MESSAGE = 'trade/POST_MESSAGE';
export const REPLY_MESSAGE = 'trade/REPLY_MESSAGE';
export const LOAD_REQUEST_DETAILS = 'trade/LOAD_REQUEST_DETAILS';
export const SET_STATUS = 'trade/SET_STATUS';
export const LOAD_REQUEST_INFO = 'trade/LOAD_REQUEST_INFO';
export const GET_TRADE_DOCUMENTS = 'trade/GET_TRADE_DOCUMENTS';
export const GET_TRADE_BILL = 'trade/GET_TRADE_BILL';
export const POST_TRADE_DOCUMENT = 'trade/POST_TRADE_DOCUMENT';
export const GET_TRADE_INVOICE = 'trade/GET_TRADE_INVOICE';
export const POST_DOCUMENT_FILE = 'trade/POST_DOCUMENT_FILE';
export const OPEN_DOCUMENT_FILE = 'trade/OPEN_DOCUMENT_FILE';
export const UPDATE_SIGNED = 'trade/UPDATE_SIGNED';
export const PAY_TRADE = 'trade/PAY_TRADE';
export const UPDATE_FLOW_DOC = 'tradeUPDATE_FLOW_DOC';
export const UPDATE_PAYED = 'trade/UPDATE_PAYED';
export const UPDATE_TRADE_DOCUMENT = 'trade/UPDATE_TRADE_DOCUMENT';
export const UPDATE_CLOSE = 'trade/UPDATE_CLOSE';
export const SEND_SHIPPING_ADVICE = 'trade/SEND_SHIPPING_ADVICE';
export const SEND_INSTRUCTIONS = 'trade/SEND_INSTRUCTIONS';
export const GET_INSTRUCTIONS = 'trade/GET_INSTRUCTIONS';
export const UPDATE_NOMINATED = 'trade/UPDATE_NOMINATED';
export const POST_INSPECTION_REPORT = 'trade/POST_INSPECTION_REPORT';
export const GET_INSPECTION_REPORTS = 'trade/GET_INSPECTION_REPORTS';
export const LOAD_INSPECTION_TRADES = 'trade/LOAD_INSPECTION_TRADES';
export const GET_SHIPMENTS = 'trade/GET_SHIPMENTS';
export const GET_DOCUMENT_COMMENTS = 'trade/GET_DOCUMENT_COMMENTS';
export const POST_DOCUMENT_COMMENTS = 'trade/POST_DOCUMENT_COMMENTS';
export const UPDATE_DOCUMENT_STATUS = 'trade/UPDATE_DOCUMENT_STATUS';
export const CLEAR_TRADE_STATE = 'trade/CLEAR_STATE';
export const GET_VESSEL_NOMINATION = 'trade/GET_VESSEL_NOMINATION';
export const GET_BIDS = 'trade/GET_BIDS';
export const AUTOUPDATE_TRIGGERED = 'trade/AUTOUPDATE_TRIGGERED';

const arrayToTree = require('array-to-tree');

const initialState = {
    items: {
        all: [],
        sell: [],
        buy: [],
        single: null
    },
    companies: [],
    inspections: {companies: []},
    messages: [],
    requestInfo: '',
    documents: [],
    reports: [],
    shipments: [],
    documentComments: [],
    bills: {},
    shipmentDocuments: {},
    invoice: null,
    vesselNomination: {},
    bids: [],
    shouldTriggerTradeUpdate: false
};

export default (state = initialState, action) => {
    switch (action.type) {
        case LOAD_INSPECTION_TRADES:
        case LOAD_REQUESTS:
            switch (action.payload.type) {
                case 'sell':
                    return {
                        ...state,
                        items: {
                            ...state.items,
                            sell: action.payload.items
                        },
                        countsSell: action.payload.counts
                    };
                case 'buy':
                    return {
                        ...state,
                        items: {
                            ...state.items,
                            buy: action.payload.items
                        },
                        countsBuy: action.payload.counts
                    };
                case 'inbound':
                    return {
                        ...state,
                        items: {
                            ...state.items,
                            inbound: action.payload.items
                        },
                        countsInbound: action.payload.counts
                    };
                case 'outbound':
                    return {
                        ...state,
                        items: {
                            ...state.items,
                            outbound: action.payload.items
                        },
                        countsOutbound: action.payload.counts
                    };
                default:
                    return {
                        ...state,
                        items: {
                            ...state.items,
                            all: action.payload.items
                        },
                        counts: action.payload.counts
                    };
            }
        case UPDATE_REQUEST:
            return {
                ...state,
                items: {
                    ...state.items,
                    single: {
                        ...state.items.single,
                        ...action.payload
                    }
                }
            };
        case CREATE_REQUEST:
            return {
                ...state
            };
        case LOAD_COMPANIES:

            return {
                ...state,
                companies: action.payload
            };
        case LOADED_INSPECTION_COMPANIES:
            let companies = {};
            if (action.payload) {
                action.payload.companies.reduce((accumulator, value) => {
                    accumulator[Number(value.ID)] = value.name;
                    return accumulator;
                }, companies)
            }

            // action.payload.companies
            //
            return {
                ...state,
                inspections: companies
            };
        case LOAD_REQUEST_DETAILS:
            return {
                ...state,
                items: {
                    ...state.items,
                    single: action.payload.items
                }
            };
        case GET_MESSAGES:
            action.payload.forEach(val => {
                val.isReplying = false;
            });
            let messagesTree = arrayToTree(action.payload.reverse(), {
                parentProperty: 'ParentID',
                customID: 'ID'
            });
            return {
                ...state,
                messages: messagesTree
            };
        case POST_MESSAGE:
            return state;
        case REPLY_MESSAGE:
            const onReplyMessage = mes => {
                if (mes.children) {
                    mes.children.forEach(value => {
                        if (value.ID === action.payload.id) {
                            value.isReplying = !value.isReplying;
                        }
                        onReplyMessage(value);
                    })
                }
            };
            let repliedMessages = state.messages;
            repliedMessages.forEach(value => {
                if (value.ID === action.payload.id) {
                    value.isReplying = !value.isReplying;
                }
                onReplyMessage(value);
            });
            return {
                ...state,
                messages: repliedMessages
            };
        case LOAD_REQUEST_INFO:
            return {
                ...state,
                requestInfo: action.payload.info
            };
        case GET_TRADE_DOCUMENTS: {
            const {shipmentId, ...docs} = action.payload;
            return {
                ...state,
                shipmentDocuments: {
                    ...state.shipmentDocuments,
                    [shipmentId]: docs
                }
            };
        }
        case POST_TRADE_DOCUMENT: {
            // put in block, so var declaration 'const {data}' not conflict with same var declaration in another case
            const {data, response, shipmentId} = action.payload;
            const docName = Object.keys(response)[0];
            const docValue = response[Object.keys(response)[0]];

            if (docName === 'BillID') {
                return {
                    ...state,
                    documents: {
                        ...state.documents,
                        [docName]: docValue
                    },
                    bill: {
                        quantCleanOnBoard: data.quantCleanOnBoard,
                        packGoodsDescript: data.packGoodsDescript,
                        vessVoyage: data.vessVoyage,
                        createdAt: moment()._d
                    }
                };
            } else {
                return {
                    ...state,
                    shipmentDocuments: {
                        ...state.shipmentDocuments,
                        [shipmentId]: {
                            ...state.shipmentDocuments[shipmentId],
                            [docName]: docValue
                        }
                    }
                };
            }
        }
        case GET_TRADE_BILL:
            return {
                ...state,
                bills: {
                    ...state.bills,
                    [action.payload.shipmentId]: action.payload.data
                }
            };
        case GET_TRADE_INVOICE:
            return {
                ...state,
                invoice: action.payload
            };
        case POST_DOCUMENT_FILE: {
            const {shipmentId, data} = action.payload;
            return {
                ...state,
                shipmentDocuments: {
                    ...state.shipmentDocuments,
                    [shipmentId]: {
                        ...state.shipmentDocuments[shipmentId],
                        [data.type]: {
                            ...(state.shipmentDocuments[shipmentId][data.type] ? state.shipmentDocuments[shipmentId][data.type] : {}),
                            ID: data.documentID,
                            status: data.status,
                            approvedByBuyer: false,
                            rejectedByBuyer: false,
                            Files: [
                                ...(state.shipmentDocuments[shipmentId][data.type] ? state.shipmentDocuments[shipmentId][data.type].Files : []),
                                {
                                    name: data.file,
                                    type: data.type,
                                    ID: data.fileID,
                                    DocumentID: data.documentID
                                }
                            ]
                        }
                    }
                }
            };
        }
        case PAY_TRADE:
            return {
                ...state,
                requestInfo: {
                    ...state.requestInfo,
                    Payed: true
                }
            };
        case UPDATE_FLOW_DOC:
            return {
                ...state,
                trade: {
                    ...state.trade,
                    items: {
                        ...state.trade.items,
                        single: [...state.trade.items.single]
                    }
                }
            };
        case UPDATE_SIGNED:
            if (action.payload === 'seller') {
                return {
                    ...state,
                    ...state.trade,
                    requestInfo: {
                        ...state.requestInfo,
                        signSeller: true
                    }
                };
            } else {
                return {
                    ...state,
                    ...state.trade,
                    requestInfo: {
                        ...state.requestInfo,
                        signBuyer: true
                    }
                };
            }
        case UPDATE_NOMINATED:
            return {
                ...state,
                ...state.trade,
                requestInfo: {
                    ...state.requestInfo,
                    vesselNominated: action.payload
                }
            };
        case UPDATE_PAYED:
            return {
                ...state,
                requestInfo: {
                    ...state.requestInfo,
                    payed: true
                }
            };
        case UPDATE_TRADE_DOCUMENT:
            if (action.payload.docName === TRADE_STATUS.ADVICE) {
                return {
                    ...state,
                    documents: {
                        ...state.documents,
                        shippingAdviceID: action.payload.text
                    }
                };
            } else {
                return {
                    ...state,
                    documents: {
                        ...state.documents,
                        docInstructionsID: action.payload.text
                    }
                };
            }
        case UPDATE_CLOSE:
            if (action.payload === 'seller') {
                return {
                    ...state,
                    requestInfo: {
                        ...state.requestInfo,
                        sellerClose: true
                    }
                };
            } else {
                return {
                    ...state,
                    requestInfo: {
                        ...state.requestInfo,
                        buyerClose: true
                    }
                };
            }
        case UPDATE_BILL: {
            const {data, shipmentId} = action.payload;
            return state;
        }
        case SEND_SHIPPING_ADVICE:
            return {
                ...state,
                documents: {
                    ...state.documents,
                    shippingAdviceID: action.payload
                }
            };
        case SEND_INSTRUCTIONS:
            return state;
        case GET_INSTRUCTIONS:
            return {
                ...state,
                instructions: action.payload,
                shipments: action.payload.shipments.map(shipment => {
                    return {amount: shipment.amount, id: shipment.ID};
                })
            };
        case GET_INSPECTION_REPORTS:
            return {
                ...state,
                reports: action.payload
            };
        case GET_SHIPMENTS:
            return {
                ...state,
                shipments: action.payload
            };
        case GET_DOCUMENT_COMMENTS:
            action.payload.data.forEach(val => {
                val.isReplying = false;
            });
            const comments = action.payload.data.slice().sort((a, b) => {
                return moment.utc(a.CreatedAt).diff(moment.utc(b.CreatedAt))
            });
            let commentsTree = arrayToTree(comments, {
                parentProperty: 'ParentID',
                customID: 'ID'
            });
            return {
                ...state,
                documentComments: {
                    ...state.documentComments,
                    [action.payload.documentId]: {
                        data: commentsTree,
                        count: action.payload.data.length
                    }
                }
            };
        case UPDATE_DOCUMENT_STATUS: {
            if (action.payload.type === DOCUMENT_TYPES.INVOICE) {
                return {
                    ...state,
                    invoice: {
                        ...state.invoice,
                        document: {
                            ...state.invoice.document,
                            status: action.payload.status
                        }
                    }
                }
            }
            return {
                ...state,
                shipmentDocuments: {
                    ...state.shipmentDocuments,
                    [action.payload.shipmentId]: {
                        ...state.shipmentDocuments[action.payload.shipmentId],
                        [action.payload.type]: {
                            ...state.shipmentDocuments[action.payload.shipmentId][action.payload.type],
                            status: action.payload.status
                        }
                    }
                },
                bills: action.payload.type !== DOCUMENT_TYPES.BILL ? state.bills : {
                    ...state.bills,
                    [action.payload.shipmentId]: {
                        ...state.bills[action.payload.shipmentId],
                        document: {
                            ...state.bills[action.payload.shipmentId].document,
                            status: action.payload.status
                        }
                    }
                }
            };
        }
        case GET_VESSEL_NOMINATION: {
            return {
                ...state,
                vesselNomination: action.payload
            }
        }
        case SET_STATUS: {
            return {
                ...state,
                items: {
                    ...state.items,
                    single: {
                        ...state.items.single,
                        status: action.payload,
                        completionAt: action.payload !== TRADE_STATUS.PAYED ? state.items.single.completionAt : moment().add(90, 'd').format()
                    }
                }
            }
        }
        case GET_BIDS:
            return {
                ...state,
                bids: action.payload
            };
        case AUTOUPDATE_TRIGGERED:
            return {
                ...state,
                shouldTriggerTradeUpdate: action.payload
            };
        case NOTIFICATION_NEW:
            const actionsToAutoupdate = [
                'TRADE_REQUEST_APPROVED_NOTIF',
                'TRADE_BID_ACCEPTED',
                'COMMENT_ADDED_NOTIF',
                'TRADE_REQUEST_REJECTED_NOTIF',
                'TRADE_COUNTERED_NOTIF',
                'TRADE_BID_DECLINED_NOTIF'
            ];
            const jData = action.payload.data && JSON.parse(action.payload.data);
            const tradeId = jData && jData.tradeID;
            if (state.items.single && state.items.single.id === tradeId && actionsToAutoupdate.includes(action.payload.type)) {
                return {
                    ...state,
                    shouldTriggerTradeUpdate: true
                }
            }
            return state;
        case CLEAR_TRADE_STATE:
            return initialState;
        default:
            return state;
    }
};

export const sendInstructions = message => {
    return dispatch => {
        dispatch({
            type: SEND_INSTRUCTIONS,
            payload: message
        });
    };
};

export const getDocInstructions = id => {
    return dispatch => {
        TradeApi.smart(id)
            .getInstructions()
            .then(response => {
                dispatch({
                    type: GET_INSTRUCTIONS,
                    payload: response.data
                });
            })
            .catch(error => {
                if (process.env.NODE_ENV === 'development') {
                    console.error(error);
                }
            })
    }
};

export const sendShippingAdvice = message => {
    return dispatch => {
        dispatch({
            type: SEND_SHIPPING_ADVICE,
            payload: message
        });
    };
};

export const UpdateCloseLocally = trader => {
    return dispatch => {
        dispatch({
            type: UPDATE_CLOSE,
            payload: trader
        });
    };
};

export const PostDocumentFile = (id, shipmentId, params, cb) => {
    return dispatch => {
        LoadingDocuments(params.get('DocType'), true, dispatch);
        TradeApi.postDocumentFile(id, shipmentId, params)
            .then(r => {
                LoadingDocuments(params.get('DocType'), false, dispatch);
                dispatch({
                    type: POST_DOCUMENT_FILE,
                    payload: {data: r.data, shipmentId}
                });
                if (cb) {
                    cb(r.data.status);
                }
            })
            .catch(err => {
                LoadingDocuments(params.get('DocType'), false, dispatch);
                console.log(err);
            });
    };
};

export const GetInspectionReports = id => {
    return dispatch => {
        TradeApi.getInspectionReports(id)
            .then(response => {
                dispatch({
                    type: GET_INSPECTION_REPORTS,
                    payload: response.data.reports.map(item => item.file).sort((a, b) => {
                        return new Date(b.CreatedAt) - new Date(a.CreatedAt);
                    })
                });
            })
            .catch(error => {
                console.error(error);
            })
    }
};

export const PostInspectionReport = (id, params) => {
    return dispatch => {
        TradeApi.postInspectionReport(id, params)
            .then(response => {
                GetInspectionReports(id)(dispatch);
            })
            .catch(error => {
                console.error(error);
            })
    }
};

export const OpenDocument = (id, shipmentId, imgId, myWindow) => {
    return dispatch => {
        TradeApi.getDocumentFile(id, shipmentId, imgId)
            .then(r => {
                dispatch({
                    type: OPEN_DOCUMENT_FILE,
                    payload: r.data
                });

                myWindow.location.href = `${process.env.REACT_APP_API_URL}/${r.data.file.source}`;
                myWindow.focus();
            })
            .catch(err => {
                console.log(err);
            });
    };
};

export const GetTradeDocuments = (tradeId, shipmentId) => {
    return dispatch => {
        LoadingAllDocuments(true, dispatch);
        TradeApi.getTradeDocuments(tradeId, shipmentId)
            .then(r => {
                const defaultValue = {
                    CERT_OF_QUALITY: null,
                    QUALITY_APPEARANCE_CERT: null,
                    CERT_OF_WEIGHT: null,
                    CERT_OF_PACKING: null,
                    CERT_OF_FUMIGATION: null,
                    PHYTOSANITARY: null,
                    NON_GMO: null,
                    EXPORT_DECLARATION: null,
                    INSURANCE: null
                };
                LoadingAllDocuments(false, dispatch);
                dispatch({
                    type: GET_TRADE_DOCUMENTS,
                    payload:
                        r.data.shipmentDocuments.length === 0
                            ? {...defaultValue, shipmentId}
                            : r.data.shipmentDocuments.reduce((acc, curr) => {
                                acc[curr.type] = curr;
                                return acc;
                            }, {...defaultValue, shipmentId})
                });
            })
            .catch(err => {
                console.log(err);
            });
    };
};

export const GetShipments = id => {
    return dispatch => {
        TradeApi.getShipments(id)
            .then(response => {
                dispatch({
                    type: GET_SHIPMENTS,
                    payload: response.data.shipments.map(shipment => {
                        GetTradeBill(id, shipment.ID)(dispatch);
                        GetTradeDocuments(id, shipment.ID)(dispatch);
                        return {amount: shipment.amount, id: shipment.ID};
                    })
                });
            })
            .catch(error => console.error(error));
    }
};

export const PayStatusFlow = () => {
    return dispatch => {
        dispatch({
            type: PAY_TRADE,
            payload: null
        });
    };
};

export const UpdateBill = (id, shipmentId, params, cb) => {
    return dispatch => {
        LoadingDocuments(DOCUMENT_TYPES.BILL, true, dispatch);
        TradeApi.updateBill(id, shipmentId, params).then(r => {
            LoadingDocuments(DOCUMENT_TYPES.BILL, false, dispatch);
            dispatch({
                type: UPDATE_BILL,
                payload: {response: r.data, data: params}
            });
            cb();
        });
    };
};

export const UpdateDocument = (id, shipmentId, params, cb) => {
    return dispatch => {
        LoadingDocuments(params.get('DocType'), true, dispatch);
        TradeApi.updateDocumentFile(id, shipmentId, params).then(r => {
            LoadingDocuments(params.get('DocType'), false, dispatch);
            dispatch({
                type: UPDATE_DOCUMENT,
                payload: r.data
            });
            if (cb) {
                cb();
            }
        });
    };
};

export const ApproveDocument = (id, shipmentId, documentId, docName, params) => {
    return dispatch => {
        LoadingDocuments(docName, true, dispatch);
        TradeApi.approveDocument(id, shipmentId, documentId, params)
            .then(response => {
                LoadingDocuments(docName, false, dispatch);
                SetTradeStatus(response.data.tradeStatus)(dispatch);
                dispatch({
                    type: UPDATE_DOCUMENT_STATUS,
                    payload: {
                        type: docName,
                        status: response.data.documentStatus,
                        shipmentId
                    }
                });
            })
            .catch(error => {
                LoadingDocuments(docName, false, dispatch);
                console.log(error);
            });
    };
};

export const RejectDocument = (id, shipmentId, documentId, docName, params) => {
    return dispatch => {
        LoadingDocuments(docName, true, dispatch);
        TradeApi.rejectDocument(id, shipmentId, documentId, params)
            .then(response => {
                LoadingDocuments(docName, false, dispatch);
                dispatch({
                    type: UPDATE_DOCUMENT_STATUS,
                    payload: {
                        type: docName,
                        status: response.data.documentStatus,
                        shipmentId
                    }
                });
            })
            .catch(error => {
                LoadingDocuments(docName, false, dispatch);
                console.log(error);
            });
    };
};

export const ReleaseDocument = (id, shipmentId, documentId, docName, params) => {
    return dispatch => {
        LoadingDocuments(docName, true, dispatch);
        TradeApi.releaseDocument(id, shipmentId, documentId, params)
            .then(response => {
                LoadingDocuments(docName, false, dispatch);
                dispatch({
                    type: UPDATE_DOCUMENT_STATUS,
                    payload: {
                        type: docName,
                        status: response.data.documentStatus,
                        shipmentId
                    }
                });
            })
            .catch(error => {
                LoadingDocuments(docName, false, dispatch);
                console.log(error);
            });
    };
};

export const UpdateInvoice = (id, params, cb) => {
    return dispatch => {
        LoadingDocuments(DOCUMENT_TYPES.INVOICE, true, dispatch);
        TradeApi.updateInvoice(id, params).then(r => {
            LoadingDocuments(DOCUMENT_TYPES.INVOICE, false, dispatch);
            dispatch({
                type: UPDATE_INVOICE,
                payload: r.data
            });
            if (cb) {
                cb(r.data);
            }
        })
            .catch(() => {
                LoadingDocuments(DOCUMENT_TYPES.INVOICE, false, dispatch);
                if (cb) {
                    cb();
                }
            });
    };
};

export const GetTradeBill = (tradeId, shipmentId) => {
    return dispatch => {
        TradeApi.getTradeBill(tradeId, shipmentId)
            .then(r => {
                dispatch({
                    type: GET_TRADE_BILL,
                    payload: {data: r.data, shipmentId}
                });
            })
            .catch(() => {
            });
    };
};

export const GetVesselNomination = (tradeId) => {
    return dispatch => {
        TradeApi.smart(tradeId).vesselMessage()
            .then(r => {
                dispatch({
                    type: GET_VESSEL_NOMINATION,
                    payload: r.data.vesselNomination
                });
            });
    }
};

export const GetTradeInvoice = id => {
    return dispatch => {
        TradeApi.getTradeInvoice(id)
            .then(r => {
                dispatch({
                    type: GET_TRADE_INVOICE,
                    payload: {...r.data.invoice, document: r.data.document}
                });
            })
            .catch((error) => {
                if (process.env.NODE_ENV === 'development') {
                    console.error(error);
                }
            });
    };
};

export const PostTradeDocument = (id, shipmentId, params, cb) => {
    return dispatch => {
        LoadingDocuments(DOCUMENT_TYPES.BILL, true, dispatch);
        TradeApi.postDocument(id, shipmentId, params).then(r => {
            LoadingDocuments(DOCUMENT_TYPES.BILL, false, dispatch);
            GetTradeBill(id, shipmentId)(dispatch);
            dispatch({
                type: POST_TRADE_DOCUMENT,
                payload: {response: r.data, data: params, shipmentId}
            });
            cb();
        });
    };
};

export const PostTradeDocumentInvoice = (id, params, cb) => {
    return dispatch => {
        LoadingDocuments(DOCUMENT_TYPES.INVOICE, true, dispatch);
        TradeApi.postDocumentInvoice(id, params).then(r => {
            LoadingDocuments(DOCUMENT_TYPES.INVOICE, false, dispatch);
            GetTradeInvoice(id)(dispatch);
            if (cb) {
                cb(r.data);
            }
        })
            .catch(() => {
                LoadingDocuments(DOCUMENT_TYPES.INVOICE, false, dispatch);
                if (cb) {
                    cb();
                }
            });
    };
};

export const SmartTrade = {
    Cancel: (id, cb) => tradeAction(id, 'cancel', cb),
    Rejcet: (id, cb) => tradeAction(id, 'reject', cb),
    Accept: (id, cb) => tradeAction(id, 'accept', cb),
    Sign: (id, params, cb) => tradeAction(id, 'sign', cb, params)
};

export const updateSignedLocaly = trader => {
    return dispatch => {
        dispatch({
            type: UPDATE_SIGNED,
            payload: trader
        });
    };
};

export const updateVesselNominated = nominated => {
    return dispatch => {
        dispatch({
            type: UPDATE_NOMINATED,
            payload: nominated
        });
    };
};

export const updatePayedLocaly = () => {
    return dispatch => {
        dispatch({
            type: UPDATE_PAYED,
            payload: null
        });
    };
};


export const updateNominationStatus = trader => {
    return dispatch => {
        dispatch({
            type: UPDATE_SIGNED,
            payload: trader
        });
    };
};

const tradeAction = (id, action, cb, params) => {
    return dispatch => {
        TradeApi.smart(id, action)
            .action(action, params)
            .then(r => {
                if (r.data.status) {
                    dispatch({
                        type: SET_STATUS,
                        payload: r.data.status
                    });
                }
                if (cb) {
                    cb(r.data);
                }
            })
            .catch(error => {
                cb();
            });
    };
};

export const ReplyMessage = (id, userId) => {
    return dispatch => {
        dispatch({
            type: REPLY_MESSAGE,
            payload: {id, userId}
        });
    };
};

export const PostMessage = (reqId, message) => {
    return dispatch => {
        LoadingTradeMessages(true, dispatch);
        TradeApi.postMessage(reqId, message).then(r => {
            dispatch({
                type: POST_MESSAGE,
                payload: ''
            });
            TradeApi.getMessages(reqId).then(r => {
                LoadingTradeMessages(false, dispatch);
                dispatch({
                    type: GET_MESSAGES,
                    payload: r.data.comments
                });
            });
        });
    };
};

export const CreateTradeRequest = (request, cb) => {
    return dispatch => {
        LoadingCreateRequest(dispatch, true);
        TradeApi.create(request)
            .then(() => {
                dispatch({
                    type: CREATE_REQUEST,
                    payload: {}
                });
                LoadingCreateRequest(dispatch, false);
                cb();
            })
            .catch(e => {
                LoadingCreateRequest(dispatch, false);
                console.log('catch', e);
                handleError(dispatch, e);
            });
    };
};

export const LoadRequests = (data, cb) => {
    return dispatch => {
        LoadingRequestData(dispatch, true);
        TradeApi.list(data)
            .then(r => {
                LoadingRequestData(dispatch, false);
                dispatch({
                    type: LOAD_REQUESTS,
                    payload: {items: r.data.items, counts: r.data.counts, type: data.type}
                });
                if (cb) {
                    cb();
                }
            })
            .catch(e => {
                console.log('catch', e);
            });
    };
};

export const LoadInspectionTradeList = (data, callback) => {
    return dispatch => {
        TradeApi.getInspectionTradeList(data)
            .then(response => {
                dispatch({
                    type: LOAD_INSPECTION_TRADES,
                    payload: {items: response.data.items, counts: response.data.counts}
                });
                if (callback) {
                    callback();
                }
            })
            .catch(error => console.error(error));
    };
};

export const LoadRequestInfo = (id, cb) => {
    return dispatch => {
        TradeApi.getRequestInfo(id)
            .then(r => {
                dispatch({
                    type: LOAD_REQUEST_INFO,
                    payload: r.data
                });
                if (cb) {
                    cb();
                }
            })
            .catch(e => {
                console.log('catch', e);
            });
    };
};

export const loadRequestDetails = (id, cb) => {
    return async dispatch => {
        LoadingRequestData(dispatch, true);
        TradeApi.get(id)
            .then(r => {
                LoadingRequestData(dispatch, false);
                dispatch({
                    type: LOAD_REQUEST_DETAILS,
                    payload: {items: r.data.request}
                });
                if (cb) {
                    cb();
                }
            })
            .catch(e => {
                LoadingRequestData(dispatch, false);
                const currentLocation = window.location.pathname.split('/').filter(path => !!path)[0];
                let pushAction;
                if (['requests', 'trades'].includes(currentLocation)) {
                    pushAction = push(`/${currentLocation}`);
                } else {
                    pushAction = push('/');
                }
                dispatch(pushAction);
                let errorText;
                if (e.response.status === 403) {
                    errorText = 'This trade is already accepted';
                } else {
                    errorText = 'Something went wrong. Please try again a few moments later or contact the support team.';
                }
                showErrorModal(<h4 className="text-center">{errorText}</h4>)(dispatch);
            });
    };
};

export const UpdateTradeRequest = (id, params) => {
    return async function (dispatch) {
        LoadingCreateRequest(dispatch, true);
        try {
            await TradeApi.update(id, params);
            LoadingCreateRequest(dispatch, false);
        } catch (e) {
            LoadingCreateRequest(dispatch, false);
            console.log('catch', e);
        }
    };
};

export const UpdateTradeDocumentLocaly = (docName, text) => {
    return dispatch => {
        dispatch({
            type: UPDATE_TRADE_DOCUMENT,
            payload: {docName, text}
        });
    };
};

export const searchCompanies = search => {
    return dispatch => {
        TradeApi.getCounterparties(search)
            .then(r => {
                r.data.items.sort(function (a, b) {
                    if (a.Name.toUpperCase() < b.Name.toUpperCase()) {
                        return -1;
                    }
                    if (a.Name.toUpperCase() > b.Name.toUpperCase()) {
                        return 1;
                    }
                    return 0;
                });
                dispatch({
                    type: LOAD_COMPANIES,
                    payload: {companies: r.data.items}
                });
            })
            .catch(e => {
                console.log('catch', e);
            });
    };
};

export const preloadInspectionCompanies = search => {
    return dispatch => {
        TradeApi.getInspectionCompanies(search)
            .then(r => {
                dispatch({
                    type: LOADED_INSPECTION_COMPANIES,
                    payload: {companies: r.data.companies}
                });
            })
            .catch(e => {
                console.log('catch', e);
            });
    };
};


export const getMessage = id => {
    return dispatch => {
        LoadingTradeMessages(true, dispatch);
        TradeApi.getMessages(id).then(r => {
            LoadingTradeMessages(false, dispatch);
            dispatch({
                type: GET_MESSAGES,
                payload: r.data.comments
            });
        });
    };
};

export const GetDocumentComments = (tradeId, shipmentId, documentId) => {
    return dispatch => {
        LoadingDocumentComments(true, documentId, dispatch);
        TradeApi.getDocumentComments(tradeId, shipmentId, documentId)
            .then(response => {
                LoadingDocumentComments(false, documentId, dispatch);
                dispatch({
                    type: GET_DOCUMENT_COMMENTS,
                    payload: {data: response.data.comments || [], documentId}
                })
            })
    }
};

export const PostDocumentComment = (tradeId, shipmentId, documentId, params) => {
    return dispatch => {
        LoadingDocumentComments(true, documentId, dispatch);
        TradeApi.postDocumentComment(tradeId, shipmentId, documentId, params)
            .then(response => {
                LoadingDocumentComments(false, documentId, dispatch);
                GetDocumentComments(tradeId, shipmentId, documentId)(dispatch);
            })
            .catch(error => console.error(error))
    }
};

export const ClearDocumentComments = (documentId) => {
    return dispatch => {
        dispatch({
            type: GET_DOCUMENT_COMMENTS,
            payload: {data: [], documentId}
        });
    }
};

export const SetTradeStatus = (status) => {
    return dispatch => {
        dispatch({
            type: SET_STATUS,
            payload: status
        });
    }
};

export const ClearTradeState = () => {
    return dispatch => {
        dispatch({
            type: CLEAR_TRADE_STATE,
        })
    }
};

export const UpdateRequest = data => {
    return dispatch => {
        dispatch({
            type: UPDATE_REQUEST,
            payload: data
        })
    }
};

export const CounterTrade = (tradeId, params) => {
    return dispatch => {
        LoadingRequestData(dispatch, true);
        TradeApi.postBid(tradeId, params)
            .then(() => {
                LoadTradeBids(tradeId)(dispatch);
            })
            .catch(() => {
                LoadingRequestData(dispatch, false);
            });
    }
};

export const LoadTradeBids = tradeId => {
    return dispatch => {
        LoadingRequestData(dispatch, true);
        TradeApi.getBids(tradeId)
            .then(response => {
                dispatch({
                    type: GET_BIDS,
                    payload: response.data.bids || []
                });
                LoadingRequestData(dispatch, false);
            })
            .catch(() => {
                LoadingRequestData(dispatch, false);
            });
    }
};

export const AcceptTradeBid = (tradeId, callback) => {
    return dispatch => {
        LoadingRequestData(dispatch, true);
        TradeApi.acceptBid(tradeId)
            .then(() => {
                LoadingRequestData(dispatch, false);
                if (callback) {
                    callback();
                }
            })
            .catch(() => {
                LoadingRequestData(dispatch, false);
            });
    }
};

export const DeclineTradeBid = tradeId => {
    return dispatch => {
        LoadingRequestData(dispatch, true);
        TradeApi.declineBid(tradeId)
            .then(() => {
                LoadTradeBids(tradeId)(dispatch);
            })
            .catch(() => {
                LoadingRequestData(dispatch, false);
            });
    }
};

export const AutoupdateTriggered = (value = false) => {
    return dispatch => {
        dispatch({
            type: AUTOUPDATE_TRIGGERED,
            payload: value
        })
    }
};