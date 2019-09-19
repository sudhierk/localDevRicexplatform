import React from 'react';
import { Field } from 'formik';
import { FormikInput } from '../../../components/custom-formik/formik-input';
import { KycRequiredSchema } from './kyc-schema';

export const KycPrincipalOfficers = () => {
    return (
        <React.Fragment>
            <div className="profile-kyc__header">Principal Officers</div>
            <div className="row profile-kyc__content">
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.ceo} name="ceo" label={'CEO/Managing Director'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.cfo} name="cfo" label={'CFO/Finance Manager'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.marketingManager} name="marketingManager" label={'Marketing Manager'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.operationsManager} name="operationsManager" label={'Operations Manager'} />
                </div>
            </div>
        </React.Fragment>
    )
};
