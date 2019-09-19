import React from 'react';
import { Field } from 'formik';
import { FormikInput } from '../../../components/custom-formik/formik-input';
import { KycShareholders } from './kyc-shareholders';
import { KycUBOs } from './kyc-ubos';
import { FormikInlineFileField } from '../../../components/custom-formik/formik-inline-file-field';
import { fileToBase64 } from '../../../../services/service.utils';
import { FormikPhoneInput } from '../../../components/custom-formik/formik-phone-input';
import { FormikDropdown } from '../../../components/custom-formik/formik-dropdown';
import { COMPANY_TYPES } from '../../../../services/service.values';
import { KycRequiredSchema } from './kyc-schema';

const companyTypeOptions = Object.keys(COMPANY_TYPES).map(key => ({
    value: key,
    label: COMPANY_TYPES[key]
}));

export const KycCompanyDetails = ({values, setFieldValue, onDocumentPreview}) => {
    const onCertificateUpload = (e) => {
        const file = e.currentTarget.files[0];
        if (!file) {
            return;
        }
        fileToBase64(file).then(result => {
            const [mime, base64] = result.split(',', 2);
            setFieldValue('certificateOfIncorporationName', file.name);
            setFieldValue('certificateOfIncorporationData', base64);
            setFieldValue('certificateOfIncorporationMime', mime);
        });
    };

    return (
        <React.Fragment>
            <div className="profile-kyc__header">Company Details</div>
            <div className="profile-kyc__content row">
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.name} name="name" label={'Company Name'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikPhoneInput} isRequired={KycRequiredSchema.phone} name="phone" label={'Tel'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.address1} name="address1" label={'Business Address, Line 1'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.address2} name="address2" label={'Business Address, Line 2'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.email} name="email" label={'Email'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.tax} name="tax" label={'Company Registration No'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field
                        component={FormikDropdown}
                        name="companyType"
                        label={'Type of Company'}
                        items={companyTypeOptions}
                        isRequired={KycRequiredSchema.companyType}
                        value={{value: values.companyType, label: COMPANY_TYPES[values.companyType]}}
                    />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.site} name="site" label={'Website'} />
                </div>
                <div className="col-lg-6 col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.contact} name="contact" label={'Contact Person'} />
                </div>
                <div className="col-12">
                    <Field
                        component={FormikInlineFileField}
                        accept={'application/pdf'}
                        name="certificateOfIncorporation"
                        label={'Certificate of Incorporation'}
                        isRequired={KycRequiredSchema.certificateOfIncorporationName}
                        fileName={values.certificateOfIncorporationName}
                        onChange={onCertificateUpload}
                        validateByName={'certificateOfIncorporationName'}
                        onDocumentPreview={() => onDocumentPreview(`${values.certificateOfIncorporationMime},${values.certificateOfIncorporationData}`, 'Certificate of Incorporation')}
                    />
                </div>
            </div>
            <hr/>
            <div className="row">
                <div className="col-12">
                    <KycShareholders values={values} />
                </div>
            </div>
            <hr/>
            <div className="row">
                <div className="col-12">
                    <KycUBOs onDocumentPreview={onDocumentPreview} values={values} setFieldValue={setFieldValue} />
                </div>
            </div>
            <hr/>
            <div className="row">
                {/*todo uncomment when data will be discussed */}
                <div className="col-12">
                    <Field type="text" component={FormikInput} isRequired={KycRequiredSchema.businessNature} name="businessNature" label={'Nature of Business'} />
                </div>
                {/*<div className="col-12">*/}
                {/*    <Field type="text" component={FormikInput} name="isMemberOf" label={'Is your company a member of?'} />*/}
                {/*</div>*/}
                {/*<div className="col-12">*/}
                {/*    <Field type="text" component={FormikInput} name="doHaveCertifications" label={'Do you have any certifications?'} />*/}
                {/*</div>*/}
            </div>
        </React.Fragment>
    )
};
