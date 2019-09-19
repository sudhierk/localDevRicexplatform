import React from 'react';
import { COMPANY_TYPES } from '../../services/service.values';
import { UserTypes } from '../../utils/userTypes';

export const INSPECTION_COMPANY = 'INSPECTION';

/**
 * this is very basic access control component to suit our current needs with inspection company
 * when we will have more complex logic this component can be enhanced with permissions system
 */
const AccessControl = ({
                           user = {},
                           renderNoAccess,
                           children,
                           userTypes = [UserTypes.COMPANY_EMPLOYEE, UserTypes.COMPANY_ADMIN, UserTypes.PLATFORM_ADMIN],
                           excludeUserTypes = [],
                           excludeCompanyTypes = [],
                           companyTypes = Object.keys(COMPANY_TYPES)
                       }) => {
    let permitted = companyTypes.includes(user.companyType)
        && !excludeCompanyTypes.includes(user.companyType)
        && userTypes.includes(user.userType)
        && !excludeUserTypes.includes(user.userType);
    if (permitted) {
        return children || null;
    }
    return renderNoAccess || null;
};

export default AccessControl;
