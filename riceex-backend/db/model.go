package db

import (
	"encoding/json"
	"time"

	"github.com/shopspring/decimal"
)

type BaseModel struct {
	ID        uint `gorm:"primary_key"`
	CreatedAt time.Time
	UpdatedAt time.Time  `json:"-"`
	DeletedAt *time.Time `json:"-" sql:"index"`
}

//swagger:model
type User struct {
	BaseModel
	Email              string `gorm:"type:varchar(255);unique_index;not null;"`
	PasswordHash       string `gorm:"type:varchar(255);"`
	PasswordSalt       string `gorm:"type:varchar(255);"`
	Code               string `gorm:"type:varchar(255);"`
	Status             string `gorm:"type:varchar(255);"`
	CompanyID          uint
	Company            Company `gorm:"foreignkey:CompanyID;"`
	UserProfileID      uint
	UserProfile        UserProfile `gorm:"foreignkey:UserProfileID;"`
	PublicKey          string      `gorm:"type:text;"`
	IsAdmin            bool
	UserType           string `json:"userType" gorm:"type:varchar(255);default:'COMPANY_EMPLOYEE'"`
	PermissionID       uint
	Permission         Permission `gorm:"foreignkey:PermissionID;"`
	LastLoginUserAgent string     `json:"-" gorm:"type:varchar(255);"`
}

//swagger:model
type Permission struct {
	BaseModel
	SignContract            uint `json:"signContract" `
	InviteRequest           uint `json:"inviteRequest" `
	AcceptRequest           uint `json:"acceptRequest" `
	DeclineRequest          uint `json:"declineRequest" `
	InviteCounterOffer      uint `json:"inviteCounterOffer" `
	AddComment              uint `json:"addComment" `
	NominateVessel          uint `json:"nominateVessel" `
	DocumentaryInstructions uint `json:"documenaryInstructions" `
	PaymentConfirmation     uint `json:"paymentConfirmation" `
	ShippingAdvice          uint `json:"shippingAdvice" `
	ClosingTrade            uint `json:"closingTrade"`
}

type Invite struct {
	BaseModel
	Email          string `json:"email" gorm:"type:varchar(255);"`
	CompanyID      uint   `json:"companyID"`
	CompanyAdminID uint   `json:"companyAdminID"`
	Accepted       bool   `json:"accepted"`
	UserType       string `json:"userType" gorm:"type:varchar(255);"`
	Code           string `json:"-" gorm:"type:varchar(255);"`
}

//swagger:model
type UserProfile struct {
	BaseModel
	FirstName   string `json:"first_name" gorm:"type:varchar(255);"`
	LastName    string `json:"last_name" gorm:"type:varchar(255);"`
	Phone       string `json:"phone" gorm:"type:varchar(255);"`
	CompanyRole string `json:"company_role" gorm:"type:varchar(255);"`
}

func (up *UserProfile) FullName() string {
	return up.FirstName + " " + up.LastName
}

//swagger: model
type Company struct {
	BaseModel
	Name        string `json:"name" gorm:"type:varchar(255);"`
	Site        string `json:"site" gorm:"type:varchar(255);"`
	CompanyType string `json:"companyType" gorm:"type:varchar(255);"`
	Country     string `json:"country" gorm:"type:varchar(255);"`
	City        string `json:"city" gorm:"type:varchar(255);"`
	Tax         string `json:"tax" gorm:"type:varchar(255);"`
	Phone       string `json:"phone" gorm:"type:varchar(255);"`
	Address1    string `json:"address1" gorm:"type:varchar(255);"`
	Address2    string `json:"address2" gorm:"type:varchar(255);"`
	Contact     string `json:"contact" gorm:"type:varchar(255);"`
	Identity    string `json:"identity" gorm:"type:varchar(255);"`
	Card        []byte `json:"-"`

	CEO               string  `json:"ceo" gorm:"type:varchar(255);"`
	CFO               *string `json:"cfo" gorm:"type:varchar(255);"`
	MarketingManager  *string `json:"marketingManager" gorm:"type:varchar(255);"`
	OperationsManager *string `json:"operationsManager" gorm:"type:varchar(255);"`

	Email                          string       `json:"email" gorm:"type:varchar(255);"`
	CertificateOfIncorporationName string       `gorm:"-" json:"certificateOfIncorporationName"`
	CertificateOfIncorporationID   uint         `json:"-" `
	CertificateOfIncorporation     *KYCDocument `gorm:"foreignkey:CertificateOfIncorporationID;" json:"-"`
	CertificateOfIncorporationData string       `gorm:"-"  json:"certificateOfIncorporationData"`
	CertificateOfIncorporationMime string       `gorm:"-"  json:"certificateOfIncorporationMime"`

	BusinessNature       *string `json:"businessNature" gorm:"type:varchar(255);"`
	IsMemberOf           *string `json:"isMemberOf"`
	DoHaveCertifications *string `json:"doHaveCertifications"`

	AuthorizedOfficers     *json.RawMessage `sql:"json" json:"authorizedOfficers"`
	CompanyTradeReferences *json.RawMessage `sql:"json" json:"companyTradeReferences"`
	CompanyUBOS            *json.RawMessage `sql:"json" json:"companyUBOS"`
	CompanyShareholders    *json.RawMessage `sql:"json" json:"companyShareholders"`

	Blocked bool `json:"blocked"`
}

