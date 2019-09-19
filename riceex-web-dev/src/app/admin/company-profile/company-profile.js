import React, { Component } from 'react';
import Header from '../../components/Header/header';
import { Link } from 'react-router-dom';
import { CompanyProfileNavigation } from './company-profile-navigation';
import { CompanyProfileRouter } from './company-profile-router';

import './company-profile.css';

class CompanyProfile extends Component {
    render() {
        return (
            <React.Fragment>
                <Header />
                <div className="company-profile">
                    <div className="container-fluid">
                        <Link to="/">
                            <div className="profile__back">Back</div>
                        </Link>
                        <CompanyProfileNavigation/>
                        <CompanyProfileRouter/>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default CompanyProfile;
