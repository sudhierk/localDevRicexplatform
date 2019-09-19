import React from "react";
import { bindActionCreators, compose } from "redux";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import MdMoreVert from "react-icons/lib/md/more-vert";
import {Gradients} from './components/svgHelpers'

//Styles
import "./index.css";

//COMPONENTS
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import Sidenav from "./components/Sidenav";
import Riceindex from "./components/RiceIndex";
import Summary from "./components/Summary";
import Volumes from "./components/Volumes";
import Countries from "./components/Countries";
import ExchangeRates from "./components/ExchangeRates";
import NetPosition from "./components/NetPosition";
import TopTraders from "./components/TopTraders";

const samplePersonData = [
  {x: 1, y: 180},
  {x: 2, y: 300},
  {x: 3, y: 240},
  {x: 4, y: 220},
  {x: 5, y: 340}
];

const sampleCompanyData = [
  {x: 1, y: 280},
  {x: 2, y: 657},
  {x: 3, y: 298},
  {x: 4, y: 234},
  {x: 5, y: 383}
];

const sampleRiceIndex = [
  {x: 1, y:50},
  {x: 2, y:35},
  {x: 3, y:55},
  {x: 4, y:55},
  {x: 5, y:32},
  {x: 6, y:28},
  {x: 7, y:69},
  {x: 8, y:67},
  {x: 9, y:45}
];

const sampleNetData = {
  sellTones: '6850 M',
  sellMoney: '780540',
  buyTones: '670 M',
  buyMoney: '140360'
};

const mapStateToProps = state => ({});

const Dashboard = props => (
  <div className="dashboard">
    <Header />

    <Sidenav/>

    <Gradients/>

    <div className="container-fluid dashboard-container">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="row">

            <div className="col-12">
              <div className="wrapper">
                <div className="heading">Rice Index</div>
                <Riceindex data={sampleRiceIndex}/>
                <MdMoreVert className="more-icon" />
              </div>
            </div>

            <div className=" col-12">
              <div className="wrapper">
                <div className="heading">Summary</div>
                <Summary/>
                <MdMoreVert className="more-icon" />
              </div>
            </div>

            <div className="col-12">
              <div className="row">

                <div className="col-12 col-lg-6">
                  <div className="wrapper">
                    <div className="heading">Volumes of your trades</div>
                    <Volumes dataOrigin="person" data={samplePersonData}/>
                    <MdMoreVert className="more-icon" />
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="wrapper">
                    <div className="heading">Volumes of trades of your company</div>
                    <Volumes dataOrigin="company" data={sampleCompanyData}/>
                    <MdMoreVert className="more-icon" />
                  </div>
                </div>

              </div>
            </div>

            <div className="col-12">
              <div className="wrapper">
                <div className="heading">Volumes of trades in different countries</div>
                <Countries/>
                <MdMoreVert className="more-icon" />
              </div>
            </div>

          </div>
        </div>

        <div className="col-12 col-lg-4 ">
          <div className="row">

            <div className="col-12">
              <div className="wrapper">
                <div className="heading">Exchange rates</div>
                <ExchangeRates/>
                <MdMoreVert className="more-icon" />
              </div>
            </div>

            <div className="col-12">
              <div className="wrapper">
                <div className="heading">Your net position</div>
                <NetPosition data={sampleNetData}/>
                <MdMoreVert className="more-icon" />
              </div>
            </div>

            <div className="col-12">
              <div className="wrapper">
                <div className="heading">Top trades</div>
                <TopTraders/>
                <MdMoreVert className="more-icon" />
              </div>
            </div>


          </div>
        </div>

      </div>
    </div>

    <Footer />
  </div>
);

const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(Dashboard);
