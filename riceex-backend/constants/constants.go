package constants

const (
	ENV_TEST    = "test"
	ENV_DEV     = "dev"
	ENV_STAGE   = "stage"
	ENV_SANDBOX = "sandbox"

	USER_TYPE_PLATFORM_ADMIN   = "PLATFORM_ADMIN"
	USER_TYPE_COMPANY_ADMIN    = "COMPANY_ADMIN"
	USER_TYPE_COMPANY_EMPLOYEE = "COMPANY_EMPLOYEE"

	USER_STATUS_WAITING_FOR_EMAIL_VERIFICATION = "WAITING_FOR_EMAIL_VERIFICATION"
	USER_STATUS_ACTIVE                         = "ACTIVE"
	USER_STATUS_COMPANY_BLOCKED                = "COMPANY_IS_BLOCKED"

	TRADE_STATUS_NEW              = "NEW"
	TRADE_STATUS_DECLINED         = "DECLINED"
	TRADE_STATUS_CANCELED         = "CANCELED"
	TRADE_STATUS_DEAL             = "DEAL"
	TRADE_STATUS_SIGNED           = "SIGNED"
	TRADE_STATUS_VESSEL_NOMINATED = "VESSEL_NOMINATED"
	TRADE_STATUS_INSTRUCTIONS     = "INSTRUCTIONS"
	TRADE_STATUS_ADVICE           = "ADVICE"
	TRADE_STATUS_DOCUMENTS        = "DOCUMENTS"
	TRADE_STATUS_PAYMENT          = "PAYMENT"
	TRADE_STATUS_PAYED            = "PAYED"
	TRADE_STATUS_CLOSED           = "CLOSED"

	TRADE_ITEM_REQUEST_TYPE_BUY  = "BUY"
	TRADE_ITEM_REQUEST_TYPE_SELL = "SELL"

	TRADE_ITEM_INCOTERM_FOB = "FOB"
	TRADE_ITEM_INCOTERM_CIF = "CIF"

	SHIPPING_TYPE_VESSEL    = "VESSEL"
	SHIPPING_TYPE_CONTAINER = "CONTAINER"

	SHIPPING_TYPE_TONS = "TONS"
	SHIPPING_TYPE_CWT  = "CWT"

	FILE_INSPECTION_REPORT_TEMPLATE = "INSPECTION_REPORT_TEMPLATE"
	FILE_DOCUMENT                   = "DOCUMENT"

	DOCUMENT_CERT_OF_QUALITY         = "CERT_OF_QUALITY"
	DOCUMENT_CERT_OF_WEIGHT          = "CERT_OF_WEIGHT"
	DOCUMENT_CERT_OF_FUMIGATION      = "CERT_OF_FUMIGATION"
	DOCUMENT_QUALITY_APPEARANCE_CERT = "QUALITY_APPEARANCE_CERT"
	DOCUMENT_CERT_OF_PACKING         = "CERT_OF_PACKING"
	DOCUMENT_PHYTOSANITARY           = "PHYTOSANITARY"
	DOCUMENT_NON_GMO                 = "NON_GMO"
	DOCUMENT_EXPORT_DECLARATION      = "EXPORT_DECLARATION"
	DOCUMENT_INSURANCE               = "INSURANCE"

	DOCUMENT_INVOICE = "INVOICE"
	DOCUMENT_BILL    = "BILL"

	COMPANY_EXPORTER       = "EXPORTER"
	COMPANY_IMPORTER       = "IMPORTER"
	COMPANY_DISTRIBUTOR    = "DISTRIBUTOR"
	COMPANY_TRADER         = "TRADER"
	COMPANY_BANK           = "BANK"
	COMPANY_INSURANCE      = "INSURANCE"
	COMPANY_INSPECTION     = "INSPECTION"
	COMPANY_FUMIGATION     = "FUMIGATION"
	COMPANY_STEVEDORING    = "STEVEDORING"
	COMPANY_SHIPPING       = "SHIPPING"
	COMPANY_CUSTOMS_BROKER = "CUSTOMS_BROKER"

	DOCUMENT_STATUS_NEW                             = "NEW"
	DOCUMENT_STATUS_APPROVED_BY_BUYER_DURING_REVIEW = "APPROVED_BY_BUYER_DURING_REVIEW"
	DOCUMENT_STATUS_REJECTED_BY_BUYER_DURING_REVIEW = "REJECTED_BY_BUYER_DURING_REVIEW"
	DOCUMENT_STATUS_APPROVED_BY_SELLER              = "APPROVED_BY_SELLER"
	DOCUMENT_STATUS_REJECTED_BY_SELLER              = "REJECTED_BY_SELLER"
	DOCUMENT_STATUS_RELEASED_FOR_BUYER              = "RELEASED_FOR_BUYER"
	DOCUMENT_STATUS_APPROVED_BY_BUYER               = "APPROVED_BY_BUYER"
	DOCUMENT_STATUS_REJECTED_BY_BUYER               = "REJECTED_BY_BUYER"

	BID_STATUS_NEW       = "NEW"
	BID_STATUS_DECLINED  = "DECLINED"
	BID_STATUS_ACCEPTED  = "ACCEPTED"
	BID_STATUS_COUNTERED = "COUNTERED"

	KYC_STATUS_NEW       = "NEW"
	KYС_STATUS_EDITING   = "EDITING"
	KYC_STATUS_SUBMITTED = "SUBMITTED"
	KYC_STATUS_APPROVED  = "APPROVED"
	KYC_STATUS_DECLINED  = "DECLINED"
)

var DOC_TYPES = map[string]bool{
	DOCUMENT_CERT_OF_QUALITY:         true,
	DOCUMENT_CERT_OF_WEIGHT:          true,
	DOCUMENT_CERT_OF_FUMIGATION:      true,
	DOCUMENT_QUALITY_APPEARANCE_CERT: true,
	DOCUMENT_CERT_OF_PACKING:         true,
	DOCUMENT_PHYTOSANITARY:           true,
	DOCUMENT_NON_GMO:                 true,
	DOCUMENT_EXPORT_DECLARATION:      true,
	DOCUMENT_INSURANCE:               true}

var TRADE_STATUSES = map[string]uint{
	TRADE_STATUS_NEW:              0,
	TRADE_STATUS_DECLINED:         1,
	TRADE_STATUS_CANCELED:         2,
	TRADE_STATUS_DEAL:             3,
	TRADE_STATUS_SIGNED:           4,
	TRADE_STATUS_VESSEL_NOMINATED: 5,
	TRADE_STATUS_INSTRUCTIONS:     6,
	TRADE_STATUS_ADVICE:           7,
	TRADE_STATUS_DOCUMENTS:        8,
	TRADE_STATUS_PAYMENT:          9,
	TRADE_STATUS_PAYED:            10,
	TRADE_STATUS_CLOSED:           11,
}