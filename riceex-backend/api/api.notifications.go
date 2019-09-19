package api

import (
	"errors"

	"net/http"

	"strconv"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/services"
)

type notificationsApi struct {
	*auth
	hl *services.HyperledgerApiStruct
}

func (n *notificationsApi) Routes(r gin.IRoutes) {
	r.GET("/", n.GetAll)
	r.PUT("/:id", n.Update)
	r.DELETE("/:id", n.Delete)
	r.DELETE("/", n.DeleteAll)
	r.PUT("/", n.MarkAllAsRead)
}

// Mark all as read godoc
// @Summary Mark all as read
// @Tags notifications
// @Accept json
// @Produce json
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /notifications/ [put]
func (a *notificationsApi) MarkAllAsRead(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	err = db.NotificationModel(nil).MarkAllAsRead(user.ID)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, SuccessTrueMessage)
}

// Get all godoc
// @Summary Get all
// @Description Get all
// @Tags notifications
// @Accept json
// @Produce json
// @Param reportId path string false "skip"
// @Param reportId path string false "take"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /notifications/{skip}&{take} [get]
func (a *notificationsApi) GetAll(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	skip := ctx.Request.URL.Query().Get("skip")
	take := ctx.Request.URL.Query().Get("take")

	notifications, count, err := db.NotificationModel(nil).GetForUserID(user.ID, skip, take)
	if HandleError(ctx, err, nil, "") {
		return
	}

	unread, err := db.NotificationModel(nil).GetUnreadForUserID(user.ID)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, NotificationMessage{
		Notofications: notifications,
		Count:         count,
		Unread:        unread,
	})
}

// Update godoc
// @Summary Update
// @Description Update
// @Tags notifications
// @Accept json
// @Produce json
// @Param id path string true "ID"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /notifications/{id} [put]
func (a *notificationsApi) Update(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	idStr, ok := ctx.Params.Get("id")
	if !ok {
		err = errors.New("invalid Notification ID")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return
	}

	notification, err := db.NotificationModel(nil).Get(uint(id))
	if HandleError(ctx, err, nil, "") {
		return
	}

	log.Info(user.ID)
	if notification.ReceiverID != user.ID {
		HandleError(ctx, errors.New("wrong access"), nil, "")
		return
	}

	notification.Read = true
	err = db.NotificationModel(nil).Save(notification)

	ctx.JSON(http.StatusOK, SuccessTrueMessage)
}

// Delete godoc
// @Summary Delete
// @Description Delete
// @Tags notifications
// @Accept json
// @Produce json
// @Param id path string true "ID"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /notifications/{id} [delete]
func (a *notificationsApi) Delete(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	idStr, ok := ctx.Params.Get("id")
	if !ok {
		err = errors.New("invalid Notification ID")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return
	}

	notification, err := db.NotificationModel(nil).Get(uint(id))
	if HandleError(ctx, err, nil, "") {
		return
	}

	log.Info(user.ID)
	if notification.ReceiverID != user.ID {
		HandleError(ctx, errors.New("wrong access"), nil, "")
		return
	}

	err = db.NotificationModel(nil).Delete(notification)

	ctx.JSON(http.StatusOK, SuccessTrueMessage)
}

// Delete All godoc
// @Summary Delete All
// @Description Delete All
// @Tags notifications
// @Accept json
// @Produce json
// @Param id path string true "ID"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /notifications/ [delete]
func (a *notificationsApi) DeleteAll(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	err = db.NotificationModel(nil).DeleteAll(user.ID)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, SuccessTrueMessage)
}

func (a *notificationsApi) user(ctx *gin.Context) (user *db.User, err error) {
	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), false, false, false)
	return
}
