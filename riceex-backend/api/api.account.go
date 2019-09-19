package api

import (
	"errors"

	"net/http"
	"strings"

	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"

	"strconv"

	"os"

	"github.com/gin-gonic/gin"
	"github.com/sanity-io/litter"
	log "github.com/sirupsen/logrus"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/jwtApiKeys"
	. "gitlab.com/riceexchangeplatform/riceex-backend/requests"
	"gitlab.com/riceexchangeplatform/riceex-backend/services"
	"gitlab.com/riceexchangeplatform/riceex-backend/tools"
	"golang.org/x/crypto/bcrypt"
)

var (
	StatusRegistrationEmailExist = "registration_email_exist"
	StatusUserNotExist           = "login_user_not_exist"
	StatusIncorrectLogin         = "login_incorrect"
	StatusInvalidEmail           = "login_invalid_email"
	StatusCompanyExist           = "registration_company_name_exist"
	StatusAccountIsNotActive     = "login_account_not_active"
	StatusForgotPassword         = "forgot_password"
)

type accountApi struct {
	*auth
	hl *services.HyperledgerApiStruct
}

func (a *accountApi) Routes(r gin.IRoutes) {
	r.POST("/register/", a.register)
	r.POST("/registerByInvite/", a.registerByInvite)
	r.POST("/update/:code", a.verifyCode)
	r.POST("/login/", a.login)
	r.POST("/forgot/", a.forgot)
	r.GET("/status/:id", a.status)
	r.GET("/update/:code", a.checkCode)

	rr := r.Use(a.AuthorizationChecker())
	rr.GET("/", a.Account)
	rr.GET("/refresh-token", a.Refresh)
}

// Register godoc
// @Summary Register account
// @Description registers account
// @Tags accounts
// @Accept  json
// @Produce  json
// @Param account body requests.AccountRegisterRequest true "Account"
// @Success 200 {object} api.CanConfirmMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/register [post]
func (a *accountApi) register(ctx *gin.Context) {
	var req = &AccountRegisterRequest{}
	err := ctx.Bind(&req)
	if HandleError(ctx, err, nil, "") {
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":   "account create",
		"email": req.User.Email,
	})

	contextLogger.Debug(litter.Sdump(req))

	email := strings.ToLower(req.User.Email)
	if email == "" {
		HandleError(ctx, errors.New("invalid email address"), contextLogger, StatusInvalidEmail)
		return
	}

	user, err := db.UserModel(nil).GetByEmail(email)
	if user.ID != 0 {
		HandleError(ctx, errors.New("user already exist"), contextLogger, StatusRegistrationEmailExist)
		return
	}

	user = &db.User{
		Status: USER_STATUS_WAITING_FOR_EMAIL_VERIFICATION,
		Email:  email,
	}
	user.Code, _ = tools.GenerateBase64ID(24)

	companyIsUnique, err := db.CompanyModel(nil).CheckUnique(req.Company.Name, req.Company.TaxNumber, req.Company.Country)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	if !companyIsUnique {
		HandleError(ctx, errors.New("company exist"), contextLogger, StatusCompanyExist)
		return
	}

	user.Company = db.Company{
		Name:        req.Company.Name,
		Country:     req.Company.Country,
		Site:        req.Company.Site,
		Tax:         req.Company.TaxNumber,
		City:        req.Company.City,
		Phone:       req.Company.Phone,
		Address1:    req.Company.Address1,
		Address2:    req.Company.Address2,
		Contact:     req.Company.ContactPerson,
		CompanyType: strings.ToUpper(req.Company.CompanyType),
	}

	user.UserProfile = db.UserProfile{
		FirstName:   req.User.FirstName,
		LastName:    req.User.LastName,
		CompanyRole: req.User.CompanyRole,
		Phone:       req.User.Phone,
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	user.Permission = db.Permission{}
	err = db.PermissionModel(nil).Save(&user.Permission)
	if err != nil {
		tx.Rollback()
		HandleError(ctx, err, contextLogger, "")
		return
	}

	err = db.UserModel(tx).Create(user)

	if err != nil {
		HandleError(ctx, err, contextLogger, "")
		return
	}

	if os.Getenv("ENV") != ENV_TEST {
		err = services.Mail.SendActivation(user.UserProfile.FirstName, user.Email, user.Code)
		if err != nil {
			HandleError(ctx, err, contextLogger, "")
			tx.Rollback()
			return
		}
	}

	contextLogger.Info("successful")
	ctx.JSON(http.StatusOK, IDMessage{
		ID: user.ID,
	})
}

