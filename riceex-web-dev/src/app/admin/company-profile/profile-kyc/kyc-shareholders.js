import { Field, FieldArray } from 'formik';
import { FormikInput } from '../../../components/custom-formik/formik-input';
import React from 'react';
import { FieldArrayControls } from './field-array-controls';
import { KycRequiredSchema } from './kyc-schema';

export const KycShareholders = ({values}) => {
    return (
        <FieldArray
            name="companyShareholders"
            render={arrayHelpers => (
                <div>
                    {values.companyShareholders.map((shareholder, index) => (
                        <div key={index} className="row">
                            <div className="col-lg-6 col-12">
                                <Field
                                    type="text"
                                    component={FormikInput}
                                    name={`companyShareholders.${index}.name`}
                                    label={'Shareholder Name (Ownership > 10%)'}
                                    isRequired={KycRequiredSchema.companyShareholders.name}
                                />
                            </div>
                            <div className="col-lg-6 col-12">
                                <Field
                                    type="number"
                                    component={FormikInput}
                                    name={`companyShareholders.${index}.percentage`}
                                    isRequired={KycRequiredSchema.companyShareholders.percentage}
                                    label={'Ownership Percentage'}
                                />
                            </div>
                            <div className="col-12">
                                <FieldArrayControls
                                    index={index}
                                    arrayLength={values.companyShareholders.length}
                                    onAdd={() => arrayHelpers.push({name: '', percentage: undefined})}
                                    onRemove={() => arrayHelpers.remove(index)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        />
    )
};
