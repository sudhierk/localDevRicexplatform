package api

import (
	"io"
	"net/http"
	"os"

	"strconv"

	"github.com/gin-gonic/gin"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"

	"crypto/sha256"

	"encoding/hex"

	"time"

	"github.com/pkg/errors"
	"github.com/sanity-io/litter"
	log "github.com/sirupsen/logrus"
	"github.com/twinj/uuid"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	"gitlab.com/riceexchangeplatform/riceex-backend/responses"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"
)

// Upload document godoc
// @Summary Upload document
// @Description Upload document
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "ShipmentId"
// @Param docType body api.DocType true "DocType"
// @Success 200 {object} api.UploadDocumentMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/upload [post]
func (a *tradeApi) UploadDocument(ctx *gin.Context) {
	//TODO check status, keep only 2 versions of document
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	shipmentIdStr, _ := ctx.Params.Get("shipmentId")

	contextLogger := log.WithFields(log.Fields{
		"api":      "upload document",
		"user":     scx.User.ID,
		"company":  scx.User.CompanyID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentIdStr,
	})

	if TRADE_STATUSES[scx.Trade.Status] >= TRADE_STATUSES[TRADE_STATUS_DOCUMENTS] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	var req = &DocType{}
	log.Info("req.DocType", req.DocType)
	err = ctx.Bind(req)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if !DOC_TYPES[req.DocType] {
		HandleError(ctx, errors.New("wrong document type"), contextLogger, "")
		return

	}

	if scx.User.CompanyID == *scx.Trade.SellerID {
		switch req.DocType {
		case DOCUMENT_PHYTOSANITARY,
			DOCUMENT_NON_GMO,
			DOCUMENT_EXPORT_DECLARATION,
			DOCUMENT_INSURANCE:
		default:
			HandleError(ctx, errors.New("seller can't upload this type of document"), contextLogger, "")
			return
		}
	} else if scx.User.CompanyID == *scx.Trade.TradeItem.InspectionID {
		switch req.DocType {
		case DOCUMENT_CERT_OF_QUALITY,
			DOCUMENT_CERT_OF_WEIGHT,
			DOCUMENT_CERT_OF_FUMIGATION,
			DOCUMENT_QUALITY_APPEARANCE_CERT,
			DOCUMENT_CERT_OF_PACKING:
		default:
			HandleError(ctx, errors.New("inspection company can't upload this type of document"), contextLogger, "")
			return
		}
	} else {
		HandleError(ctx, errors.New("user must be seller or inspection company"), contextLogger, "")
		return
	}

	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if err != nil {
		return
	}

	shipment, err := db.ShipmentModel(nil).Get(uint(shipmentId))
	if shipment.TradeItemID != scx.Trade.TradeItemID {
		if HandleError(ctx, errors.New("this shipment is not related to trade request"), contextLogger, "") {
			return
		}
	}

	contextLogger.Info(req)

	file, header, err := ctx.Request.FormFile("upload")

	path := "uploads/documents/" + uuid.NewV4().String()

	out, err := os.Create(path)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("File saved for trade document", header.Filename)

	tx := db.Connection.Begin()
	defer tx.Commit()

	h := sha256.New()
	f, err := os.Open(path)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	if _, err := io.Copy(h, f); err != nil {
		tx.Rollback()
		return
	}

	shipmentDocument, notFound := db.ShipmentDocumentModel(nil).GetByTypeForShipment(uint(shipmentId), req.DocType)
	contextLogger.Info("Not Found ", notFound, uint(shipmentId), req.DocType)
	if notFound {
		shipmentDocument = &db.ShipmentDocument{}
		shipmentDocument.Type = req.DocType
		shipmentDocument.ShipmentID = uint(shipmentId)
	}

	shipmentDocument.Status = DOCUMENT_STATUS_NEW
	shipmentDocument.ApprovedByBuyer = false
	shipmentDocument.RejectedByBuyer = false
	err = db.ShipmentDocumentModel(tx).Save(shipmentDocument)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	fileDocument := &db.FileDocument{
		Name:       header.Filename,
		Source:     path,
		Owner:      scx.User.ID,
		DocumentID: shipmentDocument.ID,
		Hash:       hex.EncodeToString(h.Sum(nil)),
	}
	err = db.FileModel(tx).SaveDocument(fileDocument)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	contextLogger.Info("HL request:", scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID, req.DocType, "sha256: ", hex.EncodeToString(h.Sum(nil)))
	if os.Getenv("ENV") != ENV_TEST {
		scx.Trade.Status, err = a.hl.UploadDocument(scx.User.CompanyID, scx.User.UserProfile.FullName(),
			scx.Trade.ID,
			uint(shipmentId),
			fileDocument.ID,
			shipmentDocument.Type,
			hex.EncodeToString(h.Sum(nil)))
		if HandleError(ctx, err, contextLogger, "") {
			tx.Rollback()
			return
		}
	}

	notification := NotificationStruct{
		ReceiverID: scx.Trade.OwnerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      DOCUMENT_UPLOADED_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, shipment.ID, shipmentDocument.Type),
			Date:      time.Now(),
		},
	}

	message := "A new version of the document has been uploaded - " + header.Filename
	cm := &db.DocumentComment{
		DocumentID:  shipmentDocument.ID,
		UserID:      scx.User.ID,
		Text:        message,
		AutoComment: true,
	}

	switch req.DocType {
	case DOCUMENT_CERT_OF_QUALITY,
		DOCUMENT_CERT_OF_WEIGHT,
		DOCUMENT_CERT_OF_FUMIGATION,
		DOCUMENT_QUALITY_APPEARANCE_CERT,
		DOCUMENT_CERT_OF_PACKING:
		notification.ReceiverID = *scx.Trade.SellerID
		cm.Receiver = *scx.Trade.SellerID
	default:
		notification.ReceiverID = *scx.Trade.BuyerID
		cm.Receiver = *scx.Trade.BuyerID
	}

	err = db.DocumentCommentsModel(nil).Save(cm)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	SendNotification(&notification)

	ctx.JSON(http.StatusOK, UploadDocumentMessage{
		DocumentID: shipmentDocument.ID,
		FileID:     fileDocument.ID,
		Type:       req.DocType,
		File:       header.Filename,
		Status:     shipmentDocument.Status,
	})
}