// Register godoc
// @Summary Register account by invite
// @Description registers account by invite
// @Tags accounts
// @Accept  json
// @Produce  json
// @Param account body requests.AccountRegisterByInviteRequest true "Account"
// @Success 200 {object} api.LoginMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/registerByInvite [post]
func (a *accountApi) registerByInvite(ctx *gin.Context) {
	var req = &AccountRegisterByInviteRequest{}
	err := ctx.Bind(&req)
	if HandleError(ctx, err, nil, "") {
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":   "account create",
		"email": req.User.Email,
	})

	invite, err := db.InviteModel(nil).GetByCode(req.Code)
	if err != nil {
		HandleError(ctx, errors.New("invalid registration code"), contextLogger, StatusInvalidEmail)
		return
	}

	contextLogger.Debug(litter.Sdump(req))

	user, err := db.UserModel(nil).GetByEmail(invite.Email)
	if user.ID != 0 {
		HandleError(ctx, errors.New("user already exist"), contextLogger, StatusRegistrationEmailExist)
		return
	}

	user = &db.User{
		Status:   USER_STATUS_ACTIVE,
		Email:    invite.Email,
		UserType: invite.UserType,
	}

	user.UserProfile = db.UserProfile{
		FirstName:   req.User.FirstName,
		LastName:    req.User.LastName,
		CompanyRole: req.User.CompanyRole,
		Phone:       req.User.Phone,
	}

	user.CompanyID = invite.CompanyID

	tx := db.Connection.Begin()

	user.Permission = db.Permission{}
	err = db.PermissionModel(nil).Save(&user.Permission)
	if err != nil {
		tx.Rollback()
		HandleError(ctx, err, contextLogger, "")
		return
	}

	err = db.UserModel(tx).Create(user)
	if err != nil {
		tx.Rollback()
		HandleError(ctx, err, contextLogger, "")
		return
	}

	invite.Accepted = true
	err = db.InviteModel(tx).Save(invite)
	if err != nil {
		tx.Rollback()
		HandleError(ctx, err, contextLogger, "")
		return
	}

	user.PasswordHash, err = HashPassword(req.Password)

	log.Debug(req.PublicKey)
	pkcs1RSAPublicKey, _ := pem.Decode([]byte(req.PublicKey))
	pub, err := x509.ParsePKIXPublicKey(pkcs1RSAPublicKey.Bytes)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}
	_, ok := pub.(*rsa.PublicKey)
	if !ok {
		tx.Rollback()
		HandleError(ctx, errors.New("wrong pub key format, must be rsa "), contextLogger, "")
	}
	user.PublicKey = req.PublicKey

	err = db.UserModel(tx).Save(user)

	if err != nil {
		tx.Rollback()
		HandleError(ctx, err, contextLogger, "")
		return
	}

	company, err := db.CompanyModel(nil).Get(user.CompanyID)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	if os.Getenv("ENV") != ENV_TEST {
		if company.Identity == "" {

			card, err := a.hl.RegisterCompany(company.ID, company.Name)
			if HandleError(ctx, err, contextLogger, "") {
				tx.Rollback()
				return
			}

			company.Identity = string(company.ID)
			company.Card = card

			if err = db.CompanyModel(nil).Save(company); err != nil {
				tx.Rollback()
				HandleError(ctx, err, contextLogger, "")
				return
			}
			contextLogger.Info("company identity saved", user.Email)
		}
	}

	tx.Commit()

	token, _ := jwtApiKeys.ApiKeys.CreateToken(user, user.CompanyID)
	ctx.JSON(http.StatusOK, LoginMessage{
		Token:       token,
		CompanyType: user.Company.CompanyType,
		UserType:    user.UserType,
	})
}

// Status godoc
// @Summary Show status
// @Description show status by ID
// @Tags accounts
// @Accept  json
// @Produce  json
// @Param id path int true "Account ID"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/status/{id} [get]
func (a *accountApi) status(ctx *gin.Context) {
	idStr, ok := ctx.Params.Get("id")
	if !ok {
		HandleError(ctx, errors.New("wrong ID"), nil, "")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return
	}

	user, err := db.UserModel(nil).Get(uint(id), false, false, false)
	if HandleError(ctx, err, nil, "") {
		return
	}
	ctx.JSON(http.StatusOK, StatusMessage{
		Status: user.Status,
	})
}

