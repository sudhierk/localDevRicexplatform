package api

import (
	"errors"
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"
	"net/http"

	"time"

	"github.com/gin-gonic/gin"
	"github.com/sanity-io/litter"
	log "github.com/sirupsen/logrus"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	"gitlab.com/riceexchangeplatform/riceex-backend/responses"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"
)

// Create comment godoc
// @Summary Create comment
// @Description Create comment
// @Tags trade
// @Accept  json
// @Produce  json
// @Param id path uint true "ID"
// @Param comment body requests.CreateComment true "Create Comment"
// @Success 200 {object} api.GetBillMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/comments [post]
func (a *tradeApi) CreateComment(ctx *gin.Context) {
	//TODO checks if can add to parent
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	if TRADE_STATUSES[scx.Trade.Status] >= TRADE_STATUSES[TRADE_STATUS_SIGNED] {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), nil, "")
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":   "create comment",
		"user":  scx.User.ID,
		"trade": scx.Trade.ID,
	})

	var json = requests.CreateComment{}
	err = ctx.Bind(&json)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	cm := &db.Comment{
		RequestID: scx.Trade.ID,
		ParentID:  json.ParentID,
		UserID:    scx.User.ID,
		Text:      json.Text,
	}

	contextLogger.Info(litter.Sdump(json))

	err = db.CommentsModel(nil).Save(cm)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notificationReceiverId := scx.Trade.OwnerID
	if scx.User.CompanyID == scx.Trade.OwnerID {
		if cm.ParentID != nil {
			parentComment, err := db.CommentsModel(nil).Get(*cm.ParentID)
			if HandleError(ctx, err, contextLogger, "") {
				return
			}
			notificationReceiverId = parentComment.UserID
		} else {
			if scx.Trade.SellerID != nil && scx.Trade.BuyerID != nil {
				if scx.Trade.OwnerID == *scx.Trade.SellerID {
					notificationReceiverId = *scx.Trade.BuyerID
				} else {
					notificationReceiverId = *scx.Trade.SellerID
				}
			}
		}
	} else {
		notificationReceiverId = scx.Trade.OwnerID
	}
	notification := NotificationStruct{
		ReceiverID: notificationReceiverId,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      COMMENT_ADDED_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	if notificationReceiverId != scx.User.ID {
		SendNotification(&notification)
	}

	ctx.JSON(http.StatusOK, TradeCommentMessage {
	    Comment: json,
	})
}

// Get comments godoc
// @Summary Get comments
// @Description Get comments
// @Tags trade
// @Accept  json
// @Produce  json
// @Param id path uint true "ID"
// @Success 200 {object} api.TradeCommentsMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/comments [get]
func (a *tradeApi) GetComments(ctx *gin.Context) {
	// TODO check accesss
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	comments, err := db.CommentsModel(nil).GetTree(scx.Trade.ID, scx.Trade.OwnerID, scx.User.CompanyID)
	if HandleError(ctx, err, nil, "") {
		return
	}

	results := make([]responses.ResponseComment, 0)
	for _, c := range comments {
		results = append(results, responses.GetResponseComment(c))
	}

	ctx.JSON(http.StatusOK, CommentsMessage{
		Comments: results,
	})
}
