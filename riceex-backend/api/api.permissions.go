package api

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

type permissionsApi struct {
	*auth
}

//add middleware to block user's rules to authorizationChecker

func (a *permissionsApi) Routes(r gin.IRoutes) {

	r.GET("/", a.get)

	rr := r.Use(a.CompanyOrPlatformAdminChecker())
	rr.GET("/getByUser/:userId", a.getByUserId)
	rr.PUT("/setByUser/:userId", a.updateByUserId)

}

// Get Permissions godoc
// @Summary Get Permissions
// @Description Get Permissions.  For every permission O means no rights, 1 - can_read, 2 -can_write
// @Tags permissions
// @Accept json
// @Produce json
// @Param userId path string true "User id"
// @Success 200 {object} db.Permission
// @Failure 500 {object} api.ErrorMessage
// @Router /permissions/ [get]
func (a *permissionsApi) get(ctx *gin.Context) {

	u, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	perm := u.Permission
	if HandleError(ctx, err, nil, "") {
		return
	}
	ctx.JSON(http.StatusOK, perm)
}

// Get Permissions godoc
// @Summary Get Permissions
// @Description Get Permissions.  For every permission O means no rights, 1 - can_read, 2 -can_write
// @Tags permissions
// @Accept json
// @Produce json
// @Param userId path string true "User id"
// @Success 200 {object} db.Permission
// @Failure 500 {object} api.ErrorMessage
// @Router /permissions/getByUser/{userId} [get]
func (a *permissionsApi) getByUserId(ctx *gin.Context) {

	userId, err := a.getId(ctx, "userId")
	if HandleError(ctx, err, nil, "") {
		return
	}

	user, err := db.UserModel(nil).Get(uint(userId), false, false, true)
	if HandleError(ctx, err, nil, "") {
		return
	}
	perm := user.Permission
	if HandleError(ctx, err, nil, "") {
		return
	}
	ctx.JSON(http.StatusOK, perm)
}

// Update Permissions by UserId godoc
// @Summary Update Permissions by UserId
// @Description Update Permissions by UserId. For every permission O means no rights, 1 - can_read, 2 -can_write
// @Tags permissions
// @Accept json
// @Produce json
// @Param req body db.Permission true "Permission"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /permissions/setByUser/{userId} [get]
func (a *permissionsApi) updateByUserId(ctx *gin.Context) {
	userId, err := a.getId(ctx, "userId")
	if HandleError(ctx, err, nil, "") {
		return
	}

	var req = db.Permission{}
	err = ctx.Bind(&req)
	if err != nil {
		HandleError(ctx, error_InvalidRequest, nil, error_InvalidRequest.Error())
		return
	}

	user, err := db.UserModel(nil).Get(uint(userId), false, false, true)
	if HandleError(ctx, err, nil, "") {
		return
	}

	user.Permission.SignContract = req.SignContract
	user.Permission.ShippingAdvice = req.ShippingAdvice
	user.Permission.PaymentConfirmation = req.PaymentConfirmation
	user.Permission.NominateVessel = req.NominateVessel
	user.Permission.InviteRequest = req.InviteRequest
	user.Permission.InviteCounterOffer = req.InviteCounterOffer
	user.Permission.DocumentaryInstructions = req.DocumentaryInstructions
	user.Permission.DeclineRequest = req.DeclineRequest
	user.Permission.ClosingTrade = req.ClosingTrade
	user.Permission.AddComment = req.AddComment
	user.Permission.AcceptRequest = req.AcceptRequest

	err = db.UserModel(nil).Save(user)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": "ok",
	})
}

func (a *permissionsApi) user(ctx *gin.Context) (user *db.User, err error) {

	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), false, true, true)
	return
}

func (a *permissionsApi) getId(ctx *gin.Context, idKey string) (id int, err error) {

	idStr, ok := ctx.Params.Get(idKey)
	if !ok {
		err = errors.New("invalid " + idKey)
		return
	}

	id, err = strconv.Atoi(idStr)
	if err != nil {
		return
	}
	return
}
