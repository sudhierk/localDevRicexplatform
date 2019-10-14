package api

import (
	"errors"
	"net/http"
	"time"

	"gitlab.com/riceexchangeplatform/riceex-backend/requests"

	"github.com/gin-gonic/gin"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"

	"fmt"

	"crypto"
	"crypto/rsa"
	"encoding/base64"

	"crypto/x509"
	"encoding/pem"

	"os"

	"github.com/sanity-io/litter"
	log "github.com/sirupsen/logrus"
)

// Smart cancel godoc
// @Summary Smart cancel
// @Description Smart cancel
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/cancel [post]
func (a *tradeApi) smartCancel(ctx *gin.Context) {

	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "cancel smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_NEW {
		HandleError(ctx, errors.New("wrong trade request status"), contextLogger, "")
		return

	}

	if scx.Trade.OwnerID != scx.User.CompanyID {
		HandleError(ctx, errors.New("only owner can cancel trade request"), contextLogger, "")
		return
	}

	err = db.TradeModel(nil).UpdateStatus(scx.Trade.ID, TRADE_STATUS_CANCELED)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("canceled successfully")
	if scx.Trade.SellerID != nil && scx.Trade.BuyerID != nil {
		notificationReceiverId := scx.Trade.OwnerID
		if scx.User.CompanyID == *scx.Trade.SellerID {
			notificationReceiverId = *scx.Trade.BuyerID
		} else {
			notificationReceiverId = *scx.Trade.SellerID
		}
		notification := NotificationStruct{
			ReceiverID: notificationReceiverId,
			Message: &NotificationMessageStruct{
				Initiator: scx.User.UserProfile.FullName(),
				Type:      TRADE_REQUEST_CANCELED_NOTIF,
				Data:      GetTradeIdString(scx.Trade.ID),
				Date:      time.Now(),
			},
		}
		SendNotification(&notification)
	}

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: scx.Trade.Status,
	})
}

// Smart reject godoc
// @Summary Smart reject
// @Description Smart reject
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/reject [post]
func (a *tradeApi) smartReject(ctx *gin.Context) {
	//TODO only owner can cancel? or whoo?
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "reject smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_NEW {
		if HandleError(ctx, errors.New("wrong trade request status"), contextLogger, "") {
			return
		}
	}

	err = db.TradeModel(nil).UpdateStatus(scx.Trade.ID, TRADE_STATUS_DECLINED)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("rejected successfully")

	notification := NotificationStruct{
		ReceiverID: scx.Trade.OwnerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_REQUEST_REJECTED_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: scx.Trade.Status,
	})
}

// Smart Deal godoc
// @Summary Accept Smart
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/accept [post]
func (a *tradeApi) smartDeal(ctx *gin.Context) {
	//TODO user can accept own trade request
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	user := scx.User
	if HandleError(ctx, err, nil, "") {
		return
	}

	tr := scx.Trade
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "deal smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if tr.Status != TRADE_STATUS_NEW {
		if HandleError(ctx, errors.New("wrong trade request status"), contextLogger, "") {
			return
		}
	}

	if tr.BuyerID == nil || user.CompanyID == *tr.BuyerID {
		tr.BuyerID = &user.CompanyID
	} else {
		tr.SellerID = &user.CompanyID
	}

	if os.Getenv("ENV") != ENV_TEST {
		err = a.hl.CreateTrade(tr.OwnerID, user.UserProfile.FullName(), tr.ID, user.CompanyID, tr.TradeItem.ValidateDate, tr.TradeItem.RequestType, tr.TradeItem.Incoterm)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
	}

	tr.Status = TRADE_STATUS_DEAL

	err = db.TradeModel(nil).Save(tr)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if tr.TradeItem.InspectionID != nil {
		inspCompany, err := db.CompanyModel(nil).Get(*tr.TradeItem.InspectionID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		userByCompany, err := db.UserModel(nil).GetByCompany(inspCompany.ID)
		notification := NotificationStruct{
			ReceiverID: userByCompany.ID,
			Message: &NotificationMessageStruct{
				Initiator: user.UserProfile.FullName(),
				Type:      INSPECTION_WAS_CHOOSED_NOTIF,
				Data:      GetTradeIdString(tr.ID),
				Date:      time.Now(),
			},
		}
		SendNotification(&notification)
	}

	contextLogger.Info(fmt.Sprintf("deal: buyer %d, seller %d", *tr.BuyerID, *tr.SellerID))
	notification := NotificationStruct{
		ReceiverID: tr.OwnerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_REQUEST_APPROVED_NOTIF,
			Data:      GetTradeIdString(tr.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: tr.Status,
	})
}

