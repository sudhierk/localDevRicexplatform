import { EnumsService } from '../../../../services';
import { TRADE_STATUS, STEPS } from '../../../../services/service.values';

const Countries = EnumsService.countries();

// Filters
export const FILTER_ALL = 'All';
export const FILTER_MY_ACTIONS = 'My actions';
export const FILTER_COUNTERPARTY_ACTIONS = 'Counterparty actions';
export const FILTER_INSPECTION_COMPANY_ACTIONS = 'Inspection company actions';

// Document Statuses
export const STATUS_REQUIRED = 'REQUIRED';
export const STATUS_NEW = 'NEW';
export const STATUS_APPROVED_BY_BUYER_DURING_REVIEW = 'APPROVED_BY_BUYER_DURING_REVIEW';
export const STATUS_REJECTED_BY_BUYER_DURING_REVIEW = 'REJECTED_BY_BUYER_DURING_REVIEW';
export const STATUS_APPROVED_BY_SELLER = 'APPROVED_BY_SELLER';
export const STATUS_REJECTED_BY_SELLER = 'REJECTED_BY_SELLER';
export const STATUS_RELEASED_FOR_BUYER = 'RELEASED_FOR_BUYER';
export const STATUS_APPROVED_BY_BUYER = 'APPROVED_BY_BUYER';
export const STATUS_REJECTED_BY_BUYER = 'REJECTED_BY_BUYER';

export const DOC_STATUS = {
    REQUIRED: {
        className: 'required',
        text: 'To be issued',
        status: STATUS_REQUIRED
    },
    NEW: {
        className: 'approval',
        text: 'For approval',
        status: STATUS_NEW
    },
    APPROVED_BY_BUYER_DURING_REVIEW: {
        className: 'approved',
        text: 'Reviewed by buyer',
        docClassName: 'approval',
        status: STATUS_APPROVED_BY_BUYER_DURING_REVIEW
    },
    REJECTED_BY_BUYER_DURING_REVIEW: {
        className: 'rejected',
        text: 'Rejected by buyer',
        status: STATUS_REJECTED_BY_BUYER_DURING_REVIEW
    },
    APPROVED_BY_SELLER: {
        className: 'approved',
        text: 'Approved by seller',
        status: STATUS_APPROVED_BY_SELLER
    },
    REJECTED_BY_SELLER: {
        className: 'rejected',
        text: 'Rejected by seller',
        status: STATUS_REJECTED_BY_SELLER
    },
    RELEASED_FOR_BUYER: {
        className: 'approval',
        text: 'For approval',
        status: STATUS_RELEASED_FOR_BUYER
    },
    APPROVED_BY_BUYER: {
        className: 'approved',
        docClassName: 'approval',
        text: 'Approved by buyer',
        status: STATUS_APPROVED_BY_BUYER
    },
    REJECTED_BY_BUYER: {
        className: 'rejected',
        text: 'Rejected by buyer',
        status: STATUS_REJECTED_BY_BUYER
    }
};

// Document Types
export const DOCUMENT_TYPES = {
    BILL: 'BILL',
    INVOICE: 'INVOICE',
    CERT_OF_QUALITY: 'CERT_OF_QUALITY',
    QUALITY_APPEARANCE_CERT: 'QUALITY_APPEARANCE_CERT',
    CERT_OF_WEIGHT: 'CERT_OF_WEIGHT',
    CERT_OF_PACKING: 'CERT_OF_PACKING',
    CERT_OF_FUMIGATION: 'CERT_OF_FUMIGATION',
    PHYTOSANITARY: 'PHYTOSANITARY',
    NON_GMO: 'NON_GMO',
    EXPORT_DECLARATION: 'EXPORT_DECLARATION',
    INSURANCE: 'INSURANCE',
    DocInstructionsID: 'DocInstructionsID',
    ShippingAdviceID: 'ShippingAdviceID'
};

export const DOCUMENT_NAMES = {
    BILL: 'Bill of Lading',
    INVOICE: 'Invoice',
    CERT_OF_QUALITY: 'Certificate of Quality',
    PHYTOSANITARY: 'Phytosanitary Certificate',
    CERT_OF_PACKING: 'Certificate of Packing',
    CERT_OF_FUMIGATION: 'Certificate of Fumigation',
    QUALITY_APPEARANCE_CERT: 'Quality and Appearance Certificate',
    INSURANCE: 'Insurance Certificate',
    EXPORT_DECLARATION: 'Export Declaration',
    NON_GMO: 'Non-GMO Certificate',
    CERT_OF_WEIGHT: 'Certificate of Weight'
};

