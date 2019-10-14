import axios from 'axios';
import FileSaver from 'file-saver';

let isAbsoluteURLRegex = /^(?:\w+:)\/\//;
const API_URL = process.env.REACT_APP_API_URL + '/v1/api';
console.log(process.env.REACT_APP_API_URL);

axios.interceptors.request.use(function (config) {
    if (!isAbsoluteURLRegex.test(config.url)) {
        config.url = API_URL + config.url;
    }
    console.log("URL",config.url);
    console.log("request body",config.data);
    console.log("query params",config.params);
    return config;
});

export const TradeApi = {
    list: (data, params) => axios.get(`/trade/`, {...authHeader(params), params: tradeListParams(data)}),
    get: id => axios.get('/trade/' + id, authHeader()),
    getInspectionTradeList: (data, params) => axios.get('/inspection/trades', {
        ...authHeader(params),
        params: tradeListParams(data)
    }),
    getRequestInfo: id => axios.get('/trade/' + id + '/info', authHeader()),
    getShipments: id => axios.get('/trade/' + id + '/shipments', authHeader()),
    getTradeDocuments: (tradeId, shipmentId) => axios.get(`/trade/${tradeId}/shipment/${shipmentId}/documents`, authHeader()),
    getTradeBill: (tradeId, shipmentId) => axios.get(`/trade/${tradeId}/shipment/${shipmentId}/bill`, authHeader()),
    getTradeInvoice: id => axios.get('/trade/' + id + '/invoice', authHeader()),
    postDocument: (id, shipmentId, params) => axios.post(`/trade/${id}/shipment/${shipmentId}/bill`, params, authHeader()),
    updateBill: (id, shipmentId, params) => axios.put(`/trade/${id}/shipment/${shipmentId}/bill`, params, authHeader()),
    updateInvoice: (id, params) => axios.put(`/trade/${id}/invoice`, params, authHeader()),
    postDocumentInvoice: (id, params) => axios.post(`/trade/${id}/invoice`, params, authHeader()),
    updateDocumentFile: (tradeId, shipmentId, params) => axios.put(`/trade/${tradeId}/shipment/${shipmentId}/document`, params, authHeader()),
    postDocumentFile: (tradeId, shipmentId, params) => axios.post(`/trade/${tradeId}/shipment/${shipmentId}/upload`, params, authHeader()),
    getDocumentFile: (tradeId, shipmentId, fileId, responseType = 'arraybuffer') => axios.get(`/trade/${tradeId}/shipment/${shipmentId}/file/${fileId}`, {
        ...authHeader(),
        responseType
    }),
    approveDocument: (tradeId, shipmentId, docId, params) => axios.put(`/trade/${tradeId}/shipment/${shipmentId}/document/${docId}/approve`, params, authHeader()),
    rejectDocument: (tradeId, shipmentId, docId, params) => axios.put(`/trade/${tradeId}/shipment/${shipmentId}/document/${docId}/reject`, params, authHeader()),
    releaseDocument: (tradeId, shipmentId, docId, params) => axios.put(`/trade/${tradeId}/shipment/${shipmentId}/document/${docId}/release`, params, authHeader()),
    getInspectionReports: id => axios.get(`/trade/${id}/report_inspection`, authHeader()),
    postInspectionReport: (id, params) => axios.post(`/trade/${id}/report_inspection`, params, authHeader()),
    create: params => axios.post('/trade/', params, authHeader()),
    update: (id, params) => axios.put('/trade/' + id, params, authHeader()),
    getCounterparties: search => axios.get('/company?search=' + search, authHeader()),
    getInspectionCompanies: () => axios.get('/company/inspections', authHeader()),
    getMessages: id => axios.get(`/trade/${id}/comments`, authHeader()),
    postMessage: (id, params) => axios.post(`/trade/${id}/comments`, params, authHeader()),
    postDocumentComment: (tradeId, shipmentId, documentId, params) => axios.post(
        `/trade/${tradeId}/shipment/${shipmentId}/document/${documentId}/comment`, params, authHeader()
    ),
    getDocumentComments: (tradeId, shipmentId, documentId) => axios.get(
        `/trade/${tradeId}/shipment/${shipmentId}/document/${documentId}/comments`, authHeader()
    ),
    setRequestStatus: (id, params) => axios.post(`/trade/${id}/status`, params, authHeader()),
    getInspectionReportTemplate: () => axios.get('/templates/inspectionReport', {
        ...authHeader(),
        responseType: 'blob'
    }),
    postBid: (id, params) => axios.post(`/trade/${id}/bid/`, params, authHeader()),
    getBids: id => axios.get(`/trade/${id}/bid/`, authHeader()),
    acceptBid: id => axios.put(`/trade/${id}/bid/accept`, null, authHeader()),
    declineBid: id => axios.put(`/trade/${id}/bid/decline`, null, authHeader()),
    smart: id => smartApi(`/trade/${id}/smart`)
};

