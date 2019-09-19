package api

import (
	"errors"
	"fmt"
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"
	"net/http"

	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"
)

// Bid Counter godoc
// @Summary count bids
// @Description count bids
// @Tags trade
// @Produce  json
// @Param id path uint true "ID"
// @Param counterRequest body requests.CounterRequest true "Counter request"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/bid/ [post]
func (a *tradeApi) BidCounter(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	if scx.Trade.Status != TRADE_STATUS_NEW {
		HandleError(ctx, errors.New("wrong trade status"), nil, "")
		return
	}

	if scx.Trade.SellerID == nil &&
		scx.Trade.BuyerID == nil {
		HandleError(ctx, errors.New("trade is not private"), nil, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to this trade"), nil, "")
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "bid counter",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	var req = &requests.CounterRequest{}
	err = ctx.Bind(req)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	lastBid, hasItem := db.BidModel(nil).GetLastBid(scx.Trade.ID)

	if hasItem {
		log.Info("has item", lastBid.Status)
		tx := db.Connection.Begin()
		defer tx.Commit()
		if lastBid.Status == BID_STATUS_COUNTERED {
			HandleError(ctx, errors.New("user can't counter countered bid"), nil, "")
			return
		} else if lastBid.Status == BID_STATUS_ACCEPTED {
			HandleError(ctx, errors.New("user can't counter accepted bid"), nil, "")
			return
		} else if lastBid.Status == BID_STATUS_DECLINED {
			if lastBid.FromCompanyID != scx.User.CompanyID {
				HandleError(ctx, errors.New("only company form prev bid can counter declined bid"), nil, "")
				return
			}
			newBid := &db.Bid{
				TradeRequestID: scx.Trade.ID,
				Status:         BID_STATUS_NEW,
				FromCompanyID:  scx.User.CompanyID,
				ToCompanyID:    lastBid.ToCompanyID,
				Price:          req.Price,
				PreviousBidID:  &lastBid.ID,
			}
			err := db.BidModel(tx).Save(newBid)
			if HandleError(ctx, err, contextLogger, "") {
				return
			}
			receiver, _ := db.UserModel(nil).GetByCompany(lastBid.ToCompanyID)
			sendNotifCounterBid(scx.User.UserProfile.FullName(), receiver.ID, scx.Trade.ID)

		} else if lastBid.Status == BID_STATUS_NEW {
			if lastBid.ToCompanyID != scx.User.CompanyID {
				HandleError(ctx, errors.New("only bid from counterparty can be countered"), nil, "")
				return
			}
			newBid := &db.Bid{
				TradeRequestID: scx.Trade.ID,
				Status:         BID_STATUS_NEW,
				FromCompanyID:  scx.User.CompanyID,
				ToCompanyID:    lastBid.FromCompanyID,
				Price:          req.Price,
				PreviousBidID:  &lastBid.ID,
			}
			lastBid.Status = BID_STATUS_COUNTERED
			err := db.BidModel(tx).Save(lastBid)
			if HandleError(ctx, err, contextLogger, "") {
				return
			}
			err = db.BidModel(tx).Save(newBid)
			if HandleError(ctx, err, contextLogger, "") {
				tx.Rollback()
				return
			}

			receiver, _ := db.UserModel(nil).GetByCompany(lastBid.FromCompanyID)
			sendNotifCounterBid(scx.User.UserProfile.FullName(), receiver.ID, scx.Trade.ID)
		}
	} else {
		/*if scx.User.CompanyID != *scx.Trade.SellerID {
			HandleError(ctx, errors.New("only seller can initiate bid"), nil, "")
			return
		}*/
		receiverID := *scx.Trade.BuyerID
		if scx.User.CompanyID == *scx.Trade.BuyerID {
			receiverID = *scx.Trade.SellerID
		}
		newBid := &db.Bid{
			TradeRequestID: scx.Trade.ID,
			Status:         BID_STATUS_NEW,
			FromCompanyID:  scx.User.CompanyID,
			ToCompanyID:    receiverID,
			Price:          req.Price,
			PreviousBidID:  nil,
		}
		err = db.BidModel(nil).Save(newBid)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		buyer, _ := db.UserModel(nil).GetByCompany(receiverID)
		sendNotifCounterBid(scx.User.UserProfile.FullName(), buyer.ID, scx.Trade.ID)
	}

	ctx.JSON(http.StatusOK, SuccessTrueMessage)
}

func sendNotifCounterBid(initiatorName string, toUserID uint, trID uint) {
	notification := NotificationStruct{
		ReceiverID: toUserID,
		Message: &NotificationMessageStruct{
			Initiator: initiatorName,
			Type:      TRADE_BID_COUNTERED_NOTIF,
			Data:      GetTradeIdString(trID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)
}


//TODO change for public tr

// Bid Accept godoc
// @Summary accept bid
// @Description accept bid
// @Tags trade
// @Produce  json
// @Param id path uint true "ID"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/bid/accept/ [put]
func (a *tradeApi) BidAccept(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	if scx.Trade.Status != TRADE_STATUS_NEW {
		HandleError(ctx, errors.New("wrong trade status"), nil, "")
		return
	}

	if scx.Trade.SellerID == nil &&
		scx.Trade.BuyerID == nil {
		HandleError(ctx, errors.New("trade is not private"), nil, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to this trade"), nil, "")
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "bid counter",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	lastBid, hasItem := db.BidModel(nil).GetLastBid(scx.Trade.ID)
	if hasItem {
		log.Info("has item ", lastBid.Status)

		if lastBid.ToCompanyID != scx.User.CompanyID {
			HandleError(ctx, errors.New("user can accept bids from counterparty only, not own"), contextLogger, "")
			return
		}

		tr := scx.Trade
		user := scx.User

		counterparty := tr.OwnerID
		if tr.OwnerID == *tr.SellerID {
			counterparty = *tr.BuyerID
		} else {
			counterparty = *tr.SellerID
		}
		err = a.hl.CreateTrade(tr.OwnerID, user.UserProfile.FullName(), tr.ID, counterparty, tr.TradeItem.ValidateDate, tr.TradeItem.RequestType, tr.TradeItem.Incoterm)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}

		tx := db.Connection.Begin()
		defer tx.Commit()

		scx.Trade.Status = TRADE_STATUS_DEAL
		err = db.TradeModel(nil).Save(tr)
		if HandleError(ctx, err, contextLogger, "") {
			tx.Rollback()
			return
		}

		scx.Trade.TradeItem.Price = lastBid.Price
		err = db.TradeItemModel(tx).Save(&scx.Trade.TradeItem)
		if HandleError(ctx, err, contextLogger, "") {
			tx.Rollback()
			return
		}

		lastBid.Status = BID_STATUS_ACCEPTED
		err := db.BidModel(tx).Save(lastBid)
		if HandleError(ctx, err, contextLogger, "") {
			tx.Rollback()
			return
		}

		if tr.TradeItem.InspectionID != nil {
			inspCompany, err := db.CompanyModel(nil).Get(*tr.TradeItem.InspectionID)
			if HandleError(ctx, err, contextLogger, "") {
				tx.Rollback()
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
		if user.CompanyID == *tr.SellerID {
			notification.ReceiverID = *tr.BuyerID
		} else {
			notification.ReceiverID = *tr.SellerID
		}
		SendNotification(&notification)

		receiver, _ := db.UserModel(nil).GetByCompany(lastBid.FromCompanyID)
		notificationBid := NotificationStruct{
			ReceiverID: receiver.ID,
			Message: &NotificationMessageStruct{
				Initiator: scx.User.UserProfile.FullName(),
				Type:      TRADE_BID_ACCEPTED,
				Data:      GetTradeIdString(tr.ID),
				Date:      time.Now(),
			},
		}
		SendNotification(&notificationBid)

	} else {
		HandleError(ctx, errors.New("trade doesn't have bids"), contextLogger, "")
		return
	}

	ctx.JSON(http.StatusOK, SuccessTrueMessage)
}


// Bid Decline godoc
// @Summary decline bid
// @Description decline bid
// @Tags trade
// @Produce  json
// @Param id path uint true "ID"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/bid/decline/ [put]
func (a *tradeApi) BidDecline(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	if scx.Trade.Status != TRADE_STATUS_NEW {
		HandleError(ctx, errors.New("wrong trade status"), nil, "")
		return
	}

	if scx.Trade.SellerID == nil &&
		scx.Trade.BuyerID == nil {
		HandleError(ctx, errors.New("trade is not private"), nil, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to this trade"), nil, "")
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "bid counter",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	lastBid, hasItem := db.BidModel(nil).GetLastBid(scx.Trade.ID)
	if hasItem {
		if lastBid.ToCompanyID != scx.User.CompanyID {
			HandleError(ctx, errors.New("user can decline bids from counterparty only, not own"), contextLogger, "")
			return
		}
		lastBid.Status = BID_STATUS_DECLINED
		err := db.BidModel(nil).Save(lastBid)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}

		receiver, _ := db.UserModel(nil).GetByCompany(lastBid.FromCompanyID)
		notificationBid := NotificationStruct{
			ReceiverID: receiver.ID,
			Message: &NotificationMessageStruct{
				Initiator: scx.User.UserProfile.FullName(),
				Type:      TRADE_BID_DECLINED_NOTIF,
				Data:      GetTradeIdString(scx.Trade.ID),
				Date:      time.Now(),
			},
		}
		SendNotification(&notificationBid)

	} else {
		HandleError(ctx, errors.New("trade doesn't have bids"), contextLogger, "")
		return
	}

	ctx.JSON(http.StatusOK, SuccessTrueMessage)
}

// Bid Get All godoc
// @Summary get all bids
// @Description accept bid
// @Tags trade
// @Produce  json
// @Param id path uint true "ID"
// @Success 200 {object} api.BidsResultMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/bid/ [get]
func (a *tradeApi) BidGetAll(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	if scx.Trade.Status != TRADE_STATUS_NEW {
		HandleError(ctx, errors.New("wrong trade status"), nil, "")
		return
	}

	if scx.Trade.SellerID == nil ||
		scx.Trade.BuyerID == nil {
		HandleError(ctx, errors.New("trade is not private"), nil, "")
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to this trade"), nil, "")
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "bid counter",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	bids, err := db.BidModel(nil).GetAllBids(scx.Trade.ID)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	bidsResult := []db.Bid{}
	prevReceiver := uint(0)
	for i, bid := range bids {
		if i == 0 {
			bidsResult = append(bidsResult, bid)
			prevReceiver = bid.ToCompanyID
		} else {
			if bid.ToCompanyID != prevReceiver {
				bidsResult = append(bidsResult, bid)
				break
			}
		}
	}

	ctx.JSON(http.StatusOK, BidsResultMessage{
		Bids: bidsResult,
	})
}