export const ALL_DOCUMENTS = [
    DOCUMENT_TYPES.BILL,
    DOCUMENT_TYPES.INVOICE,
    DOCUMENT_TYPES.CERT_OF_QUALITY,
    DOCUMENT_TYPES.QUALITY_APPEARANCE_CERT,
    DOCUMENT_TYPES.CERT_OF_WEIGHT,
    DOCUMENT_TYPES.CERT_OF_PACKING,
    DOCUMENT_TYPES.CERT_OF_FUMIGATION,
    DOCUMENT_TYPES.PHYTOSANITARY,
    DOCUMENT_TYPES.NON_GMO,
    DOCUMENT_TYPES.EXPORT_DECLARATION,
    DOCUMENT_TYPES.INSURANCE,
];

export const REQUIRED_DOCUMENTS = [
    DOCUMENT_TYPES.BILL,
    DOCUMENT_TYPES.INVOICE,
    DOCUMENT_TYPES.CERT_OF_QUALITY,
    DOCUMENT_TYPES.CERT_OF_WEIGHT,
    DOCUMENT_TYPES.CERT_OF_FUMIGATION,
    DOCUMENT_TYPES.PHYTOSANITARY,
];

export const INSPECTION_DOCUMENTS = [
    DOCUMENT_TYPES.CERT_OF_QUALITY,
    DOCUMENT_TYPES.CERT_OF_WEIGHT,
    DOCUMENT_TYPES.CERT_OF_FUMIGATION,
    DOCUMENT_TYPES.QUALITY_APPEARANCE_CERT,
    DOCUMENT_TYPES.CERT_OF_PACKING
];

export const SELLER_DOCUMENTS = [
    DOCUMENT_TYPES.BILL,
    DOCUMENT_TYPES.INVOICE,
    DOCUMENT_TYPES.PHYTOSANITARY,
    DOCUMENT_TYPES.NON_GMO,
    DOCUMENT_TYPES.EXPORT_DECLARATION,
    DOCUMENT_TYPES.INSURANCE
];

export const getDocInfo = (docName, trade) => {
    switch (docName) {
        case DOCUMENT_TYPES.BILL:
            return {
                name: 'Bill of Lading',
                text: `Full set of 3/3 originals plus 3 (three) non-negotiable copies of ‘clean on board’
                 charter party bills of lading made out to order and blanked endorsed,
                 marked ‘ freight prepaid’ as per Charter Party ${
                    trade.incoterm === 'CIF'
                        ? ', and showing ' + Countries[trade.destCountry] + '.'
                        : '.'
                    }`,
                url: 'bill',
                type: true
            };
        case DOCUMENT_TYPES.INVOICE:
            return {
                name: 'Invoice',
                text: `Seller’s original signed Invoice for the value of Product based on the Bill of
                 Lading quantity payable 3 business days after receipt.`,
                url: 'invoice',
                type: true
            };

        case DOCUMENT_TYPES.CERT_OF_QUALITY:
            return {
                name: 'Certificate of Quality',
                text: `Certificate of quality issued by contractual appointed ${trade.inspectionName}
                 certifying that the goods loaded comply fully with the specifications set
                 forth above under clause entitled “Quality”.`,
                state: DOCUMENT_TYPES.CERT_OF_QUALITY,
                type: false
            };
        case DOCUMENT_TYPES.QUALITY_APPEARANCE_CERT:
            return {
                name: 'Quality and Appearance Certificate',
                text: `Certificate issued by contractual appointed ${trade.inspectionName} certifying that the
                 quality and appearance of rice delivered is equal to or better than the
                 above mentioned ${trade.inspectionName} sealed sample.`,
                state: DOCUMENT_TYPES.QUALITY_APPEARANCE_CERT,
                type: false
            };
        case DOCUMENT_TYPES.PHYTOSANITARY:
            return {
                name: 'Phytosanitary Certificate',
                text: `Phytosanitary certificate issued by competent authority`,
                state: DOCUMENT_TYPES.PHYTOSANITARY,
                type: false
            };
        case DOCUMENT_TYPES.CERT_OF_PACKING:
            return {
                name: 'Certificate of Packing',
                text: `Certificate of packing issued by contractual appointed ${trade.inspectionName}.`,
                state: DOCUMENT_TYPES.CERT_OF_PACKING,
                type: false
            };
        case DOCUMENT_TYPES.INSURANCE:
            return {
                name: 'Insurance Certificate',
                text: 'Insurance Certificate',
                state: DOCUMENT_TYPES.INSURANCE,
                type: false
            };
        case DOCUMENT_TYPES.NON_GMO:
            return {
                name: 'Non-GMO Certificate',
                text: `Non-GMO certificate issued by shippers.`,
                state: DOCUMENT_TYPES.NON_GMO,
                type: false
            };
        case DOCUMENT_TYPES.CERT_OF_FUMIGATION:
            return {
                name: 'Certificate of Fumigation',
                text: `Certificate of fumigation of goods effected at time of shipment of the goods
                 from the origin issued by ${trade.inspectionName}. Fumigation certificate with date
                 after B/L date is acceptable.`,
                state: DOCUMENT_TYPES.CERT_OF_FUMIGATION,
                type: false
            };
        case DOCUMENT_TYPES.EXPORT_DECLARATION:
            return {
                name: 'Export Declaration',
                text: `Copy of export declaration.`,
                state: DOCUMENT_TYPES.EXPORT_DECLARATION,
                type: false
            };
        case DOCUMENT_TYPES.CERT_OF_WEIGHT:
            return {
                name: 'Certificate of Weight',
                text: `Certificate of weight issued by contractual appointed ${trade.inspectionName}.`,
                state: DOCUMENT_TYPES.CERT_OF_WEIGHT,
                type: false
            };
        case DOCUMENT_TYPES.DocInstructionsID:
            return {
                name: 'Documentary Instructions',
                text: `Documentary instructions for seller`,
                url: 'instructions',
                type: true
            };
        case DOCUMENT_TYPES.ShippingAdviceID:
            return {
                name: 'Shipping Advice',
                text: `Shipping advice for buyer`,
                url: 'advice',
                type: true
            };
        default:
            break;
    }
};

