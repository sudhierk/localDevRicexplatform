import React from 'react';
import {VictoryChart, VictoryArea, VictoryAxis, VictoryVoronoiContainer} from 'victory';
import { RicexTooltip} from './svgHelpers';
import './RiceIndex.css';

export default (props) => (
  <div className="rice-index">
    <VictoryChart
      width={1000}
      height={170}
      domain={{x:[1,9], y:[0,100]}}
      padding={{top: 5, bottom: 35, left: 0, right: 0}}
      containerComponent={<VictoryVoronoiContainer/>}
      domainPadding={[5,5]}
    >
      <VictoryAxis
        style={{
          tickLabels: {fontSize: 12, fontFamily: "ProximaNova", fill: "#7f8fa4", fontWeight: "700", textTransform: 'uppercase', letterSpacing: "-0.7px"},
          axis: {stroke: 'none'}
        }}
        tickValues={['AUG 17','SEP 17','OCT 17','NOV 17','DEC 17','JAN 18','FEB 18','MAR 18','APR 18']}
      />
      <VictoryAxis
        dependentAxis
        style={{
          grid: {stroke: 'rgba(117,111,106,0.15)', strokeDasharray: "2 2", strokeWidth: "2"},
          axis: {stroke: 'none'},
          tickLabels: {fontSize: 12, fontFamily: "ProximaNova", fill: "#7f8fa4", fontWeight: "600"}
        }}
        tickValues={[0,25,50,75,100]}
      />
      <VictoryArea
        data={props.data}
        style={{
          data: {
            fill: "url(#areaGreen)",
            stroke: "#52bfc9",
            strokeWidth: 2
          }
        }}
        labels={(d) => d.y}
        labelComponent={
          <RicexTooltip markColor='#52bfc9' />
        }
      />
    </VictoryChart>
  </div>
);