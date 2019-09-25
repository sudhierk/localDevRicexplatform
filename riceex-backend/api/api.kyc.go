package api

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"github.com/twinj/uuid"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"
	"gitlab.com/riceexchangeplatform/riceex-backend/services"
	"gitlab.com/riceexchangeplatform/riceex-backend/tools"
)

type kycApi struct {
	*auth
}

func (a *kycApi) Routes(r gin.IRoutes) {

	route := r.Use(a.AuthorizationChecker())
	route.GET("/", a.getNotReviewedOrCreateNew)
	route.POST("/save/", a.save)
	route.POST("/editing/", a.editing)

	rr := route.Use(a.PlatformAdminChecker())
	rr.GET("/visit/:kycId", a.visitKyc)
	rr.PUT("/:kycId/approve", a.approve)
	rr.PUT("/:kycId/decline", a.decline)
	rr.GET("/getKYCs", a.getKYCs)
}

// Get KYC godoc
// @Summary Get KYC
// @Description Get know your customer data
// @Tags kyc
// @Accept json
// @Produce json
// @Success 200 {object} api.KYCWithCreatorMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /kyc/ [get]
func (a *kycApi) getNotReviewedOrCreateNew(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":  "Get KYC",
		"user": user.ID,
	})

	kyc, err := db.KYCModel(nil).GetNotReviewedByCompany(user.Company.ID)
	if err != nil && err.Error() != "record not found" {
		HandleError(ctx, error_InvalidRequest, nil, error_InvalidRequest.Error())
		return
	} else if err != nil {
		kyc = a.createNewKYC(ctx)
	}

	kMessage, err := a.getKYCResponse(ctx, kyc)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	ctx.JSON(http.StatusOK, kMessage)
}

// Visit KYC  godoc
// @Summary Visit KYC
// @Description Get know your customer data and set visited to true
// @Tags kyc
// @Accept json
// @Produce json
// @Param kycId path string true "kyc Id"
// @Success 200 {object} api.KYCMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /kyc/{kycId}/visit/ [get]
func (a *kycApi) visitKyc(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	kycId, err := a.getId(ctx, "kycId")
	if HandleError(ctx, err, nil, "") {
		return
	}

	kyc, err := db.KYCModel(nil).Get(int(kycId))
	if err != nil && err.Error() != "record not found" {
		HandleError(ctx, error_InvalidRequest, nil, error_InvalidRequest.Error())
		return
	} else if err != nil {
		kyc = a.createNewKYC(ctx)
	}
fmt.Println("kyc data ",kyc,)
	contextLogger := log.WithFields(log.Fields{
		"api":  "Visit KYC",
		"user": user.ID,
		"JOSN Body" : kyc,
	})

	kyc.VisitedByPlatformAdmin = true
	err = db.KYCModel(nil).Save(kyc)
	if err != nil && err.Error() != "record not found" {
		HandleError(ctx, error_InvalidRequest, contextLogger, error_InvalidRequest.Error())
		return
	} else if err != nil {
		kyc = a.createNewKYC(ctx)
	}

	kMessage, err := a.getKYCResponse(ctx, kyc)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	userWhoCreated, err := db.UserModel(nil).Get(kyc.UserWhoCreatedID, true, false, false)
	if HandleError(ctx, err, nil, "") {
		return
	}
	RegisteredUserName := userWhoCreated.UserProfile.FirstName + " " + userWhoCreated.UserProfile.LastName

	ctx.JSON(http.StatusOK, KYCWithCreatorMessage{
		RegisteredUserName: RegisteredUserName,
		Company:            kMessage.Company,
		Status:             kMessage.Status,
		Date:               kMessage.Date,
	})
}

