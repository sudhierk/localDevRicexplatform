package api

import (
	"errors"
	"net/http"

	"os"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"
	"gitlab.com/riceexchangeplatform/riceex-backend/services"
	"gitlab.com/riceexchangeplatform/riceex-backend/tools"
)

type companyAdminApi struct {
}

func (a *companyAdminApi) Routes(r gin.IRoutes) {
	r.POST("/inviteEmployee", a.InviteEmployee)
}

// Company Admin godoc
// @Summary Invite employee
// @Description Invite employee
// @Tags company admin
// @Accept  json
// @Produce  json
// @Param invite body requests.InviteUserRequest true "Account"
// @Success 200 {object} api.CompaniesMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /companyAdmin/inviteEmployee [post]
func (a *companyAdminApi) InviteEmployee(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	var req = &requests.InviteUserRequest{}
	err = ctx.Bind(req)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":   "company admin invite user",
		"email": req.Email,
	})

	_, err = db.InviteModel(nil).GetByEmail(req.Email)
	if err == nil {
		HandleError(ctx, errors.New("user already invited"), contextLogger, "")
		return
	}

	_, err = db.UserModel(nil).GetByEmail(req.Email)
	if err == nil {
		HandleError(ctx, errors.New("user already registered in the application"), contextLogger, "")
		return
	}

	invite := &db.Invite{}
	invite.CompanyID = user.CompanyID
	invite.Email = req.Email
	invite.UserType = USER_TYPE_COMPANY_EMPLOYEE
	invite.CompanyAdminID = user.ID
	invite.Code, _ = tools.GenerateBase64ID(24)

	if os.Getenv("ENV") != ENV_TEST {
		err = services.Mail.SendInvite(req.Email, invite.Code, user.Company.Name)
		if err != nil {
			HandleError(ctx, err, contextLogger, "")
			return
		}
	}

	err = db.InviteModel(nil).Save(invite)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, SuccessOkMessage)
}

func (a *companyAdminApi) user(ctx *gin.Context) (user *db.User, err error) {
	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), false, true, false)
	return
}
