import React from 'react';
import { Field, FieldArray } from 'formik';
import { FormikInput } from '../../../components/custom-formik/formik-input';
import { FieldArrayControls } from './field-array-controls';
import { FormikPhoneInput } from '../../../components/custom-formik/formik-phone-input';
import { KycRequiredSchema } from './kyc-schema';

export const KycTradeReferences = ({values}) => {
    return (
        <React.Fragment>
            <div className="profile-kyc__header">Trade References</div>
            <div className="profile-kyc__description mb-3">
                If you desire to share trade references with other users than please fill out this section. Sharing
                trade references can add to building reputation and trust in your company.
            </div>
            <div className="profile-kyc__content row">
                <div className="col-12">
                    <FieldArray
                        name="companyTradeReferences"
                        render={arrayHelpers => (
                            <div>
                                {values.companyTradeReferences.map((tradeReference, index) => (
                                    <div key={index} className="row">
                                        <div className="col-12">
                                            <Field
                                                type="text"
                                                component={FormikInput}
                                                isRequired={KycRequiredSchema.companyTradeReferences.companyName}
                                                name={`companyTradeReferences.${index}.companyName`}
                                                label={'Company Name'}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-12">
                                            <Field
                                                type="text"
                                                component={FormikInput}
                                                isRequired={KycRequiredSchema.companyTradeReferences.contactName}
                                                name={`companyTradeReferences.${index}.contactName`}
                                                label={'Contact Name'}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-12">
                                            <Field
                                                type="text"
                                                component={FormikPhoneInput}
                                                isRequired={KycRequiredSchema.companyTradeReferences.phone}
                                                name={`companyTradeReferences.${index}.phone`}
                                                label={'Tel'}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-12">
                                            <Field
                                                type="text"
                                                component={FormikInput}
                                                isRequired={KycRequiredSchema.companyTradeReferences.address}
                                                name={`companyTradeReferences.${index}.address`}
                                                label={'Address'}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-12">
                                            <Field
                                                type="text"
                                                component={FormikInput}
                                                isRequired={KycRequiredSchema.companyTradeReferences.email}
                                                name={`companyTradeReferences.${index}.email`}
                                                label={'Email'}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <FieldArrayControls
                                                index={index}
                                                arrayLength={values.companyTradeReferences.length}
                                                onRemove={() => arrayHelpers.remove(index)}
                                                onAdd={() => arrayHelpers.push({
                                                    companyName: '',
                                                    contactName: '',
                                                    phone: '',
                                                    address: '',
                                                    email: ''
                                                })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                </div>
            </div>
        </React.Fragment>
    )
}