export const smartApi = url => {
    return {
        action: (state, params) => axios.post(url + '/' + state, params, authHeader()),
        nominateVessel: params => axios.put(url + '/nominate_vessel', params, authHeader()),
        vesselAccept: params => axios.put(url + '/accept_vessel_nomination', params, authHeader()),
        vesselReject: () => axios.put(url + '/reject_vessel_nomination', null, authHeader()),
        getInstructions: () => axios.get(url + '/instructions', authHeader()),
        vesselMessage: () => axios.get(url + '/vessel_nomination', authHeader()),
        instructions: params => axios.post(url + '/instructions', params, authHeader()),
        advice: params => axios.post(url + '/advice', params, authHeader()),
        updateTradeDocument: params => axios.put(url + '/update', params, authHeader()),
        docConfirm: () => axios.post(url + '/confirm_documents', null, authHeader()),
        processPayment: text => axios.post(url + '/payment', {text}, authHeader()),
        confirmPayment: () => axios.post(url + '/confirm_payment', null, authHeader()),
        closeTrade: () => axios.post(url + '/close', null, authHeader()),
        log: () => axios.get(url + '/log', authHeader())
    };
};

export const ExchangeApi = {
    get: (skip, take) => axios.get(`/exchange/?skip=${skip}&take=${5}`, authHeader())
};

export const KycApi = {
    get: () => axios.get('/kyc/', authHeader()),
    getAll: params => axios.get('/kyc/getKYCs', {...authHeader(), params}),
    save: params => axios.post('/kyc/editing/', params, authHeader()),
    submitForReview: params => axios.post('/kyc/save/', params, authHeader())
};

export const AccountApi = {
    token: () => localStorage.getItem('jwt'),
    updateJWTToken: () => axios.get('/auth/refresh-token', authHeader()),
    setToken: token => localStorage.setItem('jwt', token),
    login: params => axios.post('/auth/login/', params),
    register: params => axios.post('/auth/register/', params),
    logout: () => localStorage.removeItem('jwt'),
    forgot: params => axios.post('/auth/forgot/', params),
    profile: () => axios.get('/auth/', authHeader()),
    updatePassword: (code, params) => axios.post(`/auth/update/` + code, params),
    validateChangePasswordCode: (code) => axios.get(`/auth/update/` + code),
    getProfile: () => axios.get('/account/profile', authHeader()),
    getNotifications: params => axios.get('/notifications/', {...authHeader(), params}),
    markNotificationAsRead: id => axios.put(`/notifications/${id}`, null, authHeader()),
    markAllNotificationsAsRead: id => axios.put(`/notifications/`, null, authHeader()),
    deleteNotification: id => axios.delete(`/notifications/${id}`, authHeader()),
    deleteAllNotifications: () => axios.delete(`/notifications/`, authHeader()),
    userProfile: () => axios.get('/userProfile/', authHeader()),
    userProfileUpdatePhone: params => axios.put('/userProfile/updatePhone/', params, authHeader())
};

export const SystemApi = {
    getCities: country => axios.get(`/system/cities?country=${country}`, authHeader())
};

export const getFileUrl = (fileId) => API_URL + `/file/${fileId}`;

export const getDocumentFileUrl = (tradeId, shipmentId, fileId) => `${API_URL}/trade/${tradeId}/shipment/${shipmentId}/file/${fileId}`;

export const downloadInspectionReportTemplate = () => {
    TradeApi.getInspectionReportTemplate()
        .then(response => {
            FileSaver.saveAs(response.data, 'inspection-report');
        })
        .catch(error => console.error('something went wrong during file download', error))
};

export const downloadDocumentFile = (tradeId, shipmentId, fileId, docName) => {
    TradeApi.getDocumentFile(tradeId, shipmentId, fileId, 'blob')
        .then(response => {
            FileSaver.saveAs(response.data, docName + '.pdf');
        })
        .catch(error => console.error('something went wrong during file download', error))
};

export const tradeListParams = (data) => {
    return {
        skip: data.skip,
        take: data.take,
        type: data.type || '',
        page: data.page || '',
        status: data.status || '',
        sort: data.sort,
        order: data.order
    }
};

export const authHeader = (params, header) => {
    let result = {
        headers: header ? header : {},
        params: params
    };
    let token = localStorage.getItem('jwt');
    if (token !== undefined) {
        result.headers = {Authorization: 'Bearer '.concat(token)};
    }
    return result;
};
