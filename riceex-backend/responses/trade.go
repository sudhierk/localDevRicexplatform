package responses

import (
	"time"

	"github.com/shopspring/decimal"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

//swagger:model
type RequestTradeResponse struct {
	ID                uint            `json:"id"`
	Buyer             string          `json:"buyer"`
	Buyerid           *uint           `json:"buyerId"`
	Seller            string          `json:"seller"`
	Sellerid          *uint           `json:"sellerId"`
	RequestType       string          `json:"requestType"`
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
	Packaging         string          `json:"packaging"`
	Payment           string          `json:"payment"`
	PaymentPeriod     string          `json:"paymentPeriod"`
	Deliverystartdate string          `json:"deliveryStartDate"`
	Deliveryenddate   string          `json:"deliveryEndDate"`
	Inspection        *uint           `json:"inspection"`
	InspectionName    string          `json:"inspectionName"`
	Discharge         string          `json:"discharge"`
	SpecialRequest    string          `json:"specialRequest"`
	UserProfileID     uint            `json:"userProfileID"`
	CreatedAt         time.Time       `json:"createdAt"`
	Buyercountry      string          `json:"buyerCountry"`
	Buyertax          string          `json:"buyerTax"`
	Sellercountry     string          `json:"sellerCountry"`
	Sellertax         string          `json:"sellerTax"`
	RequestStatus     string          `json:"requestStatus"`
	Status            string          `json:"status"`
	Ownerid           uint            `json:"ownerId"`
	ValidateDate      time.Time       `json:"validateDate"`
	CompletionAt      time.Time       `json:"completionAt"`
	Buyeraddress1     string          `json:"buyerAddress1"`
	Selleraddress1    string          `json:"sellerAddress1"`
	TimeZone          string          `json:"timeZone"`
	PaymentComment    string          `json:"paymentComment"`
	LoadPort          string          `json:"loadPort"`
	LoadCountry       string          `json:"loadCountry"`
	Rate              string          `json:"rate"`
	Terms             string          `json:"terms"`
}

//swagger:model
type TradeRequestInfoResponse struct {
	SellerId       *uint  `json:"sellerId"`
	SellerName     string `json:"sellerName"`
	SellerUserName string `json:"sellerUserName"`
	SellerAddress1 string `json:"sellerAddress1"`
	SellerRole     string `json:"sellerRole"`

	BuyerId       *uint  `json:"buyerId"`
	BuyerName     string `json:"buyerName"`
	BuyerUserName string `json:"buyerUserName"`
	BuyerAddress1 string `json:"buyerAddress1"`
	BuyerRole     string `json:"buyerRole"`

	InspectionId   *uint  `json:"inspectionId"`
	InspectionName string `json:"inspectionName"`

	Payed       bool `json:"payed"`
	BuyerClose  bool `json:"buyerClose"`
	SellerClose bool `json:"sellerClose"`
	SignBuyer   bool `json:"signBuyer"`
	SignSeller  bool `json:"signSeller"`

	VsesselNominated bool `json:"vesselNominated"`
	VsesselApproved  bool `json:"vesselApproved"`

	PaymentComment string `json:"paymentComment"`

	LoadPort    string `json:"loadPort"`
	LoadCountry string `json:"loadCountry"`

	Rate  string `json:"rate"`
	Terms string `json:"terms"`
}

func GetTradeResponse(tr *db.TradeRequest) RequestTradeResponse {
	var sellerName = ""
	var sellerCountry = ""
	var sellerAddsress1 = ""
	var sellerTax = ""
	var buyerName = ""
	var buyerCountry = ""
	var buyerAddress1 = ""
	var buyerTax = ""
	var inspName = ""
	if tr.Seller != nil {
		sellerName = tr.Seller.Name
		sellerCountry = tr.Seller.Country
		sellerAddsress1 = tr.Seller.Address1
		sellerTax = tr.Seller.Tax
	}
	if tr.Buyer != nil {
		buyerName = tr.Buyer.Name
		buyerCountry = tr.Buyer.Country
		buyerAddress1 = tr.Buyer.Address1
		buyerTax = tr.Buyer.Tax
	}

	if tr.TradeItem.Inspection != nil {
		inspName = tr.TradeItem.Inspection.Name
	}

	res := RequestTradeResponse{
		ID:                tr.ID,
		RequestType:       tr.TradeItem.RequestType,
		Price:             tr.TradeItem.Price,
		Origin:            tr.TradeItem.Origin,
		Shipping:          tr.TradeItem.Shipping,
		Measure:           tr.TradeItem.Quantity,
		Measurement:       tr.TradeItem.Measurement,
		RiceType:          tr.TradeItem.RiceType,
		CropYear:          tr.TradeItem.CropYear,
		Quality:           tr.TradeItem.Quality,
		Incoterm:          tr.TradeItem.Incoterm,
		DestCountry:       tr.TradeItem.DestCountry,
		DestPort:          tr.TradeItem.DestPort,
		Packaging:         tr.TradeItem.Packaging,
		Payment:           tr.TradeItem.Payment,
		PaymentPeriod:     tr.TradeItem.PaymentPeriod,
		Deliverystartdate: tr.TradeItem.DeliveryStartDate,
		Deliveryenddate:   tr.TradeItem.DeliveryEndDate,
		InspectionName:    inspName,
		Inspection:        tr.TradeItem.InspectionID,
		Discharge:         tr.TradeItem.Discharge,
		SpecialRequest:    tr.TradeItem.SpecialRequest,
		UserProfileID:     tr.OwnerID,
		CreatedAt:         tr.CreatedAt,
		Buyercountry:      buyerCountry,
		Buyer:             buyerName,
		Buyerid:           tr.BuyerID,
		Seller:            sellerName,
		Sellerid:          tr.SellerID,
		Buyertax:          buyerTax,
		Sellercountry:     sellerCountry,
		Sellertax:         sellerTax,
		RequestStatus:     tr.Status,
		Status:            tr.Status,
		Ownerid:           tr.OwnerID,
		ValidateDate:      tr.TradeItem.ValidateDate,
		CompletionAt:      tr.CompletionAt,
		Buyeraddress1:     buyerAddress1,
		Selleraddress1:    sellerAddsress1,
		TimeZone:          tr.TradeItem.TimeZone,
		PaymentComment:    tr.TradeItem.PaymentComment,
		LoadPort:          tr.TradeItem.LoadPort,
		LoadCountry:       tr.TradeItem.LoadCountry,
		Rate:              tr.TradeItem.Rate,
		Terms:             tr.TradeItem.Terms,
	}
	return res
}

func GetTradeInfoResponse(tr *db.TradeRequest, seller *db.User, buyer *db.User) TradeRequestInfoResponse {
	var sellerName = ""
	var sellerUserName = ""
	var sellerAddsress1 = ""
	var sellerRole = ""

	var buyerName = ""
	var buyerUserName = ""
	var buyerAddress1 = ""
	var buyerRole = ""

	if tr.Seller != nil {
		sellerName = tr.Seller.Name
		sellerUserName = seller.UserProfile.FullName()
		sellerAddsress1 = tr.Seller.Address1
		sellerRole = tr.Seller.CompanyType
	}
	if tr.Buyer != nil {
		buyerName = tr.Buyer.Name
		buyerUserName = buyer.UserProfile.FullName()
		buyerAddress1 = tr.Buyer.Address1
		buyerRole = tr.Buyer.CompanyType
	}

	res := TradeRequestInfoResponse{
		SellerId:         tr.SellerID,
		SellerName:       sellerName,
		SellerUserName:   sellerUserName,
		SellerAddress1:   sellerAddsress1,
		SellerRole:       sellerRole,
		BuyerId:          tr.BuyerID,
		BuyerName:        buyerName,
		BuyerUserName:    buyerUserName,
		BuyerAddress1:    buyerAddress1,
		BuyerRole:        buyerRole,
		Payed:            tr.Payed,
		BuyerClose:       tr.BuyerClose,
		SellerClose:      tr.SellerClose,
		SignBuyer:        tr.SignBuyer,
		SignSeller:       tr.SignSeller,
		VsesselNominated: tr.VesselNomination.Nominated,
		VsesselApproved:  tr.VesselNomination.Accepted,
		PaymentComment:   tr.TradeItem.PaymentComment,
		Rate:             tr.TradeItem.Rate,
		Terms:            tr.TradeItem.Terms,
	}
	return res
}
