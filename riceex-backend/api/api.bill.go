package api

import (
	"errors"
	"net/http"

	log "github.com/sirupsen/logrus"

	"strconv"

	"time"

	"os"

	"github.com/gin-gonic/gin"
	"github.com/sanity-io/litter"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"
	"gitlab.com/riceexchangeplatform/riceex-backend/tools"
)

// Create bill godoc
// @Summary Create bill
// @Description Create bill
// @Tags trade
// @Accept  json
// @Produce  json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "ShipmentId"
// @Param shipmentBill body db.ShipmentBill true "ShipmentBill"
// @Success 200 {object} api.CreateUpdateBillMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/bill [post]
func (a *tradeApi) CreateBill(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	shipmentIdStr, ok := ctx.Params.Get("shipmentId")
	if !ok {
		HandleError(ctx, errors.New("wrong shipmentId"), nil, "")
	}
	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":      "create bill",
		"user":     scx.User.ID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentId,
	})

	if TRADE_STATUSES[scx.Trade.Status] >= TRADE_STATUSES[TRADE_STATUS_DOCUMENTS] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	shipment, err := db.ShipmentModel(nil).Get(uint(shipmentId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if shipment.TradeItemID != scx.Trade.TradeItemID {
		HandleError(ctx, errors.New("shipment is not related to trade request"), contextLogger, "")
		return
	}

	if shipment.BillID != nil {
		HandleError(ctx, errors.New("bill already created for this shipment"), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID {
		HandleError(ctx, errors.New("invalid Seller User ID"), contextLogger, "")
		return
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	bill := &db.ShipmentBill{}
	err = ctx.Bind(&bill)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if bill.ShippedOnBoard.After(time.Now()) {
		HandleError(ctx, errors.New("shipment on board must be before today"), contextLogger, "")
		return
	}

	contextLogger.Info(litter.Sdump(shipment.Bill))

	err = db.BillModel(tx).Save(bill)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	shipment.BillID = &bill.ID
	err = db.ShipmentModel(tx).Save(shipment)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	shipmentDocument := &db.ShipmentDocument{
		Type:       DOCUMENT_BILL,
		BillID:     &bill.ID,
		ShipmentID: shipment.ID,
		Status:     DOCUMENT_STATUS_NEW,
	}
	err = db.ShipmentDocumentModel(tx).Save(shipmentDocument)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	fileDocument := &db.FileDocument{
		Name:       "Bill",
		Source:     "",
		Owner:      scx.User.ID,
		DocumentID: shipmentDocument.ID,
		Hash:       tools.GetBillHash(*bill),
	}
	err = db.FileModel(tx).SaveDocument(fileDocument)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	if os.Getenv("ENV") != ENV_TEST {
		scx.Trade.Status, err = a.hl.UploadDocument(scx.User.CompanyID,
			scx.User.UserProfile.FullName(),
			scx.Trade.ID,
			shipment.ID,
			fileDocument.ID,
			constants.DOCUMENT_BILL,
			tools.GetBillHash(*bill))
		if HandleError(ctx, err, contextLogger, "") {
			tx.Rollback()
			return
		}
	}

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.BuyerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      DOCUMENT_BILL_FILLED_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, shipment.ID, constants.DOCUMENT_BILL),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, CreateUpdateBillMessage{

		DocumentID: shipmentDocument.ID,
		FileID:     fileDocument.ID,
		BillID:     shipment.BillID,
		Status:     scx.Trade.Status,
	})
}

// Update bill godoc
// @Summary Update bill
// @Description Update bill
// @Tags trade
// @Accept  json
// @Produce  json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "ShipmentId"
// @Success 200 {object} api.CreateUpdateBillMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/bill [put]
func (a *tradeApi) UpdateBill(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	shipmentIdStr, ok := ctx.Params.Get("shipmentId")
	if !ok {
		HandleError(ctx, errors.New("wrong shipmentId"), nil, "")
	}
	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":      "update bill",
		"user":     scx.User.ID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentId,
	})

	if TRADE_STATUSES[scx.Trade.Status] >= TRADE_STATUSES[TRADE_STATUS_DOCUMENTS] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	shipment, err := db.ShipmentModel(nil).Get(uint(shipmentId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID {
		HandleError(ctx, errors.New("invalid Seller User ID"), contextLogger, "")
		return
	}

	if shipment.BillID == nil {
		HandleError(ctx, errors.New("bill is not created for this shipment"), contextLogger, "")
		return
	}

	err = ctx.Bind(&shipment.Bill)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if shipment.Bill.ShippedOnBoard.After(time.Now()) {
		HandleError(ctx, errors.New("shipment on board must be before today"), contextLogger, "")
		return
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	document, err := db.ShipmentDocumentModel(nil).GetByBillId(*shipment.BillID)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	document.Status = constants.DOCUMENT_STATUS_NEW
	document.ApprovedByBuyer = false
	document.RejectedByBuyer = false
	err = db.ShipmentDocumentModel(tx).Save(document)

	fileDocument := &db.FileDocument{
		Name:       "Bill",
		Source:     "",
		Owner:      scx.User.ID,
		DocumentID: document.ID,
		Hash:       tools.GetBillHash(*shipment.Bill),
	}
	err = db.FileModel(tx).SaveDocument(fileDocument)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	scx.Trade.Status, err = a.hl.UploadDocument(scx.User.CompanyID,
		scx.User.UserProfile.FullName(),
		scx.Trade.ID,
		shipment.ID,
		fileDocument.ID,
		constants.DOCUMENT_BILL,
		tools.GetBillHash(*shipment.Bill))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	err = db.BillModel(tx).Save(shipment.Bill)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.BuyerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      DOCUMENT_BILL_FILLED_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, shipment.ID, constants.DOCUMENT_BILL),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, CreateUpdateBillMessage{
		DocumentID: document.ID,
		FileID:     fileDocument.ID,
		BillID:     shipment.BillID,
		Status:     scx.Trade.Status,
	})
}

// Get bill godoc
// @Summary Get bill
// @Description Get bill
// @Tags trade
// @Accept  json
// @Produce  json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "Shipment Id"
// @Success 200 {object} api.GetBillMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/bill [get]
func (a *tradeApi) GetBill(ctx *gin.Context) {

	shipmentIdStr, ok := ctx.Params.Get("shipmentId")
	if !ok {
		HandleError(ctx, errors.New("wrong shipmentId"), nil, "")
		return
	}
	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	shipment, err := db.ShipmentModel(nil).Get(uint(shipmentId))
	if HandleError(ctx, err, nil, "") {
		return
	}

	if shipment.BillID == nil {
		HandleError(ctx, errors.New("shipmentId doesn't have bill yet"), nil, strconv.Itoa(http.StatusNotFound))
		return
	}

	document, err := db.ShipmentDocumentModel(nil).GetByBillId(*shipment.BillID)
	if HandleError(ctx, err, nil, strconv.Itoa(http.StatusNotFound)) {
		return
	}

	bill := shipment.Bill

	ctx.JSON(http.StatusOK, GetBillMessage{
		BillID:                bill.ID,
		Document:              document,
		BillNumber:            bill.BillNumber,
		ShippingComp:          bill.ShippingComp,
		Shipper:               bill.Shipper,
		VessVoyage:            bill.VessVoyage,
		BookingRef:            bill.BookingRef,
		ShipperRef:            bill.ShipperRef,
		QuantCleanOnBoard:     bill.QuantCleanOnBoard,
		FreightsCharges:       bill.FreightsCharges,
		DeclaredValue:         bill.DeclaredValue,
		PlaceIssue:            bill.PlaceIssue,
		DateIssue:             bill.DateIssue,
		CarriersAgentsEndorsm: bill.CarriersAgentsEndorsm,
		NotifyParties:         bill.NotifyParties,
		PortOfLoad:            bill.PortOfLoad,
		PortOfDischarge:       bill.PortOfDischarge,
		PackGoodsDescript:     bill.PackGoodsDescript,
		Marking:               bill.Marking,
		ShippedOnBoard:        bill.ShippedOnBoard,
		Consignee:             bill.Consignee,
		CarrierReceipt:        bill.CarrierReceipt,
		CreatedAt:             bill.CreatedAt,
	})
}
