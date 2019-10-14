package api

import (
	"errors"
	"net/http"

	"strconv"
	"time"

	"strings"

	"github.com/gin-gonic/gin"

	"gitlab.com/riceexchangeplatform/riceex-backend/db"

	log "github.com/sirupsen/logrus"

	"github.com/sanity-io/litter"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	. "gitlab.com/riceexchangeplatform/riceex-backend/requests"
	. "gitlab.com/riceexchangeplatform/riceex-backend/responses"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"
)

type tradeApi struct {
	hl *HyperledgerApiStruct
}

func (a *tradeApi) Routes(r gin.IRoutes) {
	r.POST("/", a.Create)
	r.GET("/", a.GetList)
	r.GET("/:id", a.Get)
	r.PUT("/:id", a.Update)

	r.GET("/:id/comments", a.GetComments)
	r.POST("/:id/comments", a.CreateComment)
	r.GET("/:id/info", a.GetInfo)

	r.POST("/:id/smart/accept", a.smartDeal)
	r.POST("/:id/smart/reject", a.smartReject)
	r.POST("/:id/smart/cancel", a.smartCancel)
	r.POST("/:id/smart/sign", a.smartSign)

	r.PUT("/:id/smart/nominate_vessel", a.smartNominateVessel)
	r.PUT("/:id/smart/accept_vessel_nomination", a.smartAcceptVessel)
	r.PUT("/:id/smart/reject_vessel_nomination", a.smartRejectVessel)
	r.GET("/:id/smart/vessel_nomination", a.smartGetVessel)

	r.POST("/:id/smart/instructions", a.smartInstructions)
	r.GET("/:id/smart/instructions", a.getSmartInstructions)

	r.POST("/:id/report_inspection", a.UploadReport)
	r.GET("/:id/report_inspection", a.GetReports)
	r.GET("/:id/report_file/:reportId", a.GetReportFile)

	r.GET("/:id/shipments", a.GetShipments)
	r.POST("/:id/shipment/:shipmentId/upload", a.UploadDocument)
	r.PUT("/:id/shipment/:shipmentId/document", a.UpdateDocument)
	r.PUT("/:id/shipment/:shipmentId/document/:documentId/approve", a.ApproveDocument)
	r.PUT("/:id/shipment/:shipmentId/document/:documentId/reject", a.RejectDocument)
	r.PUT("/:id/shipment/:shipmentId/document/:documentId/release", a.ReleaseDocument)
	r.GET("/:id/shipment/:shipmentId/documents", a.GetDocuments)
	r.GET("/:id/shipment/:shipmentId/file/:fileId", a.GetDocumentFile)
	r.POST("/:id/shipment/:shipmentId/document/:documentId/comment", a.CommentDocument)
	r.GET("/:id/shipment/:shipmentId/document/:documentId/comments", a.GetDocumentComments)

	r.GET("/:id/shipment/:shipmentId/document/:documentId/file/:fileId/hash", a.GetDocumentFileHash)

	r.POST("/:id/shipment/:shipmentId/bill", a.CreateBill)
	r.PUT("/:id/shipment/:shipmentId/bill", a.UpdateBill)
	r.GET("/:id/shipment/:shipmentId/bill", a.GetBill)

	r.POST("/:id/invoice", a.CreateInvoice)
	r.GET("/:id/invoice", a.GetInvoice)
	r.PUT("/:id/invoice", a.UpdateInvoice)

	r.POST("/:id/smart/advice", a.smartAdvice)
	r.POST("/:id/smart/payment", a.smartPayment)
	r.POST("/:id/smart/confirm_payment", a.smartConfirmPayment)
	r.POST("/:id/smart/close", a.smartClose)

	r.GET("/:id/smart/log", a.auditLog)

	r.POST("/:id/bid/", a.BidCounter)
	r.GET("/:id/bid/", a.BidGetAll)
	r.PUT("/:id/bid/accept", a.BidAccept)
	r.PUT("/:id/bid/decline", a.BidDecline)
}

