import React from 'react';
import { Field, FieldArray } from 'formik';
import { FormikInput } from '../../../components/custom-formik/formik-input';
import { FieldArrayControls } from './field-array-controls';
import { KycRequiredSchema } from './kyc-schema';

export const KycAuthorizedOfficers = ({values}) => {
    return (
        <React.Fragment>
            <div className="profile-kyc__description">
                I/We hereby confirm and declare that the information provided is complete, true and correct. I/We authorize and grant consent to Rice Exchnage and its officers to verify the information provided and conduct checks on our directors, shareholders, owners, partners and trade references.
            </div>
            <hr />
            <div className="row">
                <div className="col-12">
                    <FieldArray
                        name="authorizedOfficers"
                        render={arrayHelpers => (
                            <div>
                                {values.authorizedOfficers.map((officer, index) => (
                                    <div key={index} className="row">
                                        <div className="col-lg-6 col-12">
                                            <Field
                                                type="text"
                                                component={FormikInput}
                                                name={`authorizedOfficers.${index}.name`}
                                                label={'Authorized Officer Name'}
                                                isRequired={KycRequiredSchema.authorizedOfficers.name}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-12">
                                            <Field
                                                type="text"
                                                component={FormikInput}
                                                name={`authorizedOfficers.${index}.position`}
                                                isRequired={KycRequiredSchema.authorizedOfficers.position}
                                                label={'Position'}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <FieldArrayControls
                                                index={index}
                                                arrayLength={values.authorizedOfficers.length}
                                                onRemove={() => arrayHelpers.remove(index)}
                                                onAdd={() => arrayHelpers.push({name: '', position: ''})}
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
};
