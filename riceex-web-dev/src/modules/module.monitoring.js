import axios from 'axios';


// const initialState = {
//   exchangeRates: [
//     {
//       main: 'SAMPLE',
//       compareTo: 'SAMPLE',
//       values: [
//         {
//           time: 1529884800,
//           rate: 6260.35
//         },
//         {
//           time: 1529971200,
//           rate: 6088.39
//         }
//       ]
//     }
//   ]
// };
const initialState = {
  exchangeRates: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'LOAD_CURRENCIES':
      if (state.exchangeRates.some(item => item.main === action.main && item.compareTo === action.compareTo)) {
        return state
      } else {
        return {
          ...state,
          exchangeRates: [
            ...state.exchangeRates,
            {
              main: action.main,
              compareTo: action.compareTo,
              values: action.data.sort((a,b)=>a.time - b.time),
              diff: (+action.data[action.data.length-1].rate - +action.data[0].rate).toFixed(2)
            }
          ]
        };
      }
    default:
      return state;
  }
};

export const loadCurrencyRates = (main, compareTo) => (
  dispatch => {
    let url = 'https://min-api.cryptocompare.com/data/histoday' +
      '?aggregate=1' +
      '&limit=29' +
      '&toTs=' + +new Date() +
      '&fsym='+ main +'' +
      '&tsym='+ compareTo;
    axios.get(url).then(
      result => {
        dispatch({
          type: 'LOAD_CURRENCIES',
          main,
          compareTo,
          data: result.data.Data.map(item=>({time: item.time, rate: item.close}))
        })
      }
    )
  }
);