// Create trade godoc
// @Summary Create trade
// @Description Create trade
// @Tags trade
// @Accept json
// @Produce json
// @Param req body requests.RequestTradeRequest true "Trade"
// @Success 200 {object} api.IDMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/ [post]
func (a *tradeApi) Create(ctx *gin.Context) {
	var req = &RequestTradeRequest{}
	err := ctx.Bind(req)

	if HandleError(ctx, err, nil, "") {
		return
	}
	req.RequestType = strings.ToUpper(req.RequestType)
	req.Shipping = strings.ToUpper(req.Shipping)
	req.Incoterm = strings.ToUpper(req.Incoterm)

	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "trade create",
		"user":    user.ID,
		"company": user.CompanyID,
	})

	contextLogger.Info(litter.Sdump(req))
	ti := db.GetTradeRequest(*req)

	var counterparties []uint
	if len(req.CounterParties) > 0 {
		counterparties = req.CounterParties
	} else {
		counterparties = []uint{0}
	}
	contextLogger.Info("counterparties", counterparties)

	lastTRID := uint(0)
	for _, counterparty := range counterparties {
		tr := &db.TradeRequest{}

		tr.TradeItem = *ti

		if req.RequestType == TRADE_ITEM_REQUEST_TYPE_BUY {
			tr.BuyerID = &user.CompanyID
			if counterparty == 0 {
				tr.SellerID = nil
			} else {
				tr.SellerID = &counterparty
			}

		} else {
			tr.SellerID = &user.CompanyID
			if counterparty == 0 {
				tr.BuyerID = nil
			} else {
				tr.BuyerID = &counterparty
			}
		}

		tr.OwnerID = user.CompanyID

		tr.Status = TRADE_STATUS_NEW

		vn := &db.VesselNomination{}
		db.Connection.Save(vn)
		tr.VesselNomination = *vn

		err = db.TradeModel(nil).Save(tr)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		lastTRID = tr.ID
		notificationType := NEW_OPEN_TRADE_REQUEST_NOTIF
		excludeInspections := true
		if counterparty != 0 {
			notificationType = NEW_TRADE_REQUEST_NOTIF
			excludeInspections = false
		}
		notification := NotificationStruct{
			ReceiverID:         counterparty,
			ExcludeInspections: excludeInspections,
			Message: &NotificationMessageStruct{
				Initiator:   user.UserProfile.FullName(),
				InitiatorID: user.ID,
				Type:        notificationType,
				Data:        GetTradeIdString(tr.ID),
				Date:        time.Now(),
			},
		}
		SendNotification(&notification)
	}
	contextLogger.Info("successfully created")
	ctx.JSON(http.StatusOK, IDMessage{
		ID: lastTRID,
	})
}

// Get trades godoc
// @Summary Get trades
// @Description Get list of trades
// @Tags trade
// @Accept json
// @Produce json
// @Param skip query string false "Skip"
// @Param take query string false "Take"
// @Param type query string false "Type"
// @Param status query string false "Status"
// @Param page query string false "Page"
// @Param sort query string false "Sort"
// @Param order query string false "Order"
// @Success 200 {object} api.ListForInspection
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/ [get]
func (a *tradeApi) GetList(ctx *gin.Context) {
	skip := ctx.Request.URL.Query().Get("skip")
	take := ctx.Request.URL.Query().Get("take")
	requestType := ctx.Request.URL.Query().Get("type")
	page := ctx.Request.URL.Query().Get("page")
	status := ctx.Request.URL.Query().Get("status")
	sortBy := ctx.Request.URL.Query().Get("sort")
	sortOrder := ctx.Request.URL.Query().Get("order")

	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":         "get trades",
		"user":        user.ID,
		"company":     user.CompanyID,
		"skip":        skip,
		"take":        take,
		"requestType": requestType,
		"page":        page,
		"status":      status,
		"sortBy":      sortBy,
		"sortOrder":   sortOrder,
	})

	tradeRequests, count, err := db.TradeModel(nil).Find(*user, skip, take, requestType, page, status, sortBy, sortOrder)
	if HandleError(ctx, err, nil, "") {
		return
	}

	results := make([]RequestTradeResponse, 0)
	for _, tr := range tradeRequests {
		results = append(results, GetTradeResponse(&tr))
	}
	contextLogger.Info("Count:", len(results))
	ctx.JSON(http.StatusOK, ListForInspection{
		Items:  results,
		Counts: count,
	})
}

// Get trade godoc
// @Summary Get trade
// @Description Get trade
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.GetTradeMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id} [get]
func (a *tradeApi) Get(ctx *gin.Context) {
	//TODO check if user has access
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	tradeRequest, err := a.tradeRequest(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	if user.Company.CompanyType != COMPANY_INSPECTION {
		if tradeRequest.SellerID != nil && tradeRequest.BuyerID != nil {
			if user.CompanyID != *tradeRequest.SellerID && user.CompanyID != *tradeRequest.BuyerID {
				HandleError(ctx, errors.New("wrong access"), nil, strconv.Itoa(http.StatusForbidden))
				return
			}
		}
	} else {
		if user.CompanyID != *tradeRequest.TradeItem.InspectionID {
			HandleError(ctx, errors.New("wrong access"), nil, strconv.Itoa(http.StatusForbidden))
			return
		}
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "get trade",
		"user":    user.ID,
		"company": user.CompanyID,
		"trade":   tradeRequest.ID,
	})

	contextLogger.Info("get trade successful")

	res := GetTradeResponse(tradeRequest)

	ctx.JSON(http.StatusOK, GetTradeMessage{
		Request: res,
	})
}