type TradeRequest struct {
	BaseModel
	BuyerID            *uint     `json:"-"`
	Buyer              *Company  `gorm:"foreignkey:BuyerID;"`
	SellerID           *uint     `json:"-"`
	Seller             *Company  `gorm:"foreignkey:SellerID;"`
	TradeItemID        uint      `json:"-"`
	TradeItem          TradeItem `gorm:"foreignkey:TradeItemID;"`
	OwnerID            uint
	Status             string
	CompletionAt       time.Time
	SignBuyer          bool
	SignSeller         bool
	VesselNominationID uint             `json:"-"`
	VesselNomination   VesselNomination `gorm:"foreignkey:VesselNominationID;"`
	Payed              bool
	PaymentViewed      bool
	BuyerClose         bool
	SellerClose        bool
}

// swagger:model
type Bid struct {
	BaseModel
	TradeRequestID uint            `json:"-"`
	Status         string          `json:"status"`
	FromCompanyID  uint            `json:"fromCompanyID"`
	ToCompanyID    uint            `json:"toCompanyID"`
	Price          decimal.Decimal `json:"price" gorm:"type:decimal(10,2);"`
	PreviousBidID  *uint           `json:"previousBidID"`
}

type TradeItem struct {
	BaseModel
	RequestType       string          `json:"requestType"`
	Price             decimal.Decimal `json:"price" gorm:"type:decimal(10,2);"`
	Currency          string          `json:"currency" gorm:"type:varchar(255);"`
	Origin            string          `json:"origin" gorm:"type:varchar(255);"`
	Shipping          string          `json:"shipping"`
	Quantity          uint            `json:"measure"`
	Measurement       string          `json:"measurement"`
	RiceType          string          `json:"riceType" gorm:"type:varchar(255);"`
	CropYear          string          `json:"cropYear" gorm:"type:varchar(255);"`
	Quality           string          `json:"quality" gorm:"type:varchar(255);"`
	Incoterm          string          `json:"incoterm" gorm:"type:varchar(255);"`
	DestCountry       string          `json:"destCountry" gorm:"type:varchar(255);"`
	DestPort          string          `json:"destPort" gorm:"type:varchar(255);"`
	LoadPort          string          `json:"loadPort" gorm:"type:varchar(255);"`
	LoadCountry       string          `json:"loadCountry" gorm:"type:varchar(255);"`
	Packaging         string          `json:"packaging" gorm:"type:varchar(255);"`
	Payment           string          `json:"payment" gorm:"type:varchar(255);"`
	PaymentPeriod     string          `json:"deliveryPayment" gorm:"type:varchar(255);"`
	DeliveryStartDate string          `json:"deliveryStartDate" gorm:"type:varchar(255);"`
	DeliveryEndDate   string          `json:"deliveryEndDate" gorm:"type:varchar(255);"`
	InspectionID      *uint           `json:"inspection"`
	Inspection        *Company        `json:"-" gorm:"foreignkey:InspectionID;"`
	Discharge         string          `json:"discharge" gorm:"type:varchar(255);"`
	SpecialRequest    string          `json:"specialRequest" gorm:"type:varchar(255);"`
	ValidateDate      time.Time       `json:"-"`
	TimeZone          string          `json:"timezone" gorm:"type:varchar(255);"`
	InvoiceID         *uint           `json:"-"`
	Invoice           *TradeInvoice   `gorm:"foreignkey:InvoiceID;"`
	Shipments         []Shipment      `gorm:"foreignkey:TradeItemID;PRELOAD:true"`
	ShippingAdvice    string          `json:"docInst"`
	Rate              string          `json:"rate"`
	Terms             string          `json:"terms"`
	PaymentComment    string
}

//swagger:model
type VesselNomination struct {
	BaseModel
	Nominated           bool      `json:"vesselNominated"`
	Accepted            bool      `json:"vesselAccepted"`
	Name                string    `json:"name" gorm:"type:text;"`
	Message             string    `json:"message" gorm:"type:text;"`
	LaycanDateFrom      time.Time `json:"laycanDateFrom"`
	LaycanDateTo        time.Time `json:"laycanDateTo"`
	InspectionCompanyID *uint     `json:"inspectionCompanyId"`
}

