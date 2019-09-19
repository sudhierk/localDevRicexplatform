import { AccountApi } from '../services';
import { handleError, lockUI, unlockUI } from './module.app';
import { AppErrors } from '../app/components/errors';
import { LoadingData, LoadingCreatePassword, LoadingUpdateUserProfile, LoadingUserProfile } from './module.loading';
import { WS } from './module.ws';
import { GetNotifications } from './module.notifications';

export const AUTH_LOGIN = 'auth/LOGIN';
export const AUTH_LOGOUT = 'auth/LOGOUT';
export const AUTH_REQUEST = 'auth/REQUEST';
export const AUTH_ACCEPTED = 'auth/ACCEPTED';
export const AUTH_REJECTED = 'auth/REJECTED';
export const AUTH_ERROR = 'auth/ERROR';
export const UPDATE_TOKEN = 'auth/UPDATE_TOKEN';
export const PASSWORD_CODE_VALIDATED = 'auth/PASSWORD_CODE_VALIDATED';
export const GET_USER_PROFILE = 'auth/GET_USER_PROFILE';
export const UPDATE_USER_PHONE = 'auth/UPDATE_USER_PHONE';
export const USER_PROFILE_ERROR = 'auth/USER_PROFILE_ERROR';

const initialState = {
    user: undefined,
    error: '',
    updatePasswordCodeValid: false,
    userProfile: null,
    userProfileError: ''
};

export default (state = initialState, action) => {
    switch (action.type) {
        case AUTH_LOGIN:
            // let decodedToken = JSON.parse(atob(action.payload.token.split('.')[1]));
            return {
                ...state,
                error: '',
                user: Object.assign(
                    {},
                    {
                        ...action.payload
                    }
                )
            };

        case AUTH_REQUEST:
            return {
                ...state,
                requested: action.payload
            };
        case UPDATE_TOKEN:
            return {
                ...state,
                token: Object.assign(
                    {},
                    {
                        ...action.payload.token
                    }
                )
            };
        case AUTH_ACCEPTED:
            return {
                ...state,
                token: Object.assign(
                    {},
                    {
                        ...action.payload.token
                    }
                ),
                user: Object.assign(
                    {},
                    {
                        ...action.payload.user
                    }
                )
            };
        case AUTH_REJECTED:
            return {
                ...state,
                error: '',
                requested: null
            };
        case AUTH_LOGOUT:
            return {
                ...state,
                error: '',
                user: null
            };
        case AUTH_ERROR:
            return {
                ...state,
                error: action.payload
            };
        case PASSWORD_CODE_VALIDATED:
            return {
                ...state,
                updatePasswordCodeValid: action.payload
            };
        case GET_USER_PROFILE:
            return {
                ...state,
                userProfileError: '',
                userProfile: {
                    ...action.payload,
                    ...action.payload.userProfile,
                    role: action.payload.role.toLowerCase()
                }
            };
        case UPDATE_USER_PHONE:
            return {
                ...state,
                userProfileError: '',
                userProfile: {
                    ...state.userProfile,
                    phone: action.payload
                }
            };
        case USER_PROFILE_ERROR:
            return {
                ...state,
                userProfileError: action.payload
            };
        default:
            return state;
    }
};

export const login = (params, cb) => {
    return dispatch => {
        LoadingData(dispatch, true);
        // lockUI(dispatch, 'login');
        AccountApi.login(params)
            .then(result => {
                AccountApi.setToken(result.data.token);
                AccountApi.profile()
                    .then(resultProfile => {
                        LoadingData(dispatch, false);
                        dispatch({
                            type: AUTH_LOGIN,
                            payload: {...resultProfile.data, ...result.data}
                        });
                        dispatch({
                            type: AUTH_ACCEPTED,
                            payload: {token: parseJwt(result.data.token), user: resultProfile.data}
                        });
                        GetNotifications({take: 15, skip: 0})(dispatch);
                        dispatch({type: WS.Type.Start, payload: {}});
                        cb(result.data);
                    })
                    .catch(e => {
                        // console.log('catch', e);
                        LoadingData(dispatch, false);

                        handleError(dispatch, e);
                        cb(null);
                    });
            })
            .catch(e => {
                // console.log('catch', e);
                LoadingData(dispatch, false);
                if (e !== undefined && e.response !== undefined && e.response.data !== undefined) {
                    dispatch({
                        type: AUTH_ERROR,
                        payload: {errors: AppErrors[e.response.data.status]}
                    });
                } else {
                    dispatch({
                        type: AUTH_ERROR,
                        payload: {errors: 'Unknown error'}
                    });
                }

                //handleError(dispatch, e);
                cb(null);
            });
    };
};