// Verify Code godoc
// @Summary Verifies code
// @Description verifies code
// @Tags accounts
// @Accept  json
// @Produce  json
// @Param code path string true "Account Code"
// @Param code body requests.AccountPasswordUpdateRequest true "Account update requests"
// @Success 200 {object} api.CanConfirmMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/update/{code} [get]
func (a *accountApi) checkCode(ctx *gin.Context) {
	code, ok := ctx.Params.Get("code")
	if !ok {
		HandleError(ctx, error_InvalidRequest, nil, error_InvalidRequest.Error())
		return
	}

	var req = &AccountPasswordUpdateRequest{}
	err := ctx.Bind(&req)
	if HandleError(ctx, err, nil, "") {
		return
	}

	_, err = db.UserModel(nil).GetByActivation(code)
	if err != nil {
		ctx.JSON(http.StatusOK, CanConfirmMessage{
			CanConfirm: false,
		})
	} else {
		ctx.JSON(http.StatusOK, CanConfirmMessage{
			CanConfirm: true,
		})
	}
}

// Check Code godoc
// @Summary Check code
// @Description checks code
// @Tags accounts
// @Accept  json
// @Produce  json
// @Param code path string true "Account Code"
// @Param code body requests.AccountPasswordUpdateRequest true "Account update request"
// @Success 200 {object} api.CanConfirmMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/update/{code} [post]
func (a *accountApi) verifyCode(ctx *gin.Context) {
	code, ok := ctx.Params.Get("code")
	if !ok {
		HandleError(ctx, error_InvalidRequest, nil, error_InvalidRequest.Error())
		return
	}

	var req = &AccountPasswordUpdateRequest{}
	err := ctx.Bind(&req)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":  "verify code",
		"code": code,
	})

	contextLogger.Debug("verifyCode pswd:", req.Password)
	contextLogger.Debug("verifyCode pubkey:", req.PublicKey)

	user, err := db.UserModel(nil).GetByActivation(code)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("user:", user.Email)
	tx := db.Connection.Begin()
	defer tx.Commit()

	user.Status = USER_STATUS_ACTIVE
	user.Code = ""
	user.PasswordHash, err = HashPassword(req.Password)
	if user.PublicKey == "" {
		pkcs1RSAPublicKey, _ := pem.Decode([]byte(req.PublicKey))
		pub, err := x509.ParsePKIXPublicKey(pkcs1RSAPublicKey.Bytes)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		_, ok := pub.(*rsa.PublicKey)
		if !ok {
			HandleError(ctx, errors.New("wrong pub key format, must be rsa "), contextLogger, "")
		}
		user.PublicKey = req.PublicKey
	}
	err = db.UserModel(tx).Save(user)

	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	// company, err := db.CompanyModel(nil).Get(user.CompanyID)
	// if HandleError(ctx, err, contextLogger, "") {
	// 	tx.Rollback()
	// 	return
	// }

	// if os.Getenv("ENV") != ENV_TEST {
	// 	if company.Identity == "" {

	// 		card, err := a.hl.RegisterCompany(company.ID, company.Name)
	// 		if HandleError(ctx, err, contextLogger, "") {
	// 			tx.Rollback()
	// 			return
	// 		}

	// 		company.Identity = string(company.ID)
	// 		company.Card = card

	// 		if err = db.CompanyModel(nil).Save(company); err != nil {
	// 			tx.Rollback()
	// 			HandleError(ctx, err, contextLogger, "")
	// 			return
	// 		}
	// 		contextLogger.Info("company identity saved", user.Email)
	// 	}
	// }

	token, _ := jwtApiKeys.ApiKeys.CreateToken(user, user.CompanyID)
	ctx.JSON(http.StatusOK, gin.H{
		"token": token,
		"id":    user.ID,
	})
	tx.Commit()
	return
}

