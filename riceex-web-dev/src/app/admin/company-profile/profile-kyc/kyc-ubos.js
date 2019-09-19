import { Field, FieldArray } from 'formik';
import { FormikInput } from '../../../components/custom-formik/formik-input';
import React from 'react';
import { FieldArrayControls } from './field-array-controls';
import { FormikInlineFileField } from '../../../components/custom-formik/formik-inline-file-field';
import { fileToBase64 } from '../../../../services/service.utils';
import { KycRequiredSchema } from './kyc-schema';

export const KycUBOs = ({values, setFieldValue, onDocumentPreview}) => {
    const onPassportUpload = (event, index) => {
        const file = event.currentTarget.files[0];
        if (!file) {
            return;
        }
        fileToBase64(file).then(result => {
            const [mime, base64] = result.split(',', 2);
            setFieldValue(`companyUBOS.${index}.passportName`, file.name);
            setFieldValue(`companyUBOS.${index}.passportData`, base64);
            setFieldValue(`companyUBOS.${index}.passportMime`, mime);
        });
    };

    const onUBOPassportPreview = (index) => {
        const ubo = values.companyUBOS[index];
        onDocumentPreview(`${ubo.passportMime},${ubo.passportData}`, 'UBO Passport')
    };

    return (
        <FieldArray
            name="companyUBOS"
            render={arrayHelpers => (
                <div>
                    {values.companyUBOS.map((UBO, index) => (
                        <div key={index} className="row">
                            <div className="col-12">
                                <Field
                                    type="text"
                                    component={FormikInput}
                                    name={`companyUBOS.${index}.name`}
                                    isRequired={KycRequiredSchema.companyUBOS.name}
                                    label={'Name of Ultimate Beneficial Owner'}
                                />
                            </div>
                            <div className="col-12">
                                <Field
                                    component={FormikInlineFileField}
                                    accept={'application/pdf'}
                                    name={`companyUBOS.${index}.passport`}
                                    label={'UBO Passport'}
                                    isRequired={KycRequiredSchema.companyUBOS.passportName}
                                    fileName={values.companyUBOS[index].passportName}
                                    onChange={e => onPassportUpload(e, index)}
                                    validateByName={`companyUBOS.${index}.passportName`}
                                    onDocumentPreview={() => onUBOPassportPreview(index)}
                                />
                            </div>
                            <div className="col-12">
                                <FieldArrayControls
                                    index={index}
                                    arrayLength={values.companyUBOS.length}
                                    onRemove={() => arrayHelpers.remove(index)}
                                    onAdd={() => arrayHelpers.push({name: '', passportName: '', passportData: ''})}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        />
    )
};
