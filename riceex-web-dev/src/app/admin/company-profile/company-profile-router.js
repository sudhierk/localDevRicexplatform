import { Route } from 'react-router-dom';
import React from 'react';
import ProfileKyc from './profile-kyc/profile-kyc';

export const CompanyProfileRouter = () => {
    return (
        <React.Fragment>
            <Route
                exact
                path={'/company-profile'}
                render={() => <ProfileKyc />}
            />
        </React.Fragment>
    )
};
