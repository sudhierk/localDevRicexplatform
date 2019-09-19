package db

import (
	"errors"

	"strings"
	"time"

	"github.com/jinzhu/gorm"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	. "gitlab.com/riceexchangeplatform/riceex-backend/requests"
)

type tradeModel struct {
	db *gorm.DB
}

func TradeModel(tx *gorm.DB) *tradeModel {
	if tx == nil {
		tx = Connection
	}
	return &tradeModel{db: tx}
}

func (m *tradeModel) Find(user User, skip, take, requestType, page, status, sortBy, sortOrder interface{}) (tradeRequests []TradeRequest, count uint, err error) {

	_ = status

	dbObj := Connection.Model(&TradeRequest{}).
		Set("gorm:auto_preload", true).
		Offset(skip).Limit(take).
		Joins("left join trade_items on trade_items.id = trade_requests.trade_item_id").
		Joins("left join companies as buyers on buyers.id = trade_requests.buyer_id").
		Joins("left join companies as sellers on sellers.id = trade_requests.seller_id")

	if page == "exchange" {
		dbObj = dbObj.Where("trade_items.validate_date > NOW()").Where("seller_id IS NULL OR buyer_id IS NULL").Where("status = ?", TRADE_STATUS_NEW)
	} else if page == "trade" {
		requestNotStatusArray := []string{TRADE_STATUS_NEW, TRADE_STATUS_DECLINED, TRADE_STATUS_CANCELED}
		dbObj = dbObj.Where("seller_id = ? OR buyer_id = ?", user.CompanyID, user.CompanyID).Where("status not in (?)", requestNotStatusArray)
	} else {
		requestStatusArray := []string{TRADE_STATUS_NEW, TRADE_STATUS_DECLINED, TRADE_STATUS_CANCELED, TRADE_STATUS_DEAL}
		dbObj = dbObj.Where("seller_id = ? OR buyer_id = ?", user.CompanyID, user.CompanyID).Where("status in (?)", requestStatusArray)
	}

	if requestType == "all" || requestType == "" {
	} else if requestType == "outbound" {
		dbObj = dbObj.Where("owner_id = ?", user.CompanyID)
	} else if requestType == "inbound" {
		dbObj = dbObj.Not("owner_id = ?", user.CompanyID)
	} else if requestType == "sell" {
		requestTypeArray := []string{TRADE_ITEM_REQUEST_TYPE_SELL}
		dbObj = dbObj.Where("trade_items.request_type in (?)", requestTypeArray)
	} else if requestType == "buy" {
		requestTypeArray := []string{TRADE_ITEM_REQUEST_TYPE_BUY}
		dbObj = dbObj.Where("trade_items.request_type in (?)", requestTypeArray)
	} else {
		err = errors.New("wrong requestType")
		return
	}

	sort := SortField(sortBy.(string)) + " " + sortOrder.(string)
	if sortBy == "measurement" {
		sort = sort + ", trade_items.quantity " + sortOrder.(string)
	}
	dbObj = dbObj.Order(sort)

	tradeRequests = []TradeRequest{}
	err = dbObj.Find(&tradeRequests).Offset(0).Limit(-1).Count(&count).Error

	return
}

func (m *tradeModel) FindForInspection(companyId, skip, take, requestType, status, sortBy, sortOrder interface{}) (tradeRequests []TradeRequest, count uint, err error) {

	_ = status

	var requestTypeArray []string
	if requestType == "all" || requestType == "" {
		requestTypeArray = []string{TRADE_ITEM_REQUEST_TYPE_BUY, TRADE_ITEM_REQUEST_TYPE_SELL}
	} else if requestType == "sell" {
		requestTypeArray = []string{TRADE_ITEM_REQUEST_TYPE_SELL}
	} else if requestType == "buy" {
		requestTypeArray = []string{TRADE_ITEM_REQUEST_TYPE_BUY}
	} else {
		err = errors.New("wrong requestType")
		return
	}
	requestNotStatusArray := []string{TRADE_STATUS_NEW, TRADE_STATUS_DECLINED, TRADE_STATUS_CANCELED}
	dbObj := Connection.Model(&TradeRequest{}).
		Set("gorm:auto_preload", true).
		Offset(skip).Limit(take).
		Joins("left join trade_items on trade_items.id = trade_requests.trade_item_id").
		Joins("left join companies as buyers on buyers.id = trade_requests.buyer_id").
		Joins("left join companies as sellers on sellers.id = trade_requests.seller_id").
		Where("trade_items.request_type in (?)", requestTypeArray).
		Where("inspection_id = ?", companyId).
		Where("status not in (?)", requestNotStatusArray)

	sort := SortField(sortBy.(string)) + " " + sortOrder.(string)
	if sortBy == "measurement" {
		sort = sort + ", trade_items.quantity " + sortOrder.(string)
	}
	dbObj = dbObj.Order(sort)

	tradeRequests = []TradeRequest{}
	count = 0
	err = dbObj.Find(&tradeRequests).Offset(0).Limit(-1).Count(&count).Error

	return
}

