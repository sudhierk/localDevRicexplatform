package api

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sanity-io/litter"
	log "github.com/sirupsen/logrus"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"
)

type userProfileApi struct {
	*auth
}

func (a *userProfileApi) Routes(r gin.IRoutes) {

	r.GET("/", a.get)
	r.PUT("/updatePhone/", a.updatePhone)

}

// Get userProfile godoc
// @Summary Get userProfile
// @Description Get userProfile
// @Tags userProfile
// @Accept json
// @Produce json
// @Success 200 {object} api.UpdateInvoiceMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /userProfile/ [get]
func (a *userProfileApi) get(ctx *gin.Context) {

	user, err := a.user(ctx, true, true)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, UserProfileMessage{
		Id:          user.ID,
		Email:       user.Email,
		Role:        "USER",
		Company:     user.Company.Name,
		UserProfile: user.UserProfile,
	})
}

// Update phone godoc
// @Summary Update phone
// @Description Update phone in userProfile
// @Tags userProfile
// @Accept json
// @Produce json
// @Param req body requests.UpdatePhoneUserProfile true "Phone"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /userProfile/updatePhone [put]
func (a *userProfileApi) updatePhone(ctx *gin.Context) {

	var req = requests.UpdatePhoneUserProfile{}
	err := ctx.Bind(&req)
	if err != nil {
		HandleError(ctx, error_InvalidRequest, nil, error_InvalidRequest.Error())
		return
	}

	user, err := a.user(ctx, true, false)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":  "Update Phone",
		"user": user.ID,
	})

	contextLogger.Debug(litter.Sdump(req))

	user.UserProfile.Phone = req.Phone

	err = db.UserProfileModel(nil).Save(&user.UserProfile)

	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, SuccessOkMessage)
}

func (a *userProfileApi) user(ctx *gin.Context, preloadProfile, prelaodCompany bool) (user *db.User, err error) {

	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), preloadProfile, prelaodCompany, false)
	if HandleError(ctx, err, nil, "") {
		return
	}
	return
}