// Get trade info godoc
// @Summary Get trade info
// @Description Get trade info
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.GetTradeInfoMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/info [get]
func (a *tradeApi) GetInfo(ctx *gin.Context) {
	//TODO check if user has access
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	tradeRequest, err := a.tradeRequest(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "get info",
		"user":    user.ID,
		"company": user.CompanyID,
		"trade":   tradeRequest.ID,
	})

	seller := &db.User{}
	if tradeRequest.SellerID != nil {
		seller, err = db.UserModel(nil).GetByCompany(*tradeRequest.SellerID)
		if HandleError(ctx, err, nil, "") {
			return
		}
	}
	buyer := &db.User{}
	if tradeRequest.SellerID != nil {
		buyer, err = db.UserModel(nil).GetByCompany(*tradeRequest.BuyerID)
		if HandleError(ctx, err, nil, "") {
			return
		}
	}

	res := GetTradeInfoResponse(tradeRequest, seller, buyer)

	contextLogger.Info("get trade info successful")

	ctx.JSON(http.StatusOK, GetTradeInfoMessage{
		Info: res,
	})
}

// Update trade  godoc
// @Summary Update trade
// @Description Update trade
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param req body requests.RequestTradeRequest true "Request"
// @Success 200 {object} api.IDMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id} [put]
func (a *tradeApi) Update(ctx *gin.Context) {
	var req = &RequestTradeRequest{}
	err := ctx.Bind(req)
	if HandleError(ctx, err, nil, "") {
		return
	}

	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	tradeRequest, err := a.tradeRequest(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "update trade req",
		"user":    user.ID,
		"company": user.CompanyID,
		"trade":   tradeRequest.ID,
	})

	if tradeRequest.Status != TRADE_STATUS_NEW {
		if HandleError(ctx, errors.New("wrong trade request status"), contextLogger, "") {
			return
		}
	}

	if tradeRequest.OwnerID != user.CompanyID {
		HandleError(ctx, errors.New("only owner can update request"), contextLogger, "")
		return
	}

	contextLogger.Info(litter.Sdump(req))

	if tradeRequest.Status != TRADE_STATUS_NEW {
		if HandleError(ctx, errors.New("wrong trade request status"), contextLogger, "") {
			return
		}
	}

	tx := db.Connection.Begin()
	defer tx.Commit()
	err = db.TradeModel(tx).UpdateTradeItemByRequest(tradeRequest.TradeItemID, req)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	if len(req.CounterParties) > 1 {
		contextLogger.Info("only one counterparty can be selected on edit mode")
		HandleError(ctx, errors.New("only one counterparty can be selected on edit mode"), contextLogger, "")
		return
	} else if len(req.CounterParties) == 1 {
		for _, v := range req.CounterParties {
			tr := &db.TradeRequest{}
			if tradeRequest.TradeItem.RequestType == TRADE_ITEM_REQUEST_TYPE_BUY {
				tr.SellerID = &v
				tr.BuyerID = &user.CompanyID
			} else {
				tr.BuyerID = &v
				tr.SellerID = &user.CompanyID
			}
			contextLogger.Info("update seller/buyer", *tr.SellerID, *tr.BuyerID)
			err = db.TradeModel(tx).UpdateSellerBuyer(tradeRequest.TradeItemID, tr.SellerID, tr.BuyerID)
			if HandleError(ctx, err, contextLogger, "") {
				tx.Rollback()
				return
			}

			notificationType := NEW_TRADE_REQUEST_NOTIF
			excludeInspections := false

			notification := NotificationStruct{
				ReceiverID:         v,
				ExcludeInspections: excludeInspections,
				Message: &NotificationMessageStruct{
					Initiator:   user.UserProfile.FullName(),
					InitiatorID: user.ID,
					Type:        notificationType,
					Data:        GetTradeIdString(tradeRequest.TradeItemID),
					Date:        time.Now(),
				},
			}
			SendNotification(&notification)
		}
	} else {
		if req.RequestType != "" {
			tr := &db.TradeRequest{TradeItemID: tradeRequest.TradeItem.ID}
			if strings.ToUpper(req.RequestType) == TRADE_ITEM_REQUEST_TYPE_BUY {
				tr.SellerID = nil
				tr.BuyerID = &user.CompanyID
			} else if strings.ToUpper(req.RequestType) == TRADE_ITEM_REQUEST_TYPE_SELL {
				tr.BuyerID = nil
				tr.SellerID = &user.CompanyID
			} else {
				HandleError(ctx, errors.New("wrong request type "+req.RequestType), contextLogger, "")
				return
			}
			contextLogger.Info("update seller/buyer", tr.SellerID, tr.BuyerID)
			err = db.TradeModel(tx).UpdateSellerBuyer(tradeRequest.TradeItemID, tr.SellerID, tr.BuyerID)
			if HandleError(ctx, err, contextLogger, "") {
				tx.Rollback()
				return
			}
		}
	}

	ctx.JSON(http.StatusOK, IDMessage{
		ID: tradeRequest.ID,
	})
}

func (a *tradeApi) user(ctx *gin.Context) (user *db.User, err error) {
	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), true, true, false)
	return
}

func (a *tradeApi) tradeRequest(ctx *gin.Context) (tradeRequest *db.TradeRequest, err error) {
	idStr, ok := ctx.Params.Get("id")
	if !ok {
		err = errors.New("invalid TradeRequest ID")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return
	}

	tradeRequest, err = db.TradeModel(nil).Get(uint(id), true)
	return
}