export const getDocStatus = (docName, documents) => {
    return documents[docName] ? DOC_STATUS[documents[docName].status] : DOC_STATUS.REQUIRED;
};

// TODO: refactor (split into methods)
export const getDocPermissions = (docName, status, bill, trader, tradeStatus) => {
    const isInspectionDocument = INSPECTION_DOCUMENTS.includes(docName);
    const isSellerDocument = SELLER_DOCUMENTS.includes(docName);
    let permissions = {};
    switch (status) {
        case STATUS_REQUIRED:
            if (isInspectionDocument && trader === 'inspection') {
                permissions = {canUpload: true};
            } else if (isSellerDocument && trader === 'seller') {
                if (docName === DOCUMENT_TYPES.BILL) {
                    permissions = {canFill: true};
                } else if (docName === DOCUMENT_TYPES.INVOICE) {
                    if (!bill || !bill.BillID) {
                        permissions = {canFill: false};
                    }
                } else {
                    permissions = {canUpload: true};
                }
            } else {
                permissions = {};
            }
            break;
        case STATUS_NEW:
            if (isInspectionDocument) {
                switch (trader) {
                    case 'seller':
                        permissions = {
                            canApprove: true,
                            canReject: true,
                            canDownload: true,
                            canPreview: true,
                            canRelease: true
                        };
                        break;
                    case 'buyer':
                        permissions = {canPreview: true};
                        break;
                    case 'inspection':
                        permissions = {canDownload: true};
                        break;
                    default:
                        permissions = {};
                }
            } else if (isSellerDocument) {
                switch (trader) {
                    case 'seller':
                        permissions = {
                            canDownload: true,
                            canPreview: true,
                            canApprove: true,
                            canReject: true,
                            canRelease: true
                        };
                        break;
                    case 'buyer':
                        permissions = {canPreview: docName !== DOCUMENT_TYPES.BILL};
                        break;
                    case 'inspection':
                    default:
                        permissions = {};
                }
            } else {
                permissions = {};
            }
            break;
        case STATUS_REJECTED_BY_BUYER_DURING_REVIEW:
        case STATUS_APPROVED_BY_BUYER_DURING_REVIEW:
            switch (trader) {
                case 'seller':
                    permissions = {canApprove: true, canReject: true, canDownload: true, canPreview: true};
                    break;
                case 'buyer':
                    permissions = {canPreview: true};
                    break;
                default:
                    permissions = {};
            }
            break;
        case STATUS_APPROVED_BY_SELLER:
            switch (trader) {
                case 'seller':
                    permissions = {canDownload: true, canPreview: true};
                    break;
                case 'buyer':
                    permissions = {canPreview: true, canDownload: true};
                    break;
                default:
                    permissions = {};
            }
            break;
        case STATUS_REJECTED_BY_SELLER:
            switch (trader) {
                case 'seller':
                    permissions = {canDownload: true, canPreview: true};
                    break;
                case 'buyer':
                    permissions = {canPreview: true};
                    break;
                default:
                    permissions = {};
            }
            break;
        case STATUS_RELEASED_FOR_BUYER:
            switch (trader) {
                case 'seller':
                    permissions = {canDownload: true, canPreview: true, canApprove: true, canReject: true};
                    break;
                case 'buyer':
                    permissions = {canApprove: true, canReject: true, canPreview: true};
                    break;
                default:
                    permissions = {};
            }
            break;
        case STATUS_APPROVED_BY_BUYER:
        case STATUS_REJECTED_BY_BUYER:
            switch (trader) {
                case 'seller':
                    permissions = {canApprove: true, canReject: true, canDownload: true, canPreview: true};
                    break;
                case 'buyer':
                    permissions = {canPreview: true};
                    break;
                default:
                    permissions = {};
            }
    }
    if ((isSellerDocument && trader === 'seller') || (isInspectionDocument && trader === 'inspection')) {
        permissions.canPreview = status !== STATUS_REQUIRED;
        if ([DOCUMENT_TYPES.INVOICE, DOCUMENT_TYPES.BILL].includes(docName)) {
            permissions.canFill = permissions.canFill !== undefined ? permissions.canFill : true;
        } else {
            permissions.canUpload = permissions.canUpload !== undefined ? permissions.canUpload : true;
        }
    }
    if (
        (docName !== DOCUMENT_TYPES.BILL && STEPS.indexOf(tradeStatus) !== STEPS.indexOf(TRADE_STATUS.ADVICE)) ||
        (docName === DOCUMENT_TYPES.BILL && STEPS.indexOf(tradeStatus) > STEPS.indexOf(TRADE_STATUS.ADVICE))
    ) {
        permissions.canApprove = false;
        permissions.canReject = false;
        permissions.canRelease = false;
        permissions.canFill = false;
        permissions.canUpload = false;
    }
    permissions.canComment = true;
    return permissions;
};

