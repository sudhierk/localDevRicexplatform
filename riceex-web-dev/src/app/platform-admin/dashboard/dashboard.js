import React, { Component } from 'react';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';

import './dashboard.css';
import LastAddedKyc from './last-added-kyc';

class PlatformAdminDashboard extends Component {
    render() {
        return (
            <div className="pa-dashboard">
                <Header/>
                <LastAddedKyc/>
                <Footer/>
            </div>
        )
    }
}

export default PlatformAdminDashboard;