// Smart reject godoc
// @Summary Smart reject
// @Description Smart reject
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param req body requests.TradeSignRequest true "Request"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/sign [post]
func (a *tradeApi) smartSign(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "sign smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_DEAL {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to sign this trade"), nil, "")
		return
	}

	var req = &requests.TradeSignRequest{}
	err = ctx.Bind(req)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	text := req.Text
	signature, err := base64.StdEncoding.DecodeString(req.Sign)
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

	var state string
	if os.Getenv("ENV") != ENV_TEST {
		state, err = a.hl.TradeSign(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
	} else {
		if scx.User.CompanyID == scx.Trade.OwnerID {
			state = TRADE_STATUS_DEAL
		} else {
			state = TRADE_STATUS_SIGNED
		}
	}

	contextLogger.Info("state after HL", state)

	notificationReceiverId := scx.Trade.OwnerID
	if scx.User.CompanyID == *scx.Trade.BuyerID {
		scx.Trade.SignBuyer = true
		notificationReceiverId = *scx.Trade.SellerID
	} else {
		scx.Trade.SignSeller = true
		notificationReceiverId = *scx.Trade.BuyerID
	}
	scx.Trade.Status = state

	err = db.TradeModel(nil).Save(scx.Trade)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notification := NotificationStruct{
		ReceiverID: notificationReceiverId,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_REQUEST_SIGNED_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: scx.Trade.Status,
	})
}

// Smart reject godoc
// @Summary Smart reject
// @Description Smart reject
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Param req body requests.SmartTradeTextDocument true "Request"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/advice [post]
func (a *tradeApi) smartAdvice(ctx *gin.Context) {
	//TODO who can execute it?
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "advice smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_INSTRUCTIONS {
		HandleError(ctx, errors.New("wrong trade status"), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID {
		HandleError(ctx, errors.New("only seller can provide shipping advice"), contextLogger, "")
		return
	}

	var status string
	if os.Getenv("ENV") != ENV_TEST {
		status, err = a.hl.TradeAdvice(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		contextLogger.Info("status after HL: ", status)
	} else {
		status = TRADE_STATUS_ADVICE
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	scx.Trade.Status = status
	err = db.TradeModel(tx).UpdateStatus(scx.Trade.ID, status)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	var json = &requests.SmartTradeTextDocument{}
	err = ctx.Bind(json)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info(litter.Sdump(json))

	tdu := map[string]interface{}{
		"shipping_advice": json.Text,
	}
	err = db.TradeItemModel(tx).Update(scx.Trade.TradeItem.ID, tdu)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.BuyerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      SHIPPING_ADVICE_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: scx.Trade.Status,
	})
}

// Smart payment godoc
// @Summary Smart payment
// @Description Smart payment
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/confirm_payment [post]
func (a *tradeApi) smartPayment(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "payment smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_DOCUMENTS {
		HandleError(ctx, errors.New("wrong trade status"), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to this action"), nil, "")
		return
	}

	type TextDocument struct {
		Text string `json:"text"`
	}
	var json = &TextDocument{}
	err = ctx.Bind(json)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	var status string
	if os.Getenv("ENV") != ENV_TEST {
		status, err = a.hl.ProcessPayment(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}

		contextLogger.Info("status after HL: ", status)
	} else {
		status = TRADE_STATUS_PAYMENT
	}

	if status == TRADE_STATUS_PAYMENT {
		scx.Trade.Payed = true
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	err = db.TradeModel(tx).UpdatePayed(scx.Trade.ID, scx.Trade.Payed)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	scx.Trade.Status = status
	err = db.TradeModel(tx).UpdateStatus(scx.Trade.ID, status)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	err = db.TradeItemModel(tx).UpdatePaymentComment(scx.Trade.TradeItemID, json.Text)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.SellerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_PAYMENT_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, SmartPaymentMessage{
		Status: scx.Trade.Status,
		Payed:  scx.Trade.Payed,
	})
}

// Smart confirm payment godoc
// @Summary Smart confirm payment
// @Description Smart confirm payment
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/confirm_payment [post]
func (a *tradeApi) smartConfirmPayment(ctx *gin.Context) {
	//TODO checks
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "confirm payment smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_PAYMENT {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID {
		HandleError(ctx, errors.New("user doesn't have access to this action"), nil, "")
		return
	}

	var status string
	if os.Getenv("ENV") != ENV_TEST {
		status, err = a.hl.ConfirmPayment(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}

		contextLogger.Info("status after HL: ", status)
	} else {
		status = TRADE_STATUS_PAYED
	}

	if status == TRADE_STATUS_PAYED {
		scx.Trade.PaymentViewed = true
		scx.Trade.Status = status
		tm := time.Now().Add(90 * 24 * time.Hour)
		scx.Trade.CompletionAt = tm
		err = db.TradeModel(nil).Save(scx.Trade)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
	} else {
		HandleError(ctx, errors.New("hl didn't return payed status"), nil, "")
		return
	}

	notification := NotificationStruct{
		ReceiverID: *scx.Trade.BuyerID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_PAYED_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: status,
	})
}

