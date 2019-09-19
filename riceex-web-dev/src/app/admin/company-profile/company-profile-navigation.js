import { NavLink } from 'react-router-dom';
import React from 'react';

export const CompanyProfileNavigation = () => {
    return (
        <div className="profile__tabs">
            <NavLink
                exact
                to="/company-profile"
                className="profile__tab"
            >
                KYC
            </NavLink>
        </div>
    )
};