func (a *kycApi) getKYCResponse(ctx *gin.Context, kyc *db.CompanyKYC) (*KYCMessage, error) {

	if kyc.CertificateOfIncorporation != nil {
		doc, err := db.KYCDocumentModel(nil).Get(kyc.CertificateOfIncorporationID)
		if err != nil {
			return nil, err
		}

		dat, err := ioutil.ReadFile(doc.Source)
		if err != nil {
			return nil, err
		}

		sDec := base64.StdEncoding.EncodeToString([]byte(dat))
		if err != nil {
			return nil, err
		}

		kyc.CertificateOfIncorporationName = kyc.CertificateOfIncorporation.Name
		kyc.CertificateOfIncorporationData = sDec
		kyc.CertificateOfIncorporationMime = doc.Mime
	}

	if kyc.CompanyUBOS != nil {
		uBOs := []db.CompanyUBOs{}
		err := json.Unmarshal(*kyc.CompanyUBOS, &uBOs)
		if nil != err {
			return nil, err
		}

		newUBOs := make([]requests.CompanyUBOsRequest, len(uBOs))
		for i, u := range uBOs {

			doc, err := db.KYCDocumentModel(nil).Get(u.PassportID)
			if err != nil {
				return nil, err
			}

			dat, err := ioutil.ReadFile(doc.Source)
			if err != nil {
				return nil, err
			}

			sDec := base64.StdEncoding.EncodeToString([]byte(dat))
			if err != nil {
				return nil, err
			}

			newUBOs[i].Name = u.Name
			newUBOs[i].PassportName = u.PassportName
			newUBOs[i].PassportData = sDec
			newUBOs[i].PassportMime = u.PassportMime
		}

		c, err := json.Marshal(newUBOs)
		if err != nil {
			return nil, err
		}
		kyc.CompanyUBOS = (*json.RawMessage)(&c)
	}

	kycMessage := KYCMessage{
		Company: kyc,
		Date:    kyc.Date,
		Status:  kyc.Status,
	}

	return &kycMessage, nil
}

// Save KYC godoc
// @Summary Save KYC
// @Description Save know your customer data with status SUBMIT
// @Tags kyc
// @Accept json
// @Produce json
// @Param req body requests.CompanyKYCRequest true "KYC data"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /kyc/save/ [post]
func (a *kycApi) save(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":        "Save KYC",
		"user":       user.ID,
		"KYC status": constants.KYC_STATUS_SUBMITTED,
	})
    fmt.Println("CHECK THE BODY DATA",user)
	err = a.saveWithStatus(ctx, constants.KYC_STATUS_SUBMITTED, *user)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	ctx.JSON(http.StatusOK, SuccessOkMessage)
}

// Save(editing) KYC godoc
// @Summary Save KYC
// @Description Save know your customer data with status EDITING. This is used for automatic safe.
// @Tags kyc
// @Accept json
// @Produce json
// @Param req body requests.CompanyKYCRequest true "KYC data"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /kyc/editing/ [post]
func (a *kycApi) editing(ctx *gin.Context) {

	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":        "Save KYC",
		"user":       user.ID,
		"KYC status": constants.KYС_STATUS_EDITING,
		"user JSON BODY": user,
	})
	fmt.Println("CHECK THE BODY DATA",user)
	err = a.saveWithStatus(ctx, constants.KYС_STATUS_EDITING, *user)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	ctx.JSON(http.StatusOK, SuccessOkMessage)
}

// Decline KYC godoc
// @Summary Decline KYC
// @Description Decline KYC. Email is sent to the company admin.
// @Tags kyc
// @Accept json
// @Produce json
// @Param kycId path int true "kyc id"
// @Success 200 {object} api.SuccessMessage
// @Failure 403 {object} api.ErrorMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /kyc/{kycId}/decline/ [put]
func (a *kycApi) decline(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	kycId, err := a.getId(ctx, "kycId")
	if HandleError(ctx, err, nil, "") {
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":    "Decline KYC",
		"user":   user.ID,
		"kyc Id": kycId,
	})

	kyc, err := db.KYCModel(nil).Get(kycId)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	if kyc.Status == constants.KYC_STATUS_DECLINED || kyc.Status == constants.KYC_STATUS_APPROVED {
		ctx.JSON(http.StatusForbidden, ErrorMessage{
			Status:  "403",
			Message: "This KYC already worked out by the other platform admin",
		})
		return
	}
	kyc.Status = constants.KYC_STATUS_DECLINED

	err = db.KYCModel(tx).Save(kyc)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	if os.Getenv("ENV") != constants.ENV_TEST {
		user, err = db.UserModel(nil).Get(kyc.UserWhoCreatedID, false, false, false)
		if HandleError(ctx, err, contextLogger, "") {
			tx.Rollback()
			return
		}

		err = services.Mail.SendDeclineMessage(user.Email, kyc.Company.Name)
		if err != nil {
			tx.Rollback()
			HandleError(ctx, err, contextLogger, "")
			return
		}
	}
	ctx.JSON(http.StatusOK, SuccessOkMessage)

}