// Smart close payment godoc
// @Summary Smart close payment
// @Description Smart close payment
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/close [post]
func (a *tradeApi) smartClose(ctx *gin.Context) {
	//TODO checks
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":     "close smart",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to this action"), nil, "")
		return
	}

	if scx.Trade.Status != TRADE_STATUS_PAYED {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	//don't check for dev and sandbox for testing
	if os.Getenv("ENV") != ENV_DEV && os.Getenv("ENV") != ENV_SANDBOX && os.Getenv("ENV") != ENV_TEST {
		if time.Now().Before(scx.Trade.CompletionAt) {
			HandleError(ctx, errors.New("needs to wait 90 days before close"), contextLogger, "")
		}
	}

	var receiverID uint
	if scx.User.CompanyID == *scx.Trade.BuyerID {
		if scx.Trade.BuyerClose {
			HandleError(ctx, errors.New("buyer can close trade only once"), contextLogger, "")
			return
		}
		scx.Trade.BuyerClose = true
		receiverID = *scx.Trade.SellerID
	} else {
		if scx.Trade.SellerClose {
			HandleError(ctx, errors.New("seller can close trade only once"), contextLogger, "")
			return
		}
		scx.Trade.SellerClose = true
		receiverID = *scx.Trade.BuyerID
	}

	var status string
	if os.Getenv("ENV") != ENV_TEST {
		status, err = a.hl.CloseTrade(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}

		contextLogger.Info("status after HL: ", status)
	} else {
		if scx.Trade.BuyerClose && scx.Trade.SellerClose {
			status = TRADE_STATUS_CLOSED
		} else {
			status = TRADE_STATUS_PAYED
		}
	}

	scx.Trade.Status = status
	err = db.TradeModel(nil).Save(scx.Trade)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notification := NotificationStruct{
		ReceiverID: receiverID,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_CLOSE_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: status,
	})
}

// Get audit log godoc
// @Summary Get audit log
// @Description Get audit log
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /{id}/smart/log [get]
func (a *tradeApi) auditLog(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	log.Debug("audit log for ", scx.User.CompanyID)
	history, err := a.hl.GetHistory(scx.User.CompanyID, scx.Trade.ID)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"items": history,
	})
}

type smartContext struct {
	User  *db.User
	Trade *db.TradeRequest
}

func (a *tradeApi) context(ctx *gin.Context) (res *smartContext, err error) {
	res = &smartContext{}

	res.User, err = a.user(ctx)
	if err != nil {
		return
	}

	res.Trade, err = a.tradeRequest(ctx)
	return
}
