package api

import (
	"errors"
	"net/http"

	"crypto"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"

	"time"

	"strconv"

	"os"

	"github.com/gin-gonic/gin"
	"github.com/sanity-io/litter"
	log "github.com/sirupsen/logrus"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	. "gitlab.com/riceexchangeplatform/riceex-backend/requests"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"
	"gitlab.com/riceexchangeplatform/riceex-backend/tools"
)

// Create invoice godoc
// @Summary Create invoice
// @Description Create invoice
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "Trade invoice ID"
// @Param req body requests.TradeInvoiceCreateRequest true "Trade invoice"
// @Success 200 {object} api.InvoiceMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/invoice [post]
func (a *tradeApi) CreateInvoice(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":   "create invoice",
		"user":  scx.User.ID,
		"trade": scx.Trade.ID,
	})

	if constants.TRADE_STATUSES[scx.Trade.Status] >= constants.TRADE_STATUSES[constants.TRADE_STATUS_DOCUMENTS] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	if scx.Trade.TradeItem.Invoice != nil {
		HandleError(ctx, errors.New("invoice already created"), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID {
		HandleError(ctx, errors.New("invalid Seller Company ID"), contextLogger, "")
		return
	}

	//TODO Important! calculate total amount by mul all bills
	//invoice.TotalAmount = tradeItem.Price.Mul(billOfLading.QuantCleanOnBoard)
	log.Info("scx.Trade.TradeItemID", scx.Trade.TradeItemID)
	scx.Trade.TradeItem.Invoice = &db.TradeInvoice{}
	req := &TradeInvoiceCreateRequest{}
	err = ctx.Bind(req)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	scx.Trade.TradeItem.Invoice.TotalAmount = req.TotalAmount
	scx.Trade.TradeItem.Invoice.BankRequisites = req.BankRequisites
	scx.Trade.TradeItem.Invoice.InvoiceNo = req.InvoiceNo
	scx.Trade.TradeItem.Invoice.VesselName = req.VesselName
	text := req.Text
	signature, err := base64.StdEncoding.DecodeString(req.Signature)
	newhash := crypto.SHA256
	pssh := newhash.New()
	pssh.Write([]byte(text))
	hashed := pssh.Sum(nil)

	pkcs1RSAPublicKey, _ := pem.Decode([]byte(scx.User.PublicKey))

	pub, err := x509.ParsePKIXPublicKey(pkcs1RSAPublicKey.Bytes)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	pubStruct, ok := pub.(*rsa.PublicKey)
	if !ok {
		HandleError(ctx, errors.New("can't parse public key"), contextLogger, "")
		return
	}

	err = rsa.VerifyPKCS1v15(pubStruct, newhash, hashed, signature)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info(litter.Sdump(scx.Trade.TradeItem.Invoice))

	tx := db.Connection.Begin()
	defer tx.Commit()

	err = db.InvoiceModel(tx).Save(scx.Trade.TradeItem.Invoice)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	shipmentDocument := &db.ShipmentDocument{
		Type:       constants.DOCUMENT_INVOICE,
		InvoiceID:  &scx.Trade.TradeItem.Invoice.ID,
		ShipmentID: 0,
		Status:     constants.DOCUMENT_STATUS_NEW,
	}
	err = db.ShipmentDocumentModel(tx).Save(shipmentDocument)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	fileDocument := &db.FileDocument{
		Name:       "Invoice",
		Source:     "",
		Owner:      scx.User.ID,
		DocumentID: shipmentDocument.ID,
		Hash:       tools.GetInvoiceHash(*scx.Trade.TradeItem.Invoice),
	}
	err = db.FileModel(tx).SaveDocument(fileDocument)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	if os.Getenv("ENV") != constants.ENV_TEST {
		scx.Trade.Status, err = a.hl.UploadDocument(
			scx.User.CompanyID,
			scx.User.UserProfile.FullName(),
			scx.Trade.ID,
			0,
			fileDocument.ID,
			constants.DOCUMENT_INVOICE,
			tools.GetInvoiceHash(*scx.Trade.TradeItem.Invoice))
		if HandleError(ctx, err, contextLogger, "") {
			tx.Rollback()
			return
		}
	}

	err = db.TradeItemModel(tx).Update(scx.Trade.TradeItemID, map[string]interface{}{"invoice_id": scx.Trade.TradeItem.Invoice.ID})
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.BuyerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      DOCUMENT_INVOICE_FILLED_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, uint(0), constants.DOCUMENT_INVOICE),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, InvoiceMessage{
		InvoiceID:  scx.Trade.TradeItem.Invoice.ID,
		Status:     scx.Trade.Status,
		DocumentID: shipmentDocument.ID,
	})
}