func (m *tradeModel) Get(id uint, autoPreload bool) (tr *TradeRequest, err error) {

	tr = &TradeRequest{}
	err = m.db.Model(tr).Where("ID = ?", id).Set("gorm:auto_preload", autoPreload).Find(tr).Error
	return
}

func (m *tradeModel) GetExpired() (tradeRequests []TradeRequest, err error) {
	tradeRequests = []TradeRequest{}
	err = m.db.Model(&TradeRequest{}).
		Joins("left join trade_items on trade_items.id = trade_requests.trade_item_id").
		Where("status = ?", TRADE_STATUS_NEW).
		Where("trade_items.validate_date < ?", time.Now()).Find(&tradeRequests).Error
	return
}

func (m *tradeModel) UpdateTradeItemByRequest(id uint, req *RequestTradeRequest) (err error) {

	ti := map[string]interface{}{}

	if req.RequestType != "" {
		ti["request_type"] = strings.ToUpper(req.RequestType)
	}
	if !req.Price.IsZero() {
		ti["price"] = req.Price
	}
	if req.Origin != "" {
		ti["origin"] = req.Origin
	}
	if req.Shipping != "" {
		ti["shipping"] = strings.ToUpper(req.Shipping)
	}
	if req.Measure != 0 {
		ti["quantity"] = req.Measure
	}
	if req.Measurement != "" {
		ti["measurement"] = strings.ToUpper(req.Measurement)
	}
	if req.RiceType != "" {
		ti["rice_type"] = req.RiceType
	}
	if req.CropYear != "" {
		ti["crop_type"] = req.CropYear
	}
	if req.Quality != "" {
		ti["quality"] = req.Quality
	}
	if req.Incoterm != "" {
		ti["incoterm"] = req.Incoterm
	}

	if req.DeliveryStartDate != "" {
		ti["delivery_start_date"] = req.DeliveryStartDate
	}
	if req.DeliveryEndDate != "" {
		ti["delivery_end_date"] = req.DeliveryEndDate
	}
	if req.Packaging != "" {
		ti["packaging"] = req.Packaging
	}
	if req.Payment != "" {
		ti["payment"] = req.Payment
	}
	if req.PaymentPeriod != "" {
		ti["payment_period"] = req.PaymentPeriod
	}
	if req.Rate != "" {
		ti["rate"] = req.Rate
	}
	if req.Terms != "" {
		ti["terms"] = req.Terms
	}

	if req.LoadPort != "" {
		ti["load_port"] = req.LoadPort
	}
	if req.LoadCountry != "" {
		ti["load_country"] = req.LoadCountry
	}
	if req.DestPort != "" {
		ti["dest_port"] = req.DestPort
	}
	if req.DestCountry != "" {
		ti["dest_country"] = req.DestCountry
	}

	if req.Incoterm == TRADE_ITEM_INCOTERM_FOB {
		if req.LoadPort != "" {
			ti["load_port"] = req.LoadPort
		}
		if req.LoadCountry != "" {
			ti["load_country"] = req.LoadCountry
		}
		ti["dest_port"] = ""
		ti["dest_country"] = ""
	} else if req.Incoterm == TRADE_ITEM_INCOTERM_CIF {
		if req.DestPort != "" {
			ti["dest_port"] = req.DestPort
		}
		if req.DestCountry != "" {
			ti["dest_country"] = req.DestCountry
		}
		ti["load_port"] = ""
		ti["load_country"] = ""
	}

	if req.Inspection != nil {
		company, err := CompanyModel(nil).Get(*req.Inspection)
		if err != nil {
			return err
		}
		if company.CompanyType != COMPANY_INSPECTION {
			err = errors.New("provided inspection is not inspection")
		}
		ti["inspectionID"] = req.Inspection
	}

	if req.Discharge != "" {
		ti["discharge"] = req.Discharge
	}
	if req.SpecialRequest != "" {
		ti["special_request"] = req.SpecialRequest
	}
	if req.ValidateDate != 0 {
		ti["validate_date"] = time.Unix(req.ValidateDate, 0).UTC()
	}
	ti["id"] = id
	err = m.db.Model(&TradeItem{}).Where("id = ?", id).Updates(ti).Error
	return
}

