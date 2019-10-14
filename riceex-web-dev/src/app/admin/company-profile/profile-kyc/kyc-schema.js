import * as yup from 'yup';

export const KycSchema = yup.object().shape({
    name: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
    companyType: yup.string().required('This field is required'),
    tax: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
    phone: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
    address1: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
    address2: yup.string().max(256, 'Must be at most 256 characters'),
    email: yup.string().required('This field is required').email('Invalid email').max(256, 'Must be at most 256 characters'),
    ceo: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
    cfo: yup.string().max(256, 'Must be at most 256 characters'),
    operationsManager: yup.string().max(256, 'Must be at most 256 characters'),
    marketingManager: yup.string().max(256, 'Must be at most 256 characters'),
    certificateOfIncorporationName: yup.string().required('This field is required').max(256, 'Must be at most 256 characters').matches(/([a-zA-Z0-9\s_\\.\-\(\):])+(.pdf)/, 'File must be in PDF format'),
    certificateOfIncorporationData: yup.string().required('This field is required'),
    certificateOfIncorporationMime: yup.string().required('This field is required'),
    certificateOfIncorporation: yup.mixed(),
    businessNature: yup.string().max(256, 'Must be at most 256 characters'),
    isMemberOf: yup.string().max(256, 'Must be at most 256 characters'),
    doHaveCertifications: yup.string().max(256, 'Must be at most 256 characters'),
    Date: yup.string().required('This field is required'),
    site: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
    contact: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
    companyUBOS: yup
        .array()
        .required('This field is required')
        .of(yup.object({
            name: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
            passportName: yup.string().required('This field is required').matches(/([a-zA-Z0-9\s_\\.\-\(\):])+(.pdf)/, 'File must be in PDF format'),
            passportData: yup.string().required('This field is required'),
            passportMime: yup.string().required('This field is required'),
            passport: yup.mixed()
        })),
    companyShareholders: yup
        .array()
        .required('This field is required')
        .of(yup.object({
            name: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
            percentage: yup.number()
                .typeError('Must be a number')
                .integer('Must be a number')
                .min(0, 'Must be more than or equal to 0')
                .max(100, 'Must be less than or equal to 100')
                .required('This field is required')
        }))
        .min(1),
    authorizedOfficers: yup
        .array()
        .required('This field is required')
        .of(yup.object({
            name: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
            position: yup.string().required('This field is required').max(256, 'Must be at most 256 characters'),
        })),
    companyTradeReferences: yup
        .array()
        .required('This field is required')
        .of(yup.object({
            companyName: yup.string().max(256, 'Must be at most 256 characters'),
            contactName: yup.string().max(256, 'Must be at most 256 characters'),
            phone: yup.string().max(256, 'Must be at most 256 characters'),
            address: yup.string().max(256, 'Must be at most 256 characters'),
            email: yup.string().email('Invalid email').max(256, 'Must be at most 256 characters')
        }))
});

export const KycRequiredSchema = {
    name: true,
    companyType: true,
    tax: true,
    phone: true,
    address1: true,
    address2: false,
    email: true,
    ceo: true,
    cfo: false,
    marketingManager: false,
    operationsManager: false,
    certificateOfIncorporationName: true,
    certificateOfIncorporationData: true,
    certificateOfIncorporationMime: true,
    Date: true,
    site: true,
    contact: true,
    businessNature: false,
    companyUBOS: {
        name: true,
        passportName: true,
        passportData: true,
        passportMime: true
    },
    companyShareholders: {
        name: true,
        percentage: true
    },
    authorizedOfficers: {
        name: true,
        position: true
    },
    companyTradeReferences: {
        companyName: false,
        contactName: false,
        phone: false,
        address: false,
        email: false
    }
};