// Approve KYC godoc
// @Summary Approve KYC
// @Description Approve KYC. When approved data from KYC is being copied to companies. If user company admin does not registered yet, the mail is sent.
// @Tags kyc
// @Accept json
// @Produce json
// @Param req body requests.KycEmailRequest true "approve admin data"
// @Param kycId path int true "kyc id"
// @Success 200 {object} api.SuccessMessage
// @Failure 403 {object} api.ErrorMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /kyc/{kycId}/approve/ [put]
func (a *kycApi) approve(ctx *gin.Context) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	var req = &requests.KycEmailRequest{}
	err = ctx.Bind(&req)
	if HandleError(ctx, err, nil, "") {
		return
	}
	kycId, err := a.getId(ctx, "kycId")
	contextLogger := log.WithFields(log.Fields{
		"api":   "Approve KYC",
		"user":  user.ID,
		"kycId": kycId,
		"email": req.Email,
	})

	company, err := db.CompanyModel(nil).GetPreload(user.Company.ID, true)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	kyc, err := db.KYCModel(nil).Get(kycId)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	if kyc.Status == constants.KYC_STATUS_DECLINED || kyc.Status == constants.KYC_STATUS_APPROVED {
		ctx.JSON(http.StatusForbidden, ErrorMessage{
			Status:  "403",
			Message: "This KYC already worked out by the other platform admin",
		})
		return
	}

	if company.CompanyUBOS != nil {
		oldUBOs := []db.CompanyUBOs{}
		err = json.Unmarshal(*company.CompanyUBOS, &oldUBOs)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		for _, u := range oldUBOs {
			a.deleteKYCFileByID(u.PassportID)
		}
	}

	if company.CertificateOfIncorporation != nil {
		a.deleteKYCFileByID(company.CertificateOfIncorporation.ID)
	}

	company.CompanyShareholders = kyc.CompanyShareholders
	company.Site = kyc.Site
	company.CompanyType = kyc.CompanyType
	company.Tax = kyc.Tax
	company.CFO = kyc.CFO
	company.CEO = kyc.CEO
	company.Name = kyc.Name
	company.CompanyUBOS = kyc.CompanyUBOS
	company.CompanyShareholders = kyc.CompanyShareholders
	company.Contact = kyc.Contact
	company.CompanyTradeReferences = kyc.CompanyTradeReferences
	company.CertificateOfIncorporation = kyc.CertificateOfIncorporation
	company.AuthorizedOfficers = kyc.AuthorizedOfficers
	company.Address1 = kyc.Address1
	company.Address2 = kyc.Address2
	company.MarketingManager = kyc.MarketingManager
	company.Email = kyc.Email
	company.Phone = kyc.Phone
	company.OperationsManager = kyc.OperationsManager
	company.BusinessNature = kyc.BusinessNature
	company.IsMemberOf = kyc.IsMemberOf
	company.DoHaveCertifications = kyc.DoHaveCertifications
	//TODO we do not have City, Country yet

	kyc.Status = constants.KYC_STATUS_APPROVED
	tx := db.Connection.Begin()
	defer tx.Commit()

	err = db.KYCModel(tx).Save(kyc)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	err = db.CompanyModel(tx).Save(company)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	invite := &db.Invite{}
	invite.CompanyID = kyc.Company.ID
	invite.Email = req.Email
	invite.UserType = constants.USER_TYPE_COMPANY_ADMIN
	invite.Code, _ = tools.GenerateBase64ID(24)

	_, err = db.InviteModel(nil).GetByEmail(req.Email)
	if err != nil {
		_, err = db.UserModel(nil).GetByEmail(req.Email)
		if err != nil {
			if os.Getenv("ENV") != constants.ENV_TEST {
				err = services.Mail.SendInvite(req.Email, invite.Code, kyc.Company.Name)
				if err != nil {
					tx.Rollback()
					HandleError(ctx, err, contextLogger, "")
					return
				}
			}

			err = db.InviteModel(tx).Save(invite)
			if HandleError(ctx, err, nil, "") {
				tx.Rollback()
				return
			}
		}
	}

	ctx.JSON(http.StatusOK, SuccessOkMessage)
}