export const updatePassword = (code, params, cb) => {
    return dispatch => {
        LoadingCreatePassword(dispatch, true);
        AccountApi.updatePassword(code, params)
            .then(result => {
                AccountApi.setToken(result.data.token);
                AccountApi.profile()
                    .then(resultProfile => {
                        LoadingCreatePassword(dispatch, false);

                        dispatch({
                            type: AUTH_LOGIN,
                            payload: {...resultProfile.data, ...result.data}
                        });
                        dispatch({
                            type: AUTH_ACCEPTED,
                            payload: {token: parseJwt(result.data.token), user: resultProfile.data}
                        });
                        GetNotifications({take: 15, skip: 0})(dispatch);
                        dispatch({type: WS.Type.Start, payload: {}});
                        cb(result.data);
                    })
                    .catch(e => {
                        LoadingCreatePassword(dispatch, false);
                        // console.log('catch', e);
                        handleError(dispatch, e);
                        cb(null);
                    });
            })
            .catch(e => {
                // console.log('catch', e);
                LoadingCreatePassword(dispatch, false);
                dispatch({
                    type: AUTH_ERROR,
                    payload: {errors: AppErrors[e.response.data.status]}
                });
                //handleError(dispatch, e);
                cb(null);
            });
    };
};

export const ValidateChangePasswordCode = (code, cb) => {
    return dispatch => {
        AccountApi.validateChangePasswordCode(code)
            .then(result => {
                dispatch({
                    type: PASSWORD_CODE_VALIDATED,
                    payload: result.data.canConfirm
                });
                cb(result.data);
            })
            .catch(e => {
                dispatch({
                    type: PASSWORD_CODE_VALIDATED,
                    payload: false
                });
                cb({canConfirm: false});
            });
    };
};

export const logout = () => {
    return dispatch => {
        AccountApi.logout();
        dispatch({type: WS.Type.Stop});
        dispatch({
            type: AUTH_LOGOUT
        });
    };
};

export const authorize = token => {
    return dispatch => {
        if (token !== undefined) {
            lockUI(dispatch, 'login');
            AccountApi.profile()
                .then(result => {
                    try {
                        dispatch({
                            type: AUTH_ACCEPTED,
                            payload: {token: parseJwt(token), user: result.data}
                        });
                        console.log('Account accepting');
                        dispatch({type: WS.Type.Start, payload: {}});
                        GetNotifications({take: 15, skip: 0})(dispatch);
                        unlockUI(dispatch, 'login');
                    } catch (e) {
                        // console.log(e);
                        handleError(dispatch, e);
                    }
                })
                .catch(e => {
                    // console.log('catch', e);
                    handleError(dispatch, e);
                });
        }
    };
};

function parseJwt(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
}

export const refreshToken = () => {
    AccountApi.updateJWTToken()
        .then(t => {
            AccountApi.setToken(t.data.token);
        })
        .catch(e => {
            // console.log('error refreshing token', e);
        });
};

export const GetUserProfile = () => {
    return dispatch => {
        LoadingUserProfile(true, dispatch);
        AccountApi.userProfile()
            .then(response => {
                LoadingUserProfile(false, dispatch);
                dispatch({
                    payload: response.data,
                    type: GET_USER_PROFILE
                })
            })
            .catch((error) => {
                UserProfileError('Something went wrong during profile loading. Please try again in a few moments.')(dispatch);
                LoadingUserProfile(false, dispatch);
            });
    }
};

export const UpdateUserPhone = phone => {
    return dispatch => {
        LoadingUserProfile(true, dispatch);
        AccountApi.userProfileUpdatePhone({phone})
            .then(response => {
                LoadingUserProfile(false, dispatch);
                dispatch({
                    type: UPDATE_USER_PHONE,
                    payload: phone
                })
            })
            .catch((error) => {
                UserProfileError('Something went wrong during phone update. Please try again in a few moments.')(dispatch);
                LoadingUserProfile(false, dispatch);
            })
    }
};

export const UserProfileError = error => {
    return dispatch => {
        dispatch({
            type: USER_PROFILE_ERROR,
            payload: error
        });
    }
};