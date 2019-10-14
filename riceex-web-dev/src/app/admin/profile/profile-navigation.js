import { NavLink } from 'react-router-dom';
import React from 'react';

export const ProfileNavigation = () => {
    return (
        <div className="profile__tabs">
            <NavLink
                exact
                to={`/profile`}
                className="profile__tab profile__tab_active"
            >
                My Profile
            </NavLink>
        </div>
    )
};