export const getDocNamesByFilter = (filter) => {
    switch (filter) {
        case FILTER_ALL:
        case FILTER_MY_ACTIONS:
        case FILTER_COUNTERPARTY_ACTIONS:
            return ALL_DOCUMENTS;
        case FILTER_INSPECTION_COMPANY_ACTIONS:
            return INSPECTION_DOCUMENTS;
    }
};

export const filterDocNamesByIncoterm = (docs, incoterm) => {
    if (incoterm === 'CIF') {
        return docs;
    }
    return docs.filter(doc => doc !== DOCUMENT_TYPES.INSURANCE);
};

export const getFilteredDocuments = (filter, trader, documents, trade) => {
    let filteredDocuments = [];
    const bill = documents[DOCUMENT_TYPES.BILL];
    const havePendingActions = permissions => permissions.canApprove || permissions.canReject || permissions.canRelease || permissions.canUpload || permissions.canFill;
    const docNames = filterDocNamesByIncoterm(getDocNamesByFilter(filter), trade.incoterm);
    switch (filter) {
        case FILTER_ALL:
            filteredDocuments = docNames.map(docName => {
                const status = getDocStatus(docName, documents, bill);
                return {
                    docName,
                    status,
                    permissions: status ? getDocPermissions(docName, status.status, bill, trader, trade.status) : []
                }
            });
            break;
        case FILTER_MY_ACTIONS:
            docNames.forEach(docName => {
                const status = getDocStatus(docName, documents, bill);
                const permissions = status ? getDocPermissions(docName, status.status, bill, trader, trade.status) : [];
                if (havePendingActions(permissions)) {
                    filteredDocuments.push({docName, status, permissions});
                }
            });
            break;
        case FILTER_COUNTERPARTY_ACTIONS:
            docNames.forEach(docName => {
                const status = getDocStatus(docName, documents, bill);
                // this check covers all cases because for inspection company seller is the counterparty too
                let counterParty = trader === 'seller' ? 'buyer' : 'seller';
                let permissions = status ? getDocPermissions(docName, status.status, bill, counterParty, trade.status) : [];
                if (havePendingActions(permissions)) {
                    // we should calculate permissions for current user
                    permissions = status ? getDocPermissions(docName, status.status, bill, trader, trade.status) : [];
                    filteredDocuments.push({docName, status, permissions});
                }
            });
            break;
        case FILTER_INSPECTION_COMPANY_ACTIONS:
            docNames.forEach(docName => {
                const status = getDocStatus(docName, documents, bill);
                // check if inspection company have pending actions
                let permissions = status ? getDocPermissions(docName, status.status, bill, 'inspection', trade.status) : [];
                if (havePendingActions(permissions)) {
                    if (trader !== 'inspection') {
                        // if this user is not inspection company we should calculate permissions for him
                        permissions = status ? getDocPermissions(docName, status.status, bill, trader, trade.status) : [];
                    }
                    filteredDocuments.push({docName, status, permissions});
                }
            });
    }
    filteredDocuments.map(doc => {
        doc.required = REQUIRED_DOCUMENTS.includes(doc.docName);
    });
    return filteredDocuments;
};