// Get KYCs godoc
// @Summary Get KYCs
// @Description Get KYCs. Visited may be of 2 state: true of false. When no visited set all records(depending on statuses) will be returned.
// @Tags kyc
// @Accept json
// @Produce json
// @Param skip query string false "Skip"
// @Param visited query string false "Visited"
// @Param statuses query string false "Statuses divided by coma"
// @Param take query string false "Take"
// @Param order query string false "Order"
// @Param sort query string false "Sort By"
// @Success 200 {object} api.KYCCountMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /kyc/getKYCs/ [get]
func (a *kycApi) getKYCs(ctx *gin.Context) {
	skip := ctx.Request.URL.Query().Get("skip")
	take := ctx.Request.URL.Query().Get("take")
	statusesStr := ctx.Request.URL.Query().Get("statuses")
	visited := ctx.Request.URL.Query().Get("visited")
	sortOrder := ctx.Request.URL.Query().Get("order")
	sortBy := ctx.Request.URL.Query().Get("sort")

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
		"statuses":  statusesStr,
		"getKYC JSON BODY": user,
	})

	if sortBy == "Date" {
		sortBy = "date"
	}

	kycs, count, err := db.KYCModel(nil).Find(statusesStr, visited, skip, take, sortBy, sortOrder)
	if HandleError(ctx, err, nil, "") {
		return
	}

	var kycResponse []KYCResponse

	for _, k := range kycs {

		var name = ""
		if k.UserWhoCreatedID != 0 {
			registeredUser, err := db.UserModel(nil).Get(k.UserWhoCreatedID, true, false, false)
			if HandleError(ctx, err, nil, "") {
				return
			}
			name = registeredUser.UserProfile.FirstName + " " + registeredUser.UserProfile.LastName
		}

		countByCompany, err := db.CompanyModel(nil).GetAllUsers(k.Company.ID)
		if HandleError(ctx, err, nil, "") {
			return
		}
		r := KYCResponse{
			Kyc:                k,
			RegisteredUserName: name,
			UsersInCompany:     countByCompany,
		}
		kycResponse = append(kycResponse, r)
	}

	contextLogger.Info("Count:", len(kycs))
	ctx.JSON(http.StatusOK, KYCCountMessage{
		Kyc:   kycResponse,
		Count: count,
	})

}

func (a *kycApi) saveWithStatus(ctx *gin.Context, status string, user db.User) error {
	var req = requests.CompanyKYCRequest{}

	err := ctx.Bind(&req)
	if err != nil {
		return error_InvalidRequest
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	dbKYC, err := db.KYCModel(tx).GetNotReviewedByCompany(user.Company.ID)
	if err != nil && err.Error() == "record not found" {
		dbKYC = &db.CompanyKYC{
			Date:    time.Now(),
			Status:  constants.KYC_STATUS_NEW,
			Company: user.Company,
		}
fmt.Println("getKYC JSON BODY", user)
		err = db.KYCModel(tx).Create(dbKYC)
		if err != nil {
			return err
		}
	} else if err == nil {
		dbKYC.Date = req.Date
		dbKYC.Status = status

	} else if err != nil {
		return err
	}

	dbKYC.UserWhoCreatedID = user.ID
	dbKYC.Name = req.Name
	dbKYC.Phone = req.Phone
	dbKYC.Email = req.Email
	dbKYC.Address1 = req.Address1
	if req.Address2 != nil {
		dbKYC.Address2 = *req.Address2
	}
	dbKYC.BusinessNature = req.BusinessNature
	dbKYC.CEO = req.CEO
	dbKYC.CFO = req.CFO
	dbKYC.CompanyType = req.CompanyType
	dbKYC.Tax = req.Tax
	dbKYC.Contact = req.Contact
	dbKYC.IsMemberOf = req.IsMemberOf
	dbKYC.DoHaveCertifications = req.DoHaveCertifications
	dbKYC.MarketingManager = req.MarketingManager
	dbKYC.OperationsManager = req.OperationsManager
	dbKYC.Site = req.Site

	if dbKYC.CompanyUBOS != nil {
		oldUBOs := []db.CompanyUBOs{}
		err = json.Unmarshal(*dbKYC.CompanyUBOS, &oldUBOs)
		if err != nil {
			return err
		}
		for _, u := range oldUBOs {
			a.deleteKYCFileByID(u.PassportID)
		}
	}

	if dbKYC.CertificateOfIncorporation != nil {
		a.deleteKYCFileByID(dbKYC.CertificateOfIncorporation.ID)
	}

	sDec, _ := base64.StdEncoding.DecodeString(req.CertificateOfIncorporationData)
	if err != nil {
		return err
	}

	var r = []byte(sDec)
	path, err := a.UploadKYCDocument(ctx, &r,
		req.CertificateOfIncorporationName, req.CertificateOfIncorporationMime)
	if err != nil {
		return err
	}

	doc, err := db.KYCDocumentModel(nil).GetDocBySource(path)
	if err != nil {
		return err
	}

	dbKYC.CertificateOfIncorporation = doc
	dbKYC.CertificateOfIncorporationName = req.CertificateOfIncorporationName

	if len(req.CompanyUBOs) > 0 {
		newCompanyUBOs := make([]db.CompanyUBOs, len(req.CompanyUBOs))

		for i, u := range req.CompanyUBOs {
			sDec, _ := base64.StdEncoding.DecodeString(u.PassportData)
			if err != nil {
				return err
			}
			var r = []byte(sDec)

			path, err := a.UploadKYCDocument(ctx, &r, u.PassportName, u.PassportMime)
			if err != nil {
				return err
			}
			doc, err := db.KYCDocumentModel(nil).GetDocBySource(path)

			newCompanyUBOs[i] = db.CompanyUBOs{
				Name:         u.Name,
				PassportName: u.PassportName,
				PassportID:   doc.ID,
				PassportMime: doc.Mime,
			}
		}
		c, err := json.Marshal(newCompanyUBOs)
		if err != nil {
			return err
		}
		dbKYC.CompanyUBOS = (*json.RawMessage)(&c)

	}

	if len(req.CompanyShareholders) > 0 {
		sh, err := json.Marshal(req.CompanyShareholders)
		if err != nil {
			return err
		}
		var r json.RawMessage = sh
		dbKYC.CompanyShareholders = &r
	}

	if len(req.CompanyTradeReferences) > 0 {
		tr, err := json.Marshal(req.CompanyTradeReferences)
		if err != nil {
			return err
		}
		r := json.RawMessage(tr)
		dbKYC.CompanyTradeReferences = &r
	}

	if len(req.AuthorizedOfficers) > 0 {
		ao, err := json.Marshal(req.AuthorizedOfficers)
		if err != nil {
			return err
		}
		dbKYC.AuthorizedOfficers = (*json.RawMessage)(&ao)
	}

	err = db.KYCModel(tx).Save(dbKYC)
	if err != nil {
		return err
	}
	return nil
}

func (a *kycApi) user(ctx *gin.Context) (user *db.User, err error) {

	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), false, true, false)
	return
}

