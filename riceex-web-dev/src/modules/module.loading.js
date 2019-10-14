import { DOCUMENT_NAMES } from '../app/admin/trades/services/documents.service';

export const LOADING_DATA = 'loading/LOADING_DATA';
export const LOADING_REQUEST_DATA = 'loading/LOADING_REQUEST_DATA';
export const LOADING_REGISTER_DATA = 'loading/LOADING_REGISTER_DATA';
export const LOADING_CREATE_REQUEST = 'loading/LOADING_CREATE_REQUEST';
export const LOADING_CREATE_PASSWORD = 'loading/LOADING_CREATE_PASSWORD';
export const LOADING_CITIES = 'loading/LOADING_CITIES';
export const LOADING_STATUS = 'loading/LOADING_STATUS';
export const LOADING_INITIATE = 'loading/LOADING_INITIATE';
export const LOADING_DOCUMENTS = 'loading/LOADING_DOCUMENTS';
export const LOADING_DOCUMENT_COMMENTS = 'loading/LOADING_DOCUMENT_COMMENTS';
export const LOADING_NOTIFICATIONS = 'loading/LOADING_NOTIFICATIONS';
export const LOADING_MORE_NOTIFICATIONS = 'loading/LOADING_MORE_NOTIFICATIONS';
export const LOADING_TRADE_MESSAGES = 'loading/LOADING_TRADE_MESSAGES';
export const LOADING_USER_PROFILE = 'loading/LOADING_USER_PROFILE';
export const LOADING_UPDATE_USER_PROFILE = 'loading/LOADING_UPDATE_USER_PROFILE';
export const LOADING_KYC = 'loading/LOADING_KYC';

const initialState = {
    isLoading: false,
    registerLoading: false,
    requestLoading: false,
    requestCreation: false,
    requestPassword: false,
    loadingCities: false,
    loadingStatus: false,
    loadingInitiate: false,
    loadingDocuments: {
        all: false,
        [DOCUMENT_NAMES.BILL]: false,
        [DOCUMENT_NAMES.INVOICE]: false,
        [DOCUMENT_NAMES.CERT_OF_QUALITY]: false,
        [DOCUMENT_NAMES.PHYTOSANITARY]: false,
        [DOCUMENT_NAMES.CERT_OF_PACKING]: false,
        [DOCUMENT_NAMES.CERT_OF_FUMIGATION]: false,
        [DOCUMENT_NAMES.QUALITY_APPEARANCE_CERT]: false,
        [DOCUMENT_NAMES.INSURANCE]: false,
        [DOCUMENT_NAMES.EXPORT_DECLARATION]: false,
        [DOCUMENT_NAMES.NON_GMO]: false,
        [DOCUMENT_NAMES.CERT_OF_WEIGHT]: false
    },
    loadingDocumentComments: {},
    loadingNotifications: false,
    loadingMoreNotifications: false,
    loadingTradeMessages: false,
    loadingUserProfile: false,
    loadingUpdateUserProfile: false
};

export default (state = initialState, action) => {
    switch (action.type) {
        case LOADING_DATA:
            return {
                ...state,
                isLoading: action.payload
            };
        case LOADING_REQUEST_DATA:
            return {
                ...state,
                requestLoading: action.payload
            };
        case LOADING_REGISTER_DATA:
            // console.log("LOADING REQUEST DATA");

            return {
                ...state,
                registerLoading: action.payload
            };
        case LOADING_CREATE_REQUEST:
            return {
                ...state,
                requestCreation: action.payload
            };
        case LOADING_CREATE_PASSWORD:
            return {
                ...state,
                requestPassword: action.payload
            };
        case LOADING_CITIES:
            // console.log("LOADING CITIES", action.payload);

            return {
                ...state,
                loadingCities: action.payload
            };
        case LOADING_STATUS:
            return {
                ...state,
                loadingStatus: action.payload
            };
        case LOADING_INITIATE:
            return {
                ...state,
                loadingInitiate: action.payload
            };
        case LOADING_DOCUMENTS:
            const {docName, isLoading} = action.payload;
            return {
                ...state,
                loadingDocuments: {
                    ...state.loadingDocuments,
                    [docName]: isLoading
                }
            };
        case LOADING_DOCUMENT_COMMENTS:
            return {
                ...state,
                loadingDocumentComments: {
                    ...state.loadingDocumentComments,
                    [action.payload.docId]: action.payload.isLoading
                }
            };
        case LOADING_NOTIFICATIONS:
            return {
                ...state,
                loadingNotifications: action.payload
            };
        case LOADING_MORE_NOTIFICATIONS:
            return {
                ...state,
                loadingMoreNotifications: action.payload
            };
        case LOADING_TRADE_MESSAGES:
            return {
                ...state,
                loadingTradeMessages: action.payload
            };
        default:
            return state;
    }
};

export const LoadingDocuments = (docName, isLoading, func) => {
    return func({type: LOADING_DOCUMENTS, payload: {docName, isLoading}});
};

export const LoadingAllDocuments = (isLoading, func) => {
    return func({type: LOADING_DOCUMENTS, payload: {docName: 'all', isLoading}});
};

export const LoadingStatus = isLoading => {
    return dispatch => {
        dispatch({
            type: LOADING_STATUS,
            payload: isLoading
        });
    };
};

export const LoadingInitiate = isLoading => {
    return dispatch => {
        dispatch({
            type: LOADING_INITIATE,
            payload: isLoading
        });
    };
};

export const LoadingCities = isLoading => {
    return dispatch => {
        dispatch({
            type: LOADING_CITIES,
            payload: isLoading
        });
    };
};

export const LoadingData = (func, isLoading) => {
    return func({
        type: LOADING_DATA,
        payload: isLoading
    });
};

export const LoadingRegisterData = isLoading => {
    return dispatch => {
        dispatch({
            type: LOADING_REGISTER_DATA,
            payload: isLoading
        });
    };
};

export const LoadingCreatePassword = (func, isLoading) => {
    return func({
        type: LOADING_CREATE_PASSWORD,
        payload: isLoading
    });
};
export const LoadingRequestData = (func, isLoading) => {
    return func({
        type: LOADING_REQUEST_DATA,
        payload: isLoading
    });
};

export const LoadingCreateRequest = (func, isLoading) => {
    return func({
        type: LOADING_CREATE_REQUEST,
        payload: isLoading
    });
};

export const LoadingDocumentComments = (isLoading, docId, dispatch) => {
    return dispatch({
        type: LOADING_DOCUMENT_COMMENTS,
        payload: {isLoading, docId}
    });
};

export const LoadingNotifications = (isLoading, dispatch) => {
    return dispatch({
        type: LOADING_NOTIFICATIONS,
        payload: isLoading
    })
};

export const LoadingMoreNotifications = (isLoading, dispatch) => {
    return dispatch({
        type: LOADING_MORE_NOTIFICATIONS,
        payload: isLoading
    })
};

export const LoadingTradeMessages = (isLoading, dispatch) => {
    return dispatch({
        type: LOADING_TRADE_MESSAGES,
        payload: isLoading
    })
};

export const LoadingUserProfile = (isLoading, dispatch) => {
    return dispatch({
        type: LOADING_USER_PROFILE,
        payload: isLoading
    })
};

export const LoadingUpdateUserProfile = (isLoading, dispatch) => {
    return dispatch({
        type: LOADING_UPDATE_USER_PROFILE,
        payload: isLoading
    })
};
