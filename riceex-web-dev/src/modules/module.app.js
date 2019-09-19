export const IS_READY = 'UI/IS_READY';
export const IS_BUSY = 'UI/IS_BUSY';
export const ERROR_RECEIVED = 'UI/ERROR_RECEIVED';
export const SHOW_ERROR_MODAL = 'UI/SHOW_ERROR_MODAL';
export const HIDE_ERROR_MODAL = 'UI/HIDE_ERROR_MODAL';

const initialState = {
    busy: {},
    isBusy: true,
    lastError: {},
    errors: [],
    errorModal: {
        content: null,
        show: false
    }
};

export default (state = initialState, action) => {
    switch (action.type) {
        case IS_BUSY:
            if (state.busy.hasOwnProperty(action.payload)) return state;
            state.busy[action.payload] = 'true';
            return {
                ...state,
                busy: state.busy,
                isBusy: Object.keys(state.busy).length > 0
            };
        case IS_READY:
            if (!state.busy.hasOwnProperty(action.payload)) return state;
            delete state.busy[action.payload];
            return {
                ...state,
                isBusy: Object.keys(state.busy).length > 0
            };
        case ERROR_RECEIVED:
            return {
                ...state,
                busy: (state.busy = {}),
                errors: [...state.errors, action.payload],
                isBusy: false
            };
        case SHOW_ERROR_MODAL:
            return {
                ...state,
                errorModal: {
                    ...state.errorModal,
                    show: true,
                    content: action.payload
                }
            };
        case HIDE_ERROR_MODAL:
            return {
                ...state,
                errorModal: {
                    ...state.errorModal,
                    show: false,
                    content: null
                }
            };
        default:
            return state;
    }
};


export const lockUI = (dispatch, name) => {
    dispatch({
        type: IS_BUSY,
        payload: name
    });
};

export const unlockUI = (dispatch, name) => {
    dispatch({
        type: IS_READY,
        payload: name
    });
};

export const handleError = (dispatch, err) => {
    dispatch({
        type: ERROR_RECEIVED,
        payload: err
    });
};

export const showErrorModal = content => {
    return dispatch => {
        dispatch({
            type: SHOW_ERROR_MODAL,
            payload: content
        });
    };
};

export const hideErrorModal = () => {
    return dispatch => {
        dispatch({
            type: HIDE_ERROR_MODAL
        });
    };
};