//swagger:model
type DocumentaryInstructions struct {
	BaseModel
	BillOfLadingNotify    string    `json:"billOfLadingNotify" gorm:"type:text;"`
	BillOfLadingConsignee string    `json:"billOfLadingConsignee" gorm:"type:text;"`
	CertOfOriginNotify    string    `json:"certOfOriginNotify" gorm:"type:text;"`
	CertOfOriginConsignee string    `json:"certOfOriginConsignee" gorm:"type:text;"`
	PackingAndMarkings    string    `json:"packingAndMarkings" gorm:"type:text;"`
	TradeItemID           uint      `json:"-"`
	TradeItem             TradeItem `json:"-" gorm:"foreignkey:TradeItemID;PRELOAD:false"`
}

//swagger:model
type Shipment struct {
	BaseModel
	TradeItemID uint          `json:"-"`
	TradeItem   TradeItem     `json:"-" gorm:"foreignkey:TradeItemID;PRELOAD:false"`
	Quantity    uint          `json:"amount"`
	BillID      *uint         `json:"-"`
	Bill        *ShipmentBill `gorm:"foreignkey:BillID;PRELOAD:true"`
}

//swagger:model
type ShipmentDocument struct {
	BaseModel
	Type            string         `json:"type"`
	Status          string         `json:"status"`
	Files           []FileDocument `gorm:"foreignkey:DocumentID;PRELOAD:true"`
	BillID          *uint
	InvoiceID       *uint
	ShipmentID      uint     `json:"-"`
	Shipment        Shipment `json:"-" gorm:"foreignkey:ShipmentID"`
	ApprovedByBuyer bool     `json:"approvedByBuyer"`
	RejectedByBuyer bool     `json:"rejectedByBuyer"`
}

type DocumentComment struct {
	BaseModel
	ParentID    *uint  `json:"parentId"`
	DocumentID  uint   `json:"documentId"`
	User        User   `json:"User" gorm:"foreignkey:UserID"`
	Receiver    uint   `json:"receiver"`
	UserID      uint   `json:"authorId"`
	AutoComment bool   `json:"autoComment"`
	Text        string `json:"text" gorm:"type:text;"`
}

//swagger:model
type ShipmentBill struct {
	BaseModel
	BillNumber            string    `json:"billNumber" gorm:"type:varchar(255);"`
	ShippingComp          string    `json:"shippingComp" gorm:"type:varchar(255);"`
	Shipper               string    `json:"shipper" gorm:"type:varchar(255);"`
	Consignee             string    `json:"consignee" gorm:"type:varchar(255);"`
	VessVoyage            string    `json:"vessVoyage" gorm:"type:varchar(255);"`
	BookingRef            string    `json:"bookingRef" gorm:"type:varchar(255);"`
	ShipperRef            string    `json:"shipperRef" gorm:"type:varchar(255);"`
	QuantCleanOnBoard     uint      `json:"quantCleanOnBoard"`
	FreightsCharges       string    `json:"freightsCharges" gorm:"type:text;"`
	DeclaredValue         string    `json:"declaredValue" gorm:"type:varchar(255);"`
	PlaceIssue            string    `json:"placeIssue" gorm:"type:varchar(255);"`
	DateIssue             time.Time `json:"dateIssue"`
	CarriersAgentsEndorsm string    `json:"carriersAgentsEndorsm" gorm:"type:varchar(255);"`
	NotifyParties         string    `json:"notifyParties" gorm:"type:varchar(255);"`
	PortOfLoad            string    `json:"portOfLoad" gorm:"type:varchar(255);"`
	PortOfDischarge       string    `json:"portOfDischarge" gorm:"type:varchar(255);"`
	PackGoodsDescript     string    `json:"packGoodsDescript" gorm:"type:varchar(255);"`
	Marking               string    `json:"marking" gorm:"type:varchar(255);"`
	CarrierReceipt        string    `json:"carrierReceipt" gorm:"type:varchar(255);"`
	ShippedOnBoard        time.Time `json:"shippedOnBoard"`
}

//swagger:model
type TradeInvoice struct {
	BaseModel
	InvoiceNo      string `json:"invoiceNo" gorm:"type:varchar(255);"`
	BankRequisites string `json:"bankRequisites" gorm:"type:varchar(255);"`
	TotalAmount    uint   `json:"totalAmount"`
	VesselName     string `json:"vesselName"`
}

