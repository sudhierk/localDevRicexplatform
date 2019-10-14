package testMocks

import (
	"time"

	"github.com/shopspring/decimal"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/requests"
)

func GetTradeRequestRequest(incoterm, reqType string) (tradeRequest *RequestTradeRequest) {
	return &RequestTradeRequest{
		reqType,
		nil,
		decimal.NewFromFloat(100),
		"BR",
		"VESSEL",
		10,
		constants.SHIPPING_TYPE_TONS,
		"ricetype1",
		"2016",
		"Single polished",
		incoterm,
		"AL",
		"Durres",
		"60 days",
		"lds",
		"",
		"2019-04-03T00:00:00+03:00",
		"2019-04-25T00:00:00+03:00",
		nil,
		"loadrate",
		"",
		1554594400,
		"NEW",
		"+03:00",
		"Kiev",
		"UA",
		"rate",
		"terms",
	}
}

func GetNominateVesselRequest(inspectionCompanyID *uint) (request *VesselNominationRequest) {
	return &VesselNominationRequest{
		"name1",
		"Message1",
		time.Time{},
		time.Time{},
		inspectionCompanyID,
	}
}

func GetAcceptVesselRequest(inspectionCompanyID *uint) (request *VesselNominationAcceptRequest) {
	return &VesselNominationAcceptRequest{
		inspectionCompanyID,
	}
}

func GetDocumentaryInstructionRequest() (request *TradeTextDocumentInstruction) {
	tradeTextDocument := TradeTextDocument{"text", 10}
	return &TradeTextDocumentInstruction{
		[]TradeTextDocument{tradeTextDocument},
		"Message1",
		"",
		"",
		"",
		"",
		"",
		"",
	}
}

func GetBillRequest() (request *db.ShipmentBill) {

	return &db.ShipmentBill{
		db.BaseModel{},
		"billnumber",
		"shippingComp",
		"shipper",
		"consignee",
		"vessel voyage",
		"bookingref",
		"shipperref",
		10,
		"",
		"",
		"",
		time.Time{},
		"",
		"",
		"",
		"",
		"",
		"",
		"",
		time.Time{},
	}
}

func GetInvoiceRequest(text, sig string) (request *TradeInvoiceCreateRequest) {

	return &TradeInvoiceCreateRequest{
		"billnumber",
		"shippingComp",
		100,
		"vessel name",
		text,
		sig,
	}
}