func (a *kycApi) UploadKYCDocument(ctx *gin.Context, data *[]byte, name string, mime string) (path string, err error) {

	path = "uploads/kyc_documents/" + uuid.NewV4().String()

	out, err := os.Create(path)
	if err != nil {
		return
	}
	defer out.Close()

	_, err = out.Write(*data)
	if err != nil {
		return
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	h := sha256.New()
	f, err := os.Open(path)
	if err != nil {
		log.Fatal(err)
		return
	}
	defer f.Close()
	if _, err = io.Copy(h, f); err != nil {
		tx.Rollback()
		return
	}

	fileDocument := &db.KYCDocument{
		Name:   name,
		Source: path,
		Mime:   mime,
	}
	err = db.KYCDocumentModel(tx).SaveDocument(fileDocument)
	if err != nil {
		tx.Rollback()
		return
	}
	return
}

func (a *kycApi) saveAndReturnKYC(ctx *gin.Context, dbKYC db.CompanyKYC) (*db.CompanyKYC, error) {
	tx := db.Connection.Begin()
	defer tx.Commit()

	err := db.KYCModel(nil).Save(&dbKYC)
	if HandleError(ctx, err, nil, "") {
		return nil, err
	}

	k, err := db.KYCModel(nil).GetNotReviewedByCompany(dbKYC.CompanyID)
	if HandleError(ctx, err, nil, "") {
		return nil, err
	}
	return k, err
}

func (a *kycApi) createNewKYC(ctx *gin.Context) (dbKYC *db.CompanyKYC) {
	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":  "Get KYC",
		"user": user.ID,
	})

	dbKYC = &db.CompanyKYC{
		Company: user.Company,
	}
	dbKYC.Site = user.Company.Site
	dbKYC.CompanyType = user.Company.CompanyType
	dbKYC.Tax = user.Company.Tax
	dbKYC.Name = user.Company.Name
	dbKYC.Contact = user.Company.Contact
	dbKYC.Address1 = user.Company.Address1
	dbKYC.Address2 = user.Company.Address2
	dbKYC.Email = user.Company.Email
	dbKYC.Phone = user.Company.Phone
	dbKYC.Status = constants.KYC_STATUS_NEW
	dbKYC.UserWhoCreatedID = user.ID

	err = db.KYCModel(nil).Create(dbKYC)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	return dbKYC
}

func (a *kycApi) deleteKYCFileByID(id uint) (err error) {
	doc, err := db.KYCDocumentModel(nil).Get(id)
	if err != nil {
		return
	}
	err = os.Remove(doc.Source)
	if err != nil {
		return
	}
	return db.KYCDocumentModel(nil).Delete(doc)

}

func (a *kycApi) getId(ctx *gin.Context, idKey string) (id int, err error) {

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
