import React from 'react';
import {connect} from 'react-redux';
import { bindActionCreators } from "redux";
import {VictoryGroup, VictoryLine} from "victory";
import './ExchangeRates.css';
import { loadCurrencyRates } from '../../../../modules/module.monitoring';


class ExchangeRates extends React.Component {
  componentWillMount() {
    this.props.loadCurrencyRates('BTC','USD');
    this.props.loadCurrencyRates('ETH','USD');
    this.props.loadCurrencyRates('DASH','USD');
  };
  render(){
    return (
      <div className="exchange-rates">
        <svg className="gradient">
          <defs>
            <linearGradient id="linear" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#00dc8f"/>
              <stop offset="47%" stopColor="#00dc8f"/>
              <stop offset="47%" stopColor="#cccccc"/>
              <stop offset="53%" stopColor="#cccccc"/>
              <stop offset="53%" stopColor="#ff0000"/>
              <stop offset="100%" stopColor="#ff0000"/>
            </linearGradient>
          </defs>
        </svg>
        {this.props.rates ?
          this.props.rates.map(item => (
            <div key={item.main+item.compareTo} className="item">
              <div className="pair">{item.main}-{item.compareTo}</div>
              <div className="value">
                {item.values[item.values.length-1].rate}
                <span className={item.diff > 0 ? "positive" : "negative"}>{item.diff}</span>
              </div>
              <div className="chart">
                <VictoryLine
                  data={item.values}
                  x='rate'
                  y='time'
                  width={750}
                  height={300}
                  style={{
                    data: {
                      stroke: "url(#linear)",
                      strokeWidth: 10
                    }
                  }}
                />
              </div>
            </div>
          ))
          :
          'Loading data...'
        }
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
    rates: state.monitoring.exchangeRates
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadCurrencyRates
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(ExchangeRates);
