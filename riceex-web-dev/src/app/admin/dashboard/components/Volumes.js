import React from 'react';
import {VictoryChart, VictoryVoronoiContainer, VictoryAxis, VictoryArea} from 'victory';
import { RicexTooltip} from './svgHelpers'
import './Volumes.css';

export default (props) => (
  <div className="volumes">
    <VictoryChart
      width={500}
      height={170}
      padding={{top: 5, bottom: 35, left: 30, right: 15}}
      containerComponent={<VictoryVoronoiContainer/>}
      domainPadding={[5,5]}
      domain={{x:[1,5], y:[0,800]}}
    >
      <VictoryAxis
        style={{
          tickLabels: {fontSize: 12, fontFamily: "ProximaNova", fill: "#7f8fa4", fontWeight: "700", textTransform: 'uppercase', letterSpacing: "-0.7px"},
          axis: {stroke: 'none'}
        }}
        tickValues={['DEC 17','JAN 18','FEB 18','MAR 18','APR 18']}
      />
      <VictoryAxis
        dependentAxis
        style={{
          grid: {stroke: 'rgba(117,111,106,0.15)', strokeDasharray: "2 2", strokeWidth: "2"},
          axis: {stroke: 'none'},
          tickLabels: {fontSize: 12, fontFamily: "ProximaNova", fill: "#7f8fa4", fontWeight: "600"}
        }}
      />
      <VictoryArea
        data={props.data}
        style={
          props.dataOrigin === 'company' ? {
            data: {
              fill: "url(#areaRed)",
              stroke: "#ff6c83",
              strokeWidth: 2
            }
          } : {
            data: {
              fill: "url(#areaBlue)",
              stroke: "#006aff",
              strokeWidth: 2
            }
          }
        }
        labels={(d) => d.y}
        labelComponent={
          <RicexTooltip
            markColor={
              props.dataOrigin === 'company' ?
                "#ff6c83" :
                "#006aff"
            }
          />
        }
      />
    </VictoryChart>
  </div>
);
