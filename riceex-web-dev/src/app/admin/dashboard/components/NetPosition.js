import React from 'react';
import { VictoryPie, VictoryLabel } from 'victory';
import './NetPosition.css'

export default (props) => (
  <div className="netposition">
    <div className="net-top">
      <div className="net-wrapper">
        <div className="net-left">7520</div>
        <div className="net-right">
          <div className="dynamics positive">145</div>
          <div className="hint">Your trades</div>
        </div>
      </div>
      <div className="net-view">view more</div>
    </div>

    <div className="net-chart-wrapper">
      <div className="net-stats">
        <div className="net-sell">
          Sell<br/>{props.data.sellTones} tones of rice
        </div>
        <div className="net-buy">
          Buy<br/>{props.data.buyTones} tones of rice
        </div>
      </div>
      <div className="net-chart">
        <VictoryPie
          data={[
            {name: 'Buy', value: parseInt(props.data.buyTones)},
            {name: 'Sell', value: parseInt(props.data.sellTones)},
          ]}
          x='name'
          y='value'
          colorScale={['#1292ec', '#ff6b83']}
          innerRadius={185}
          padding={0}
          labelRadius={1}
          labels={['M tones']}
          labelComponent={<VictoryLabel
            dy={30}
          />}
          style={{
            labels: {
              fontSize: 60,
              fill: '#9ba0a9'
            }
          }}
        />
      </div>
    </div>

    <div className="net-chart-wrapper">
      <div className="net-stats">
        <div className="net-sell">
          Sell<br/>$ {props.data.sellMoney}
        </div>
        <div className="net-buy">
          Buy<br/>$ {props.data.buyMoney}
        </div>
      </div>
      <div className="net-chart">
        <VictoryPie
          data={[
            {name: 'Buy', value: parseInt(props.data.buyMoney)},
            {name: 'Sell', value: parseInt(props.data.sellMoney)},
          ]}
          x='name'
          y='value'
          colorScale={['#1292ec', '#ff6b83']}
          innerRadius={185}
          padding={0}
          labelRadius={1}
          labels={['$']}
          labelComponent={<VictoryLabel
            dy={30}
          />}
          style={{
            labels: {
              fontSize: 60,
              fill: '#9ba0a9'
            }
          }}
        />
      </div>
    </div>
  </div>
)