// Update invoice godoc
// @Summary Update invoice
// @Description Update invoice
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "Trade invoice ID"
// @Param req body requests.TradeInvoiceUpdateRequest true "Trade invoice"
// @Success 200 {object} api.IDMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/invoice [put]
func (a *tradeApi) UpdateInvoice(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":        "update invoice",
		"user":       scx.User.ID,
		"trade":      scx.Trade.ID,
		"trade item": scx.Trade.TradeItem.ID,
		"invoice":    scx.Trade.TradeItem.InvoiceID,
	})

	if constants.TRADE_STATUSES[scx.Trade.Status] >= constants.TRADE_STATUSES[constants.TRADE_STATUS_DOCUMENTS] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	if scx.Trade.TradeItem.InvoiceID == nil {
		HandleError(ctx, errors.New("invoice is not created"), contextLogger, "")
		return
	}

	var req = &TradeInvoiceUpdateRequest{}
	err = ctx.Bind(req)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	contextLogger.Info(req)

	scx.Trade.TradeItem.Invoice.InvoiceNo = req.InvoiceNo
	scx.Trade.TradeItem.Invoice.BankRequisites = req.BankRequisites
	scx.Trade.TradeItem.Invoice.TotalAmount = req.TotalAmount
	scx.Trade.TradeItem.Invoice.VesselName = req.VesselName

	text := req.Text
	signature, err := base64.StdEncoding.DecodeString(req.Signature)
	newhash := crypto.SHA256
	pssh := newhash.New()
	pssh.Write([]byte(text))
	hashed := pssh.Sum(nil)

	pkcs1RSAPublicKey, _ := pem.Decode([]byte(scx.User.PublicKey))

	pub, err := x509.ParsePKIXPublicKey(pkcs1RSAPublicKey.Bytes)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	pubStruct, ok := pub.(*rsa.PublicKey)
	if !ok {
		HandleError(ctx, errors.New("can't parse public key"), contextLogger, "")
		return
	}

	err = rsa.VerifyPKCS1v15(pubStruct, newhash, hashed, signature)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	document, err := db.ShipmentDocumentModel(nil).GetByInvoiceId(*scx.Trade.TradeItem.InvoiceID)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	document.Status = constants.DOCUMENT_STATUS_NEW
	document.ApprovedByBuyer = false
	document.RejectedByBuyer = false
	err = db.ShipmentDocumentModel(tx).Save(document)

	fileDocument := &db.FileDocument{
		Name:       "Invoice",
		Source:     "",
		Owner:      scx.User.ID,
		DocumentID: document.ID,
		Hash:       tools.GetInvoiceHash(*scx.Trade.TradeItem.Invoice),
	}
	err = db.FileModel(tx).SaveDocument(fileDocument)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	_, err = a.hl.UploadDocument(scx.User.CompanyID,
		scx.User.UserProfile.FullName(),
		scx.Trade.ID,
		0,
		fileDocument.ID,
		constants.DOCUMENT_INVOICE,
		tools.GetInvoiceHash(*scx.Trade.TradeItem.Invoice))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	err = db.InvoiceModel(tx).Save(scx.Trade.TradeItem.Invoice)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.BuyerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      DOCUMENT_INVOICE_FILLED_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, uint(0), constants.DOCUMENT_INVOICE),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, IDMessage{
		ID: *scx.Trade.TradeItem.InvoiceID,
	})
}

// Get invoice godoc
// @Summary Get invoice
// @Description Get invoice
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "Trade invoice ID"
// @Success 200 {object} api.UpdateInvoiceMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/invoice [get]
func (a *tradeApi) GetInvoice(ctx *gin.Context) {
	//TODO do we need to return bills?
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	if scx.Trade.TradeItem.InvoiceID == nil {
		HandleError(ctx, errors.New("trade doesn't have invoice yet"), nil, strconv.Itoa(http.StatusNotFound))
		return
	}

	document, err := db.ShipmentDocumentModel(nil).GetByInvoiceId(*scx.Trade.TradeItem.InvoiceID)
	if HandleError(ctx, err, nil, strconv.Itoa(http.StatusNotFound)) {
		return
	}

	ctx.JSON(http.StatusOK, UpdateInvoiceMessage{
		Invoice:  scx.Trade.TradeItem.Invoice,
		Document: document,
	})
}
