package requests

import (
	"time"

	"github.com/shopspring/decimal"
)

//swagger:model
type RequestTradeRequest struct {
	RequestType       string          `json:"requestType"`
	CounterParties    []uint          `json:"counterParty"`
	Price             decimal.Decimal `json:"price"`
	Origin            string          `json:"origin"`
	Shipping          string          `json:"shipping"`
	Measure           uint            `json:"measure"`
	Measurement       string          `json:"measurement"`
	RiceType          string          `json:"riceType"`
	CropYear          string          `json:"cropYear"`
	Quality           string          `json:"quality"`
	Incoterm          string          `json:"incoterm"`
	DestCountry       string          `json:"destCountry"`
	DestPort          string          `json:"destPort"`
	PaymentPeriod     string          `json:"paymentPeriod"`
	Packaging         string          `json:"packaging"`
	Payment           string          `json:"payment"`
	DeliveryStartDate string          `json:"deliveryStartDate"`
	DeliveryEndDate   string          `json:"deliveryEndDate"`
	Inspection        *uint           `json:"inspection"`
	Discharge         string          `json:"discharge"`
	SpecialRequest    string          `json:"specialRequest"`
	ValidateDate      int64           `json:"validateDate"`
	Status            string          `json:"status"`
	TimeZone          string          `json:"timezone"`
	LoadPort          string          `json:"loadPort"`
	LoadCountry       string          `json:"loadCountry"`
	Rate              string          `json:"rate"`
	Terms             string          `json:"terms"`
}

type TradeBillRequest struct {
	BillNumber            string `json:"billNumber"`
	ShippingComp          string `json:"shippingComp"`
	Shipper               string `json:"shipper"`
	Consignee             string `json:"consignee"`
	VessVoyage            string `json:"vessVoyage"`
	BookingRef            string `json:"bookingRef"`
	ShipperRef            string `json:"shipperRef"`
	QuantCleanOnBoard     uint   `json:"quantCleanOnBoard"`
	FreightsCharges       string `json:"freightsCharges"`
	DeclaredValue         string `json:"declaredValue"`
	PlaceIssue            string `json:"placeIssue"`
	DateIssue             string `json:"dateIssue"`
	CarriersAgentsEndorsm string `json:"carriersAgentsEndorsm"`
	NotifyParties         string `json:"notifyParties"`
	PortOfLoad            string `json:"portOfLoad"`
	PortOfDischarge       string `json:"portOfDischarge"`
	PackGoodsDescript     string `json:"packGoodsDescript"`
	Marking               string `json:"marking"`
	CarrierReceipt        string `json:"carrierReceipt"`
	ShippedOnBoard        string `json:"shippedOnBoard"`
}
//swagger:model
type TradeInvoiceCreateRequest struct {
	InvoiceNo      string `json:"invoiceNo"`
	BankRequisites string `json:"bankRequisites"`
	TotalAmount    uint   `json:"totalAmount"`
	VesselName     string `json:"vesselName"`
	Text           string `json:"text"`
	Signature      string `json:"signature"`
}

//swagger:model
type TradeInvoiceUpdateRequest struct {
	ID             uint   `json:"ID"`
	InvoiceNo      string `json:"invoiceNo"`
	BankRequisites string `json:"bankRequisites"`
	TotalAmount    uint   `json:"totalAmount"`
	VesselName     string `json:"vesselName"`
	Text           string `json:"text"`
	Signature      string `json:"signature"`
}

//swagger:model
type VesselNominationRequest struct {
	Name                string    `json:"name"`
	Message             string    `json:"message"`
	LaycanDateFrom      time.Time `json:"laycanDateFrom"`
	LaycanDateTo        time.Time `json:"laycanDateTo"`
	InspectionCompanyID *uint     `json:"inspectionCompanyId"`
}

//swagger:model
type VesselNominationAcceptRequest struct {
	InspectionCompanyID *uint `json:"inspectionCompanyId"`
}

//swagger:model
type CounterRequest struct {
	Price decimal.Decimal `json:"price"`
}

//swagger:model
type CreateComment struct {
	Text     string
	ParentID *uint `json:"parentId"`
}

//swagger:model
type TradeTextDocument struct {
	Text   string `json:"text"`
	Amount uint   `json:"amount"`
}

//swagger:model
type TradeTextDocumentInstruction struct {
	Instructions          []TradeTextDocument `json:"instructions"`
	BillOfLadingNotify    string              `json:"billOfLadingNotify" gorm:"type:text;"`
	BillOfLadingConsignee string              `json:"billOfLadingConsignee" gorm:"type:text;"`
	CertOfOriginNotify    string              `json:"certOfOriginNotify" gorm:"type:text;"`
	CertOfOriginConsignee string              `json:"certOfOriginConsignee" gorm:"type:text;"`
	PackingAndMarkings    string              `json:"packingAndMarkings" gorm:"type:text;"`
	DestCountry           string              `json:"destCountry" gorm:"type:text;"`
	DestPort              string         `json:"destPort" gorm:"type:text;"`
}

//swagger:model
type TradeSignRequest struct {
	Sign string `json:"signature"`
	Text string `json:"text"`
}

//swagger:model
type SmartTradeTextDocument struct {
	Text string `json:"text"`
}