func (m *tradeModel) UpdateSellerBuyer(id uint, sellerID, buyerID *uint) (err error) {

	err = m.db.Model(TradeRequest{}).Where("id = ?", id).Updates(map[string]interface{}{"buyer_id": buyerID, "seller_id": sellerID}).Error
	return
}

func (m *tradeModel) UpdateStatus(id uint, status string) (err error) {

	err = m.db.Model(TradeRequest{}).Where("id = ?", id).Update("status", status).Error
	return
}

func (m *tradeModel) UpdatePayed(id uint, payed bool) (err error) {

	err = m.db.Model(TradeRequest{}).Where("id = ?", id).Update("payed", payed).Error
	return
}

func (m *tradeModel) Save(tr *TradeRequest) (err error) {

	err = m.db.Save(tr).Error
	return
}

func SortField(sortBy string) string {
	sortByField := ""
	switch sortBy {
	case "requestType":
		sortByField = "trade_items.request_type"
	case "measurement":
		sortByField = "trade_items.measurement"
	case "buyer":
		sortByField = "buyers.name"
	case "seller":
		sortByField = "sellers.name"
	case "shipping":
		sortByField = "trade_items.shipping"
	case "price":
		sortByField = "trade_items.price"
	case "origin":
		sortByField = "trade_items.origin"
	case "incoterm":
		sortByField = "trade_items.incoterm"
	case "deliveryStartDate":
		sortByField = "trade_items.delivery_start_date"
	case "deliveryEndDate":
		sortByField = "trade_items.delivery_end_date"
	case "destination":
		sortByField = "trade_items.dest_port"
	case "riceType":
		sortByField = "trade_items.rice_type"
	case "status":
		sortByField = "status"
	case "request_status":
		sortByField = "status"

	default:
		sortByField = "created_at"
	}
	return sortByField
}

func GetTradeRequest(req RequestTradeRequest) *TradeItem {
	return &TradeItem{
		RequestType:       strings.ToUpper(req.RequestType),
		Price:             req.Price,
		Origin:            req.Origin,
		Shipping:          strings.ToUpper(req.Shipping),
		Quantity:          req.Measure,
		Measurement:       strings.ToUpper(req.Measurement),
		RiceType:          req.RiceType,
		CropYear:          req.CropYear,
		Quality:           req.Quality,
		Incoterm:          req.Incoterm,
		DestCountry:       req.DestCountry,
		DestPort:          req.DestPort,
		DeliveryStartDate: req.DeliveryStartDate,
		DeliveryEndDate:   req.DeliveryEndDate,
		Packaging:         req.Packaging,
		Payment:           req.Payment,
		PaymentPeriod:     req.PaymentPeriod,
		InspectionID:      req.Inspection,
		Discharge:         req.Discharge,
		SpecialRequest:    req.SpecialRequest,
		ValidateDate:      time.Unix(req.ValidateDate, 0).UTC(),
		TimeZone:          req.TimeZone,
		LoadPort:          req.LoadPort,
		LoadCountry:       req.LoadCountry,
		Terms:             req.Terms,
		Rate:              req.Rate,
	}
}
