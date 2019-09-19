import {Map} from 'immutable';

const Types = {
    Start: 'ws/Start',
    Connected: 'ws/CONNECTED',
    Stop: 'ws/Stop'
};

const initialState = Map({});

export default (state = initialState, {type, payload}) => {
    switch (type) {
        default:
            return state;
    }
};

const Actions = {
    Start: () => ({type: Types.Start, payload: {}}),
};

export const WS = {
    Type: Types,
    Action: Actions
};