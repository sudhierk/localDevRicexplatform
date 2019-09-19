import React from "react";
import moment from "moment";
import { EnumsService } from "../../../../services/service.utils";
import { DATEFORMAT, INCOTERMOPT } from '../../../../services/service.values';
const Countries = EnumsService.countries();

const TableContent = ({ isFull, item }) => {
  return (
    <React.Fragment>
      {!isFull ? (
        <React.Fragment>
          <div className="exchange__cell">
            <span className="exchange__overflow">{item.riceType}</span>
          </div>
          <div className="exchange__cell">
            <span className="exchange__overflow">{moment(item.deliveryStartDate).format(DATEFORMAT)}</span>
          </div>
          <div className="exchange__cell">
            <span className="exchange__overflow">{moment(item.deliveryEndDate).format(DATEFORMAT)}</span>
          </div>
          <div className="exchange__cell">
            <span className="exchange__overflow">
              {item.measure} {item.measurement === 'TONS' ? "tons" : "cwt"}
            </span>
          </div>
          <div className="exchange__cell">
            <span className="exchange__overflow">${item.price}</span>
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">{item.id}</span>
          </div>
          {item.buyer && (
            <div className="exchange-detailed__cell">
              <span className="exchange__overflow">{item.buyer}</span>
            </div>
          )}
          {item.seller && (
            <div className="exchange-detailed__cell">
              <span className="exchange__overflow">{item.seller}</span>
            </div>
          )}
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">{item.shipping}</span>
          </div>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">
              {item.measure} {item.measurement === 'TONS' ? "tons" : "cwt"}
            </span>
          </div>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">${item.price}</span>
          </div>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">{Countries[item.origin]}</span>
          </div>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">{item.incoterm}</span>
          </div>
          <div className="exchange-detailed__cell">
            {item.incoterm === INCOTERMOPT.FOB && (
                <span className="exchange__overflow">{`${item.loadPort}, ${Countries[item.loadCountry]}`}</span>
            )}
            {item.incoterm === INCOTERMOPT.CIF && (
                <span className="exchange__overflow">{`${item.destPort}, ${Countries[item.destCountry]}`}</span>
            )}
          </div>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">{item.riceType}</span>
          </div>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">{moment(item.deliveryStartDate).format(DATEFORMAT)}</span>
          </div>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">{moment(item.deliveryEndDate).format(DATEFORMAT)}</span>
          </div>
          <div className="exchange-detailed__cell">
            <span className="exchange__overflow">{moment(item.createdAt).format(DATEFORMAT)}</span>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default TableContent;
