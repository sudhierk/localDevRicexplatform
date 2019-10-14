package api

import (
	"errors"
	"fmt"
	"net/http"

	"gitlab.com/riceexchangeplatform/riceex-backend/requests"

	"time"

	"github.com/gin-gonic/gin"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"

	"encoding/json"

	"strconv"

	"os"

	"github.com/sanity-io/litter"
	log "github.com/sirupsen/logrus"
)

// Trade smart instructions godoc
// @Summary Smart instructions
// @Description Trade smart instructions
// @Tags trade
// @Accept json
// @Produce json
// @Param req body requests.TradeTextDocumentInstruction true "text document instructions data"
// @Success 200 {object} api.DocumentFileHashMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/smart/instructions [post]
func (a *tradeApi) smartInstructions(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "instructions smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_VESSEL_NOMINATED {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to send doc instructions"), contextLogger, "")
		return
	}

	var req = &requests.TradeTextDocumentInstruction{}
	err = ctx.Bind(req)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info(litter.Sdump(req))

	var reqDocumentary = &db.DocumentaryInstructions{
		BillOfLadingNotify:    req.BillOfLadingNotify,
		BillOfLadingConsignee: req.BillOfLadingConsignee,
		CertOfOriginNotify:    req.CertOfOriginNotify,
		CertOfOriginConsignee: req.CertOfOriginConsignee,
		PackingAndMarkings:    req.PackingAndMarkings,
	}

	//they asked to remove it
	/*if reqDocumentary.CertOfOriginConsignee == "" || reqDocumentary.CertOfOriginNotify == "" {
		HandleError(ctx, errors.New("not all required fields provided"))
		return
	}*/

	type HLDocumentInstructions struct {
		Amount     string `json:"amount"`
		Incoterm   string `json:"incoterm"`
		ShipmentId string `json:"shipmentId"`
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	instructionsForHL := make([]HLDocumentInstructions, len(req.Instructions))
	totalAmount := uint(0)
	for _, instruction := range req.Instructions {
		totalAmount += instruction.Amount
	}
	if totalAmount != scx.Trade.TradeItem.Quantity {
		HandleError(ctx, errors.New("total amount is wrong"), contextLogger, "")
		return
	}

	for i, instruction := range req.Instructions {

		shipment := &db.Shipment{
			Quantity:    instruction.Amount,
			TradeItemID: scx.Trade.TradeItemID,
		}

		if err = db.ShipmentModel(nil).Save(shipment); err != nil {
			HandleError(ctx, err, contextLogger, "")
			tx.Rollback()
			return
		}

		instructionsForHL[i].ShipmentId = fmt.Sprintf("%d", shipment.ID)
		instructionsForHL[i].Amount = fmt.Sprint(instruction.Amount)
		instructionsForHL[i].Incoterm = scx.Trade.TradeItem.Incoterm
	}

	if len(instructionsForHL) == 0 {
		HandleError(ctx, errors.New("0 instructions were provided"), contextLogger, "")
		return
	}

	instructionsForHLString, err := json.Marshal(instructionsForHL)

	contextLogger.Info("smartInstructions: ", string(instructionsForHLString))

	status := ""
	if os.Getenv("ENV") != ENV_TEST {
		status, err = a.hl.TradeInstructions(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID, string(instructionsForHLString))
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
	} else {
		status = TRADE_STATUS_INSTRUCTIONS
	}

	contextLogger.Info("status after HL: ", status)

	err = db.TradeModel(tx).UpdateStatus(scx.Trade.ID, status)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	scx.Trade.TradeItem.DestPort = req.DestPort
	scx.Trade.TradeItem.DestCountry = req.DestCountry
	err = db.TradeItemModel(tx).Save(&scx.Trade.TradeItem)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	reqDocumentary.TradeItemID = scx.Trade.TradeItemID
	err = db.DocInstructionsModel(tx).Save(reqDocumentary)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.SellerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_REQUEST_DOCUMENT_INSTRUICTIONS_SENT_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: status,
	})
}

// Get trade smart instructions godoc
// @Summary Get smart instructions
// @Description Get trade smart instructions
// @Tags trade
// @Accept json
// @Produce json
// @Param req body requests.TradeTextDocumentInstruction true "text document instructions data"
// @Success 200 {object} api.DocumentInstructionsMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/smart/instructions [get]
func (a *tradeApi) getSmartInstructions(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	//TODO add inspection company
	/*if scx.User.CompanyID != *scx.Trade.BuyerID && scx.User.CompanyID != *scx.Trade.SellerID {
		HandleError(ctx, errors.New("getSmartInstructions permission"), nil, "")
		return
	}*/

	docInstructions, err := db.DocInstructionsModel(nil).GetByTradeId(scx.Trade.TradeItemID)
	if HandleError(ctx, err, nil, strconv.Itoa(http.StatusNotFound)) {
		return
	}
	shipments, err := db.ShipmentModel(nil).GetByTradeItemId(scx.Trade.TradeItemID)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, DocumentInstructionsMessage{
		DocumentaryInstructions: docInstructions,
		Shipments:               shipments,
	})
}