type Comment struct {
	BaseModel
	ParentID  *uint  `json:"parentId"`
	RequestID uint   `json:"requestId"`
	User      User   `json:"User" gorm:"foreignkey:UserID;PRELOAD:true"`
	UserID    uint   `json:"authorId"`
	Text      string `json:"text" gorm:"type:text;"`
}

//swagger:model
type InspectionReport struct {
	BaseModel
	FileID      uint                 `json:"fileId"`
	File        FileInspectionReport `json:"file" gorm:"foreignkey:FileID;"`
	TradeItemID uint                 `json:"-"`
}

type FileTemplate struct {
	BaseModel
	Name   string `json:"name"`
	Type   string `json:"type"`
	Source string `json:"-"`
	Owner  uint   `json:"-"`
}

type FileInspectionReport struct {
	BaseModel
	Name   string `json:"name"`
	Source string `json:"-"`
	Owner  uint   `json:"-"`
}

type FileDocument struct {
	BaseModel
	Name       string `json:"name"`
	Source     string `json:"-"`
	Owner      uint   `json:"-"`
	DocumentID uint
	Hash       string `json:"hash" gorm:"type:varchar(255);"`
}

type KYCDocument struct {
	BaseModel
	Name   string
	Source string
	Mime   string
}

//swagger:model
type City struct {
	BaseModel
	ISO     string `json:"iso" gorm:"type:varchar(255);"`
	Country string `json:"country" gorm:"type:varchar(255);"`
	City    string `json:"city" gorm:"type:varchar(255);"`
}

//swagger:model
type Notification struct {
	BaseModel
	ReceiverID uint   `json:"receiverID"`
	Initiator  string `json:"initiator" gorm:"type:varchar(255);"`
	Type       string `json:"type" gorm:"type:varchar(255);"`
	Data       string `json:"data" gorm:"type:text;"`
	Read       bool   `json:"read"`
}

//swagger:model
type CompanyKYC struct {
	BaseModel
	Name        string `json:"name" gorm:"type:varchar(255);"`
	Site        string `json:"site" gorm:"type:varchar(255);"`
	CompanyType string `json:"companyType" gorm:"type:varchar(255);"`
	Tax         string `json:"tax" gorm:"type:varchar(255);"`
	Phone       string `json:"phone" gorm:"type:varchar(255);"`
	Address1    string `json:"address1" gorm:"type:varchar(255);"`
	Address2    string `json:"address2" gorm:"type:varchar(255);"`
	Contact     string `json:"contact" gorm:"type:varchar(255);"`

	CEO               string  `json:"ceo" gorm:"type:varchar(255);"`
	CFO               *string `json:"cfo" gorm:"type:varchar(255);"`
	MarketingManager  *string `json:"marketingManager" gorm:"type:varchar(255);"`
	OperationsManager *string `json:"operationsManager" gorm:"type:varchar(255);"`

	Email                          string       `json:"email" gorm:"type:varchar(255);"`
	CertificateOfIncorporationName string       `gorm:"-" json:"certificateOfIncorporationName"`
	CertificateOfIncorporationID   uint         `json:"-" `
	CertificateOfIncorporation     *KYCDocument `gorm:"foreignkey:CertificateOfIncorporationID;" json:"-"`
	CertificateOfIncorporationData string       `gorm:"-"  json:"certificateOfIncorporationData"`
	CertificateOfIncorporationMime string       `gorm:"-"  json:"certificateOfIncorporationMime"`

	BusinessNature       *string `json:"businessNature" gorm:"type:varchar(255);"`
	IsMemberOf           *string `json:"isMemberOf"`
	DoHaveCertifications *string `json:"doHaveCertifications"`

	AuthorizedOfficers     *json.RawMessage `sql:"json" json:"authorizedOfficers"`
	CompanyTradeReferences *json.RawMessage `sql:"json" json:"companyTradeReferences"`
	CompanyUBOS            *json.RawMessage `sql:"json" json:"companyUBOS"`
	CompanyShareholders    *json.RawMessage `sql:"json" json:"companyShareholders"`

	CompanyID uint    `json:"-"`
	Company   Company `gorm:"foreignkey:CompanyID;"`

	Date   time.Time
	Status string `gorm:"type:varchar(255);default:'NEW'"`

	VisitedByPlatformAdmin bool `gorm:"type:boolean" json:"visitedByPlatformAdmin"`
	UserWhoCreatedID       uint `gorm:"type:varchar(255);" json:"userWhoCreatedID"`
}

type CompanyUBOs struct {
	Name         string `json:"name"`
	PassportName string `json:"passportName"`
	PassportID   uint   `json:"passportId"`
	PassportMime string `json:"passportMime"`
}
