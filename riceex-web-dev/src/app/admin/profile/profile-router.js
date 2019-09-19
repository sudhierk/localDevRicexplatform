import ProfileInfo from './profile-info/profile-info';
import { Route } from 'react-router-dom';
import React from 'react';

export const ProfileRouter = () => {
    return (
        <React.Fragment>
            <Route
                exact
                path={'/profile'}
                render={() => <ProfileInfo />}
            />
        </React.Fragment>
    )
};