// Login godoc
// @Summary Login
// @Description Login  account
// @Tags accounts
// @Accept  json
// @Produce  json
// @Param account body requests.AccountLoginRequest true "Account"
// @Success 200 {object} api.LoginMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/login [post]
func (a *accountApi) login(ctx *gin.Context) {
	var json = &AccountLoginRequest{}
	err := ctx.Bind(json)
	if HandleError(ctx, err, nil, "") {
		return
	}

	log.Info("Email: ", json.Email)
	log.Debug("Password: ", json.Password)

	if json.Email == "" {
		HandleError(ctx, errors.New("invalid email address"), nil, StatusInvalidEmail)
		return
	}

	user, err := db.UserModel(nil).GetByEmail(json.Email)

	if err != nil || !CheckPasswordHash(json.Password, user.PasswordHash) {
		HandleError(ctx, errors.New("invalid Username or Password"), nil, StatusIncorrectLogin)
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":    "login",
		"email":  user.Email,
		"status": user.Status,
	})

	if user.Status != USER_STATUS_ACTIVE {
		HandleError(ctx, errors.New("account is not active"), nil, StatusAccountIsNotActive)
		return
	}

	token, _ := jwtApiKeys.ApiKeys.CreateToken(user, user.CompanyID)

	contextLogger.Info("logged in")

	if !user.IsAdmin {
		if os.Getenv("ENV") == ENV_SANDBOX {
			err = services.Mail.SendLoginNotification("customersupport@ricex.io", user.UserProfile.FirstName, user.UserProfile.LastName, user.Email)
		} else if os.Getenv("ENV") == ENV_DEV {
			err = services.Mail.SendLoginNotification("mynewqa@gmail.com", user.UserProfile.FirstName, user.UserProfile.LastName, user.Email)
		}

		if err != nil {
			log.Warn("SendLoginNotification", err)
		}
	}

	userAgent := ctx.GetHeader("User-Agent")
	err = db.UserModel(nil).UpdateUserAgent(user.ID, userAgent)
	if err != nil {
		HandleError(ctx, errors.New("can't save user-agent"), nil, "")
		return
	}

	log.Info("Login User-Agent ", user.ID, userAgent)

	ctx.JSON(http.StatusOK, LoginMessage{
		Token:       token,
		CompanyType: user.Company.CompanyType,
		UserType:    user.UserType,
	})
	return
}

// Forgot account godoc
// @Summary Forgot
// @Description Forgot  account
// @Tags accounts
// @Accept  json
// @Produce  json
// @Param account body requests.AccountForgotRequest true "Account"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/forgot [post]
func (a *accountApi) forgot(ctx *gin.Context) {
	var json = &AccountForgotRequest{}
	err := ctx.Bind(&json)
	if HandleError(ctx, err, nil, "") {
		return
	}

	email := strings.ToLower(json.Email)

	if email == "" {
		HandleError(ctx, errors.New("invalid email address"), nil, "")
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":   "forgot password",
		"email": email,
	})

	tx := db.Connection.Begin()
	defer tx.Commit()

	user, err := db.UserModel(nil).GetByEmail(email)
	log.Println("user", user)

	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	user.Code, _ = tools.GenerateBase64ID(24)
	if err = db.UserModel(tx).Save(user); err != nil {
		HandleError(ctx, err, contextLogger, "")
		tx.Rollback()
		return
	}

	err = services.Mail.SendVerification(user.Email, user.Code)
	if err != nil {
		HandleError(ctx, err, contextLogger, "")
		tx.Rollback()
		return
	}

	contextLogger.Info("activation code has been sent")
	ctx.JSON(http.StatusOK, SuccessOkMessage)
}

// Get Account godoc
// @Summary Get Account
// @Description returns account by user Id by ID
// @Tags accounts
// @Accept  json
// @Produce  json
// @Success 200 {object} api.AccountMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/ [get]
func (a *accountApi) Account(ctx *gin.Context) {

	userId, ok := ctx.Get("UserID")

	if !ok {
		HandleError(ctx, errors.New("invalid User ID"), nil, "")
		return
	}

	user, err := db.UserModel(nil).Get(userId.(uint), true, true, false)
	if HandleError(ctx, err, nil, "") {
		return
	}

	company, err := db.CompanyModel(nil).Get(user.CompanyID)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, AccountMessage{
		ID:          user.ID,
		Email:       user.Email,
		Name:        user.UserProfile.FullName(),
		CompanyType: user.Company.CompanyType,
		CompanyName: company.Name,
		UserType:    user.UserType,
	})
}

// Refresh Account godoc
// @Summary Refresh Account
// @Description Create new jwt token for account
// @Tags accounts
// @Accept  json
// @Produce  json
// @Success 200 {object} api.AccountMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /auth/refresh-token [get]
func (a *accountApi) Refresh(ctx *gin.Context) {
	userId, ok := ctx.Get("UserID")
	if !ok {
		HandleError(ctx, errors.New("invalid User ID"), nil, "")
		return
	}

	user, err := db.UserModel(nil).Get((userId).(uint), false, false, false)
	if err != nil {
		HandleError(ctx, err, nil, "")
		return
	}
	token, _ := jwtApiKeys.ApiKeys.CreateToken(user, user.CompanyID)

	contextLogger := log.WithFields(log.Fields{
		"api":   "login refresh",
		"email": user.Email,
	})

	contextLogger.Info("successful")

	ctx.JSON(http.StatusOK, TokenMessage{
		Token: token,
	})
	return
}

type AuthAdminData struct {
	Name string `json:"name"`
	Card []byte `json:"card"`
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
