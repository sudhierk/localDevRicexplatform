import React, { Component } from 'react';

import './profile.css';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/header';
import { ProfileRouter } from './profile-router';
import { ProfileNavigation } from './profile-navigation';

class Profile extends Component {
    render() {
        return (
            <React.Fragment>
                <Header />
                <div className="profile">
                    <div className="container-fluid">
                        <Link to="/">
                            <div className="profile__back">Back</div>
                        </Link>
                        <ProfileNavigation/>
                        <ProfileRouter/>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default Profile;