import React from "react";
//COMPONENTS
import SortArrows from "./SortArrowsExchange";

const TableHeader = props => {
  return (
    <React.Fragment>
      {props.name === "bids" && (
        <React.Fragment>
          {!props.isFull ? (
            <div className="exchange__row exchange__row_heading exchange__row_bids">
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">Rice Type</span>
                <SortArrows
                  selected={props.selected}
                  name="riceType"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">
                  Shipping/ <br />Delivery period start
                </span>
                <SortArrows
                  selected={props.selected}
                  name="deliveryStartDate"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">
                  Shipping/ <br />Delivery period end
                </span>
                <SortArrows
                  selected={props.selected}
                  name="deliveryEndDate"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">Quantity</span>
                <SortArrows
                  selected={props.selected}
                  name="measurement"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">Price</span>
                <SortArrows
                  selected={props.selected}
                  name="price"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
            </div>
          ) : (
            <div className="exchange-detailed__row exchange-detailed__row_heading exchange-detailed__row_bids">
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">ID</div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Buyer</span>
                <SortArrows
                  selected={props.selected}
                  name="buyer"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">
                  Vessel/<br />container
                </span>
                <SortArrows
                  selected={props.selected}
                  name="shipping"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Quantity</span>
                <SortArrows
                  selected={props.selected}
                  name="measurement"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Price</span>
                <SortArrows
                  selected={props.selected}
                  name="price"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Origin</span>
                <SortArrows
                  selected={props.selected}
                  name="origin"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Incoterm</span>
                <SortArrows
                  selected={props.selected}
                  name="incoterm"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">
                  Port of load/<br />Destination
                </span>
                <SortArrows
                  selected={props.selected}
                  name="destination"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Rice Type</span>
                <SortArrows
                  selected={props.selected}
                  name="riceType"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">
                  Shipping/<br />Delivery period start
                </span>
                <SortArrows
                  selected={props.selected}
                  name="deliveryStartDate"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">
                  Shipping/<br />Delivery period end
                </span>
                <SortArrows
                  selected={props.selected}
                  name="deliveryEndDate"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Creation Date</span>
                <SortArrows
                  selected={props.selected}
                  name="createdAt"
                  onClick={(name, value) => props.onClickBids(name, value)}
                />
              </div>
            </div>
          )}
        </React.Fragment>
      )}

      {props.name === "offers" && (
        <React.Fragment>
          {!props.isFull ? (
            <div className="exchange__row exchange__row_heading exchange__row_offers">
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">Rice Type</span>
                <SortArrows
                  selected={props.selected}
                  name="riceType"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">
                  Shipping/<br />Delivery period start
                </span>
                <SortArrows
                  selected={props.selected}
                  name="deliveryStartDate"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">
                  Shipping/<br />Delivery period end
                </span>
                <SortArrows
                  selected={props.selected}
                  name="deliveryEndDate"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">Quantity</span>
                <SortArrows
                  selected={props.selected}
                  name="measurement"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange__cell exchange__cell_heading">
                <span className="exchange__hwrapper">Price</span>
                <SortArrows
                  selected={props.selected}
                  name="price"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
            </div>
          ) : (
            <div className="exchange-detailed__row exchange-detailed__row_heading exchange-detailed__row_offers">
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">ID</div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Seller</span>
                <SortArrows
                  selected={props.selected}
                  name="seller"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Vessel/ container</span>
                <SortArrows
                  selected={props.selected}
                  name="shipping"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Quantity</span>
                <SortArrows
                  selected={props.selected}
                  name="measurement"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Price</span>
                <SortArrows
                  selected={props.selected}
                  name="price"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Origin</span>
                <SortArrows
                  selected={props.selected}
                  name="origin"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Incoterm</span>
                <SortArrows
                  selected={props.selected}
                  name="incoterm"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">
                  Port of load/<br />Destination
                </span>
                <SortArrows
                  selected={props.selected}
                  name="destination"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Rice Type</span>
                <SortArrows
                  selected={props.selected}
                  name="riceType"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">
                  Shipping/<br />Delivery period start
                </span>
                <SortArrows
                  selected={props.selected}
                  name="deliveryStartDate"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">
                  Shipping/<br />Delivery period end
                </span>
                <SortArrows
                  selected={props.selected}
                  name="deliveryEndDate"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
              <div className="exchange-detailed__cell exchange-detailed__cell_heading">
                <span className="exchange__hwrapper">Creation Date</span>
                <SortArrows
                  selected={props.selected}
                  name="createdAt"
                  onClick={(name, value) => props.onClickOffers(name, value)}
                />
              </div>
            </div>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default TableHeader;