// Update document godoc
// @Summary Update document
// @Description Update document
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "ShipmentId"
// @Param docType body api.DocType true "DocType"
// @Success 200 {object} api.UploadDocumentMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/upload [put]
func (a *tradeApi) UpdateDocument(ctx *gin.Context) {
	//TODO check if we need some different way to handle upload and update
	a.UploadDocument(ctx)
}

// Get documents godoc
// @Summary Get documents
// @Description Get documents
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "ShipmentId"
// @Success 200 {object} api.ShipmentDocumentsMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/documents [get]
func (a *tradeApi) GetDocuments(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	shipmentIdStr, _ := ctx.Params.Get("shipmentId")
	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}
	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID &&
		scx.User.CompanyID != *scx.Trade.TradeItem.InspectionID {
		HandleError(ctx, errors.New("user doesn't have access to documents for this trade"), nil, "")
		return
	}

	shipmentDocuments, err := db.ShipmentDocumentModel(nil).GetByShipmentId(uint(shipmentId))
	if HandleError(ctx, err, nil, "") {
		return
	}
	ctx.JSON(http.StatusOK, ShipmentDocumentsMessage{
		ShipmentDocuments: shipmentDocuments,
	})
}

// Approve document godoc
// @Summary Approve document
// @Description Approve document
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "Shipment Id"
// @Param documentId path uint true "Document Id"
// @Success 200 {object} api.ApproveDocumentMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/document/{documentId}/approve [put]
func (a *tradeApi) ApproveDocument(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	shipmentIdStr, _ := ctx.Params.Get("shipmentId")

	documentIdStr, _ := ctx.Params.Get("documentId")

	contextLogger := log.WithFields(log.Fields{
		"api":      "approve document",
		"user":     scx.User.ID,
		"company":  scx.User.CompanyID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentIdStr,
		"document": documentIdStr,
	})

	if TRADE_STATUSES[scx.Trade.Status] >= TRADE_STATUSES[TRADE_STATUS_DOCUMENTS] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	documentId, err := strconv.Atoi(documentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	doc, err := db.ShipmentDocumentModel(nil).Get(uint(documentId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notifReceiver := scx.Trade.OwnerID
	if scx.User.CompanyID == *scx.Trade.BuyerID {
		notifReceiver = *scx.Trade.SellerID
		switch doc.Type {
		case DOCUMENT_PHYTOSANITARY,
			DOCUMENT_NON_GMO,
			DOCUMENT_EXPORT_DECLARATION,
			DOCUMENT_INSURANCE:
			if doc.Status == DOCUMENT_STATUS_NEW ||
				doc.Status == DOCUMENT_STATUS_RELEASED_FOR_BUYER {
				doc.Status = DOCUMENT_STATUS_APPROVED_BY_BUYER
			} else {
				HandleError(ctx, errors.New("buyer can't approve this document  "+doc.Status), contextLogger, "")
				return
			}
		default:
			if doc.Status == DOCUMENT_STATUS_RELEASED_FOR_BUYER {
				doc.Status = DOCUMENT_STATUS_APPROVED_BY_BUYER
			} else if doc.Status == DOCUMENT_STATUS_NEW {
				doc.Status = DOCUMENT_STATUS_APPROVED_BY_BUYER_DURING_REVIEW
			} else {
				HandleError(ctx, errors.New("buyer can't approve this document "+doc.Status), contextLogger, "")
				return
			}
		}
	} else if scx.User.CompanyID == *scx.Trade.SellerID {
		notifReceiver = *scx.Trade.BuyerID
		doc.Status = DOCUMENT_STATUS_APPROVED_BY_SELLER
	} else {
		HandleError(ctx, errors.New("user must be seller or buyer"), contextLogger, "")
		return
	}

	if scx.User.CompanyID == *scx.Trade.BuyerID {
		doc.ApprovedByBuyer = true
	}

	err = db.ShipmentDocumentModel(nil).Save(doc)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if os.Getenv("ENV") != ENV_TEST {
		scx.Trade.Status, err = a.hl.ApproveDocument(scx.User.CompanyID, scx.User.UserProfile.FullName(),
			scx.Trade.ID,
			doc.ID,
			uint(shipmentId),
			doc.Type,
		)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
	} else {
		scx.Trade.Status = TRADE_STATUS_ADVICE
	}

	err = checkIfCanMoveToNextStep(scx, contextLogger, a.hl)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notification := NotificationStruct{
		ReceiverID: notifReceiver,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      DOCUMENT_APPROVED_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, uint(shipmentId), doc.Type),
			Date:      time.Now(),
		},
	}

	if scx.User.CompanyID == *scx.Trade.BuyerID {
		notification.ReceiverID = *scx.Trade.SellerID
	} else {
		if doc.Type == DOCUMENT_CERT_OF_QUALITY ||
			doc.Type == DOCUMENT_CERT_OF_WEIGHT ||
			doc.Type == DOCUMENT_CERT_OF_FUMIGATION ||
			doc.Type == DOCUMENT_CERT_OF_PACKING ||
			doc.Type == DOCUMENT_QUALITY_APPEARANCE_CERT {
			notification.ReceiverID = *scx.Trade.TradeItem.InspectionID
		} else {
			notification.ReceiverID = *scx.Trade.BuyerID
		}
	}
	SendNotification(&notification)

	contextLogger.Info("Document approved, current status: ", doc.Status)
	ctx.JSON(http.StatusOK, ApproveDocumentMessage{
		DocumentStatus: doc.Status,
		TradeStatus:    scx.Trade.Status,
	})
}
func checkIfCanMoveToNextStep(scx *smartContext, contextLogger *log.Entry, hl *HyperledgerApiStruct) error {
	shipments, err := db.ShipmentModel(nil).GetByTradeItemId(scx.Trade.TradeItemID)

	if err != nil {
		return err
	}

	if scx.Trade.TradeItem.InvoiceID == nil {
		return nil
	}

	if scx.Trade.TradeItem.InvoiceID != nil {
		docInvoice, err := db.ShipmentDocumentModel(nil).GetByInvoiceId(*scx.Trade.TradeItem.InvoiceID)
		if err != nil {
			return err
		}
		if docInvoice.Status != DOCUMENT_STATUS_APPROVED_BY_SELLER {
			return nil
		}
	}

	log.Info("Doc was approved , checking all documents for all shipments: ", len(shipments))
	approvedShipments := 0
	for _, shipment := range shipments {
		shipmentDocuments, err := db.ShipmentDocumentModel(nil).GetByShipmentId(shipment.ID)
		if err != nil {
			return err
		}

		m := make(map[string]bool)
		for _, document := range shipmentDocuments {
			if document.Status == DOCUMENT_STATUS_APPROVED_BY_SELLER {
				contextLogger.Info("Docs is approved for shipment ", shipment.ID, " ", document.ID)
				m[document.Type] = true
			}
		}
		if m[DOCUMENT_CERT_OF_QUALITY] &&
			m[DOCUMENT_BILL] &&
			m[DOCUMENT_CERT_OF_WEIGHT] &&
			m[DOCUMENT_CERT_OF_FUMIGATION] &&
			m[DOCUMENT_PHYTOSANITARY] {
			contextLogger.Info("All docs are approved for shipment ", shipment.ID)
			approvedShipments++
		}
	}
	contextLogger.Info("approved shipments: ", approvedShipments)
	if approvedShipments == len(shipments) {
		contextLogger.Info("All documents are approved for all shipments")
		if os.Getenv("ENV") != ENV_TEST {
			scx.Trade.Status, err = hl.ConfirmDocument(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
			if err != nil {
				return err
			}
			contextLogger.Info("status after HL: ", scx.Trade.Status)
		} else {
			scx.Trade.Status = TRADE_STATUS_DOCUMENTS
		}

		err = db.TradeModel(nil).UpdateStatus(scx.Trade.ID, scx.Trade.Status)
		if err != nil {
			return err
		}
	}
	return nil
}

// Reject document godoc
// @Summary Reject document
// @Description Reject document
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "Shipment Id"
// @Param documentId path uint true "Document Id"
// @Success 200 {object} api.DocumentStatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/document/{documentId}/reject [put]
func (a *tradeApi) RejectDocument(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	shipmentIdStr, _ := ctx.Params.Get("shipmentId")

	documentIdStr, _ := ctx.Params.Get("documentId")

	contextLogger := log.WithFields(log.Fields{
		"api":      "approve document",
		"user":     scx.User.ID,
		"company":  scx.User.CompanyID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentIdStr,
		"document": documentIdStr,
	})

	if TRADE_STATUSES[scx.Trade.Status] >= TRADE_STATUSES[TRADE_STATUS_DOCUMENTS] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	documentId, err := strconv.Atoi(documentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	doc, err := db.ShipmentDocumentModel(nil).Get(uint(documentId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if scx.User.CompanyID == *scx.Trade.BuyerID {
		switch doc.Type {
		case DOCUMENT_PHYTOSANITARY,
			DOCUMENT_NON_GMO,
			DOCUMENT_EXPORT_DECLARATION,
			DOCUMENT_BILL,
			DOCUMENT_INVOICE,
			DOCUMENT_INSURANCE:
			if doc.Status == DOCUMENT_STATUS_NEW ||
				doc.Status == DOCUMENT_STATUS_RELEASED_FOR_BUYER {
				doc.Status = DOCUMENT_STATUS_REJECTED_BY_BUYER
			} else {
				HandleError(ctx, errors.New("buyer can't reject this document "+doc.Status), contextLogger, "")
				return
			}
		default:
			if doc.Status == DOCUMENT_STATUS_RELEASED_FOR_BUYER {
				doc.Status = DOCUMENT_STATUS_REJECTED_BY_BUYER
			} else if doc.Status == DOCUMENT_STATUS_NEW {
				doc.Status = DOCUMENT_STATUS_REJECTED_BY_BUYER_DURING_REVIEW
			} else {
				HandleError(ctx, errors.New("buyer can't reject this document "+doc.Status), contextLogger, "")
				return
			}
		}
	} else if scx.User.CompanyID == *scx.Trade.SellerID {
		doc.Status = DOCUMENT_STATUS_REJECTED_BY_SELLER
	} else {
		HandleError(ctx, errors.New("user must be seller or buyer"), contextLogger, "")
		return
	}

	scx.Trade.Status, err = a.hl.RejectDocument(scx.User.CompanyID, scx.User.UserProfile.FullName(),
		scx.Trade.ID,
		doc.ID,
		uint(shipmentId),
		doc.Type,
	)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if scx.User.CompanyID == *scx.Trade.BuyerID {
		doc.RejectedByBuyer = true
	}
	err = db.ShipmentDocumentModel(nil).Save(doc)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("Document rejected, current status: ", doc.Status)

	notification := NotificationStruct{
		ReceiverID: scx.Trade.OwnerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      DOCUMENT_REJECTED_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, uint(shipmentId), doc.Type),
			Date:      time.Now(),
		},
	}

	if scx.User.CompanyID == *scx.Trade.BuyerID {
		notification.ReceiverID = *scx.Trade.SellerID
	} else {
		if doc.Type == DOCUMENT_CERT_OF_QUALITY ||
			doc.Type == DOCUMENT_CERT_OF_WEIGHT ||
			doc.Type == DOCUMENT_CERT_OF_FUMIGATION ||
			doc.Type == DOCUMENT_CERT_OF_PACKING ||
			doc.Type == DOCUMENT_QUALITY_APPEARANCE_CERT {
			notification.ReceiverID = *scx.Trade.TradeItem.InspectionID
		} else {
			notification.ReceiverID = *scx.Trade.BuyerID
		}
	}

	SendNotification(&notification)

	ctx.JSON(http.StatusOK, DocumentStatusMessage{
		DocumentStatus: doc.Status,
	})
}

// Release document godoc
// @Summary Release document
// @Description Release document
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "Shipment Id"
// @Param documentId path uint true "Document Id"
// @Success 200 {object} api.DocumentStatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/document/{documentId}/release [put]
func (a *tradeApi) ReleaseDocument(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	shipmentIdStr, _ := ctx.Params.Get("shipmentId")

	documentIdStr, _ := ctx.Params.Get("documentId")

	contextLogger := log.WithFields(log.Fields{
		"api":      "approve document",
		"user":     scx.User.ID,
		"company":  scx.User.CompanyID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentIdStr,
		"document": documentIdStr,
	})

	if TRADE_STATUSES[scx.Trade.Status] >= TRADE_STATUSES[TRADE_STATUS_DOCUMENTS] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	documentId, err := strconv.Atoi(documentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	doc, err := db.ShipmentDocumentModel(nil).Get(uint(documentId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if scx.User.CompanyID == *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("buyer can't release this document "), contextLogger, "")
		return
	} else if scx.User.CompanyID == *scx.Trade.SellerID {
		switch doc.Status {
		case DOCUMENT_STATUS_NEW,
			DOCUMENT_STATUS_APPROVED_BY_BUYER_DURING_REVIEW,
			DOCUMENT_STATUS_REJECTED_BY_BUYER_DURING_REVIEW,
			DOCUMENT_STATUS_APPROVED_BY_SELLER:
			doc.Status = DOCUMENT_STATUS_RELEASED_FOR_BUYER
		default:
			HandleError(ctx, errors.New("seller can't release document with this status "+doc.Status), contextLogger, "")
			return
		}
	} else {
		HandleError(ctx, errors.New("user must be seller or buyer"), contextLogger, "")
		return
	}

	scx.Trade.Status, err = a.hl.ReleaseForBuyerDocument(scx.User.CompanyID, scx.User.UserProfile.FullName(),
		scx.Trade.ID,
		doc.ID,
		uint(shipmentId),
		doc.Type,
	)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	err = db.ShipmentDocumentModel(nil).Save(doc)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	contextLogger.Info("Document released, current status: ", doc.Status)

	/*if doc.Status == DOCUMENT_STATUS_RELEASED_FOR_BUYER {

		err = checkIfCanMoveToNextStep(scx, contextLogger, a.hl)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
	}*/

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.BuyerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      DOCUMENT_RELEASED_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, uint(shipmentId), doc.Type),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, DocumentStatusMessage{
		DocumentStatus: doc.Status,
	})
}

//TODO permissions
func (a *tradeApi) GetDocumentFile(ctx *gin.Context) {
	fileIdStr, _ := ctx.Params.Get("fileId")
	fileId, err := strconv.Atoi(fileIdStr)
	if err != nil {
		return
	}

	file, err := db.FileModel(nil).GetDocument(uint(fileId))
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.FileAttachment(file.Source, file.Name)
}

// Comment document godoc
// @Summary Comment document
// @Description Comment document
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "Shipment Id"
// @Param documentId path uint true "Document Id"
// @Success 200 {object} api.DocumentStatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/document/{documentId}/comment [post]
func (a *tradeApi) CommentDocument(ctx *gin.Context) {
	//TODO check if can comment parent, notification
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	shipmentIdStr, _ := ctx.Params.Get("shipmentId")

	documentIdStr, _ := ctx.Params.Get("documentId")

	contextLogger := log.WithFields(log.Fields{
		"api":      "comment document",
		"user":     scx.User.ID,
		"company":  scx.User.CompanyID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentIdStr,
		"document": documentIdStr,
	})

	documentId, err := strconv.Atoi(documentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	shipmentId, err := strconv.Atoi(shipmentIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	doc, err := db.ShipmentDocumentModel(nil).Get(uint(documentId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if doc.Type != DOCUMENT_INVOICE && doc.Shipment.TradeItemID != scx.Trade.TradeItemID {
		HandleError(ctx, errors.New("this doc doesn't related to trade"), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID &&
		scx.User.CompanyID != *scx.Trade.TradeItem.InspectionID {
		HandleError(ctx, errors.New("user doesn't have access to comment this document"), contextLogger, "")
		return
	}

	var json = struct {
		Text     string `json:"text"`
		ParentID *uint  `json:"parentId"`
		Receiver uint   `json:"receiver"`
	}{}
	err = ctx.Bind(&json)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if scx.User.CompanyID == *scx.Trade.BuyerID {
		if json.Receiver != *scx.Trade.SellerID {
			HandleError(ctx, errors.New("buyer can send comment only for seller"), contextLogger, "")
			return
		}
	}

	if scx.User.CompanyID == *scx.Trade.TradeItem.InspectionID {
		if json.Receiver != *scx.Trade.SellerID {
			HandleError(ctx, errors.New("inspection company can send comment only for seller"), contextLogger, "")
			return
		}
	}

	cm := &db.DocumentComment{
		DocumentID: doc.ID,
		ParentID:   json.ParentID,
		UserID:     scx.User.ID,
		Text:       json.Text,
		Receiver:   json.Receiver,
	}

	if cm.Receiver != *scx.Trade.SellerID &&
		cm.Receiver != *scx.Trade.BuyerID &&
		cm.Receiver != *scx.Trade.TradeItem.InspectionID {
		HandleError(ctx, errors.New("receiver doesn't have access to receive this comment"), contextLogger, "")
		return
	}

	contextLogger.Info(litter.Sdump(json))

	err = db.DocumentCommentsModel(nil).Save(cm)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notification := NotificationStruct{
		ReceiverID: cm.Receiver,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      COMMENT_ADDED_TO_DOC_NOTIF,
			Data:      GetDocumentNotifString(scx.Trade.ID, uint(shipmentId), doc.Type),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, DocumentCommentMessage{
		CommentID: cm.ID,
	})
}

// Get comments of the document godoc
// @Summary Document's comment
// @Description Get comments of the document
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "Shipment Id"
// @Param documentId path uint true "Document Id"
// @Success 200 {object} api.DocumentStatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/document/{documentId}/comments [get]
func (a *tradeApi) GetDocumentComments(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	shipmentIdStr, _ := ctx.Params.Get("shipmentId")

	documentIdStr, _ := ctx.Params.Get("documentId")

	contextLogger := log.WithFields(log.Fields{
		"api":      "comment document",
		"user":     scx.User.ID,
		"company":  scx.User.CompanyID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentIdStr,
		"document": documentIdStr,
	})

	documentId, err := strconv.Atoi(documentIdStr)
	if err != nil {
		return
	}

	doc, err := db.ShipmentDocumentModel(nil).Get(uint(documentId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	if doc.Type != DOCUMENT_INVOICE && doc.Shipment.TradeItemID != scx.Trade.TradeItemID {
		HandleError(ctx, errors.New("this doc doesn't related to trade"), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID &&
		scx.User.CompanyID != *scx.Trade.TradeItem.InspectionID {
		HandleError(ctx, errors.New("user doesn't have access to comment this document"), contextLogger, "")
		return
	}

	comments, err := db.DocumentCommentsModel(nil).GetTree(doc.ID, scx.User.CompanyID)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	results := make([]responses.ResponseDocumentComment, 0)
	for _, c := range comments {
		user, err := db.UserModel(nil).GetByCompany(c.Receiver)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		receiverRole := getRole(*scx.Trade, c.Receiver)
		senderRole := getRole(*scx.Trade, c.User.ID)
		results = append(results, responses.GetResponseDocumentComment(c, *user, receiverRole, senderRole, c.AutoComment))
	}

	ctx.JSON(http.StatusOK, DocumentCommentsMessage{
		Comments: results,
	})
}

func getRole(trade db.TradeRequest, companyID uint) (role string) {
	if companyID == *trade.SellerID {
		role = "Seller"
	} else if companyID == *trade.BuyerID {
		role = "Buyer"
	} else {
		role = "Inspection Company"
	}
	return
}

// Get document file hash godoc
// @Summary File's hash
// @Description Get document file hash
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param shipmentId path uint true "Shipment Id"
// @Param documentId path uint true "Document Id"
// @Param fileId path uint true "File Id"
// @Success 200 {object} api.DocumentFileHashMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipment/{shipmentId}/document/{documentId}/file/{fileId}/hash [get]
func (a *tradeApi) GetDocumentFileHash(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	shipmentIdStr, _ := ctx.Params.Get("shipmentId")

	fileIdStr, _ := ctx.Params.Get("fileId")

	contextLogger := log.WithFields(log.Fields{
		"api":      "get hash document",
		"user":     scx.User.ID,
		"company":  scx.User.CompanyID,
		"trade":    scx.Trade.ID,
		"shipment": shipmentIdStr,
		"file":     fileIdStr,
	})

	fileId, err := strconv.Atoi(fileIdStr)
	if err != nil {
		return
	}

	log.Debug("file hash for ", scx.User.CompanyID)

	hash, err := a.hl.GetDocumentHashState(scx.User.CompanyID, uint(fileId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	ctx.JSON(http.StatusOK, DocumentFileHashMessage{
		Sha256: hash,
	})
}
