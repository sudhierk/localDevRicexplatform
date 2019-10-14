package api

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"

	"gitlab.com/riceexchangeplatform/riceex-backend/responses"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

type companyApi struct {
	*auth
}

func (a *companyApi) Routes(r gin.IRoutes) {
	r.GET("", a.List)
	r.GET("/inspections", a.Inspections)

	rr := r.Use(a.PlatformAdminChecker())
	rr.GET("/getAllCompanies", a.getAllCompanies)
	rr.PUT("/blockCompany/:companyId", a.blockCompany)

	rrr := r.Use(a.CompanyOrPlatformAdminChecker())
	rrr.GET("/getUsers/:companyId", a.getAllUsersByCompany)

}

// Get All Companies godoc
// @Summary Get All Companies
// @Description Get All Companies
// @Tags company
// @Accept json
// @Produce json
// @Param skip query string false "Skip"
// @Param take query string false "Take"
// @Param order query string false "Order"
// @Param findForNewKycOnly query bool false "Company only with new KYCs would be found"
// @Success 200 {object} api.CompaniesCountMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /company/getCompanies/ [get]
func (a *companyApi) getAllCompanies(ctx *gin.Context) {
	skip := ctx.Request.URL.Query().Get("skip")
	take := ctx.Request.URL.Query().Get("take")
	sortOrder := ctx.Request.URL.Query().Get("order")
	findForNewKycOnlyS := ctx.Request.URL.Query().Get("findForNewKycOnly")

	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":       "get all companies by platform admin",
		"user":      user.ID,
		"company":   user.CompanyID,
		"skip":      skip,
		"take":      take,
		"sortOrder": sortOrder,
	})

	var companies []db.Company
	var count uint
	if findForNewKycOnlyS != "" {
		findForNewKycOnly, err := strconv.ParseBool(findForNewKycOnlyS)
		if HandleError(ctx, err, nil, "") {
			return
		}
		companies, count, err = db.CompanyModel(nil).FindByKYC(*user, findForNewKycOnly, skip, take, sortOrder)
		if HandleError(ctx, err, nil, "") {
			return
		}

	} else {
		companies, count, err = db.CompanyModel(nil).Find(*user, skip, take, sortOrder)
		if HandleError(ctx, err, nil, "") {
			return
		}
	}

	count = uint(len(companies))
	contextLogger.Info("Count:", len(companies))
	ctx.JSON(http.StatusOK, CompaniesCountMessage{
		Companies: companies,
		Count:     count,
	})

}

// Get All Users godoc
// @Summary Get All Users
// @Description Get All Users
// @Tags company
// @Accept json
// @Produce json
// @Param companyId path string true "Company id"
// @Success 200 {object} api.UsersCountMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /company/getUsers/{companyId} [get]
func (a *companyApi) getAllUsersByCompany(ctx *gin.Context) {

	companyId, err := a.getId(ctx, "companyId")
	if HandleError(ctx, err, nil, "") {
		return
	}

	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "get all companies by platform admin",
		"user":    user.ID,
		"company": user.CompanyID,
	})

	users, count, err := db.UserModel(nil).GetUsersByCompany(uint(companyId))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("Count:", len(users))
	ctx.JSON(http.StatusOK, UsersCountMessage{
		Users: users,
		Count: count,
	})

}

// Block company godoc
// @Summary Block company
// @Description Block company
// @Tags company
// @Accept json
// @Produce json
// @Param req body requests.BlockCompanyRequest true "Block"
// @Param companyId path string true "Company ID"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /company/{companyId}/block/ [put]
func (a *companyApi) blockCompany(ctx *gin.Context) {

	var req = requests.BlockCompanyRequest{}
	err := ctx.Bind(&req)
	if err != nil {
		HandleError(ctx, error_InvalidRequest, nil, error_InvalidRequest.Error())
		return
	}

	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	id, err := a.getId(ctx, "companyId")

	contextLogger := log.WithFields(log.Fields{
		"api":       "Block company",
		"user":      user.ID,
		"block":     req.Block,
		"companyId": id,
	})

	tx := db.Connection.Begin()
	defer tx.Commit()

	company, err := db.CompanyModel(tx).Get(uint(id))
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	company.Blocked = req.Block

	err = db.CompanyModel(tx).Save(company)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	u, err := db.UserModel(tx).GetByCompany(company.ID)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}
	if req.Block {
		u.Status = constants.USER_STATUS_COMPANY_BLOCKED
	}

	err = db.UserModel(tx).Save(u)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	ctx.JSON(http.StatusOK, SuccessOkMessage)

}

// Companies list godoc
// @Summary Companies list
// @Description Companies list
// @Tags company
// @Accept  json
// @Produce  json
// @Success 200 {object} api.CompaniesMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /company/ [get]
func (a *companyApi) List(ctx *gin.Context) {
	search := strings.ToLower(ctx.Request.URL.Query().Get("search"))

	companyId, ok := ctx.Get("CompanyID")
	if !ok {
		HandleError(ctx, errors.New("invalid Company ID"), nil, "")
		return
	}

	companies, err := db.CompanyModel(nil).GetCounterParties(companyId.(uint), search)
	if HandleError(ctx, err, nil, "") {
		return
	}

	results := make([]responses.CompaniesList, 0)
	for _, company := range companies {
		results = append(results, responses.CompaniesList{company.ID, company.Name, company.Country, company.Tax})
	}

	ctx.JSON(http.StatusOK, CompaniesMessage{
		Companies: results,
	})
}

// Inspections companies godoc
// @Summary Inspections companies
// @Description Inspections companies
// @Tags company
// @Accept  json
// @Produce  json
// @Success 200 {object} api.InspectionsCompaniesMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /company/inspections [get]
func (a *companyApi) Inspections(ctx *gin.Context) {

	companyId, ok := ctx.Get("CompanyID")
	if !ok {
		HandleError(ctx, errors.New("invalid Company ID"), nil, "")
		return
	}

	companies, err := db.CompanyModel(nil).GetByType(companyId.(uint), COMPANY_INSPECTION)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, InspectionsCompaniesMessage{
		Companies: companies,
	})
}

func (a *companyApi) user(ctx *gin.Context) (user *db.User, err error) {

	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), false, true, false)
	return
}

func (a *companyApi) getId(ctx *gin.Context, idKey string) (id int, err error) {

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
