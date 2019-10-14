package api

import (
	"errors"
	"net/http"

	"strconv"

	"os"

	"io"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"github.com/twinj/uuid"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/responses"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"
)

type inspectionApi struct {
	hl *HyperledgerApiStruct
}

func (a *inspectionApi) Routes(r gin.IRoutes) {
	r.GET("/trades", a.GetListForInspection)
}

// Get list for inspection godoc
// @Summary Inspection list
// @Description Get list for inspection
// @Tags inspection
// @Accept json
// @Produce json
// @Param skip query string false "Skip"
// @Param take query string false "Take"
// @Param type query string false "Type"
// @Param status query string false "Status"
// @Param sort query string false "Sort"
// @Param order query string false "Order"
// @Success 200 {object} api.IDMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /inspection/trades/{skip}&{take}&{type}&{status}&{sort}&{order} [get]
func (a *inspectionApi) GetListForInspection(ctx *gin.Context) {
	skip := ctx.Request.URL.Query().Get("skip")
	take := ctx.Request.URL.Query().Get("take")
	requestType := ctx.Request.URL.Query().Get("type")
	status := ctx.Request.URL.Query().Get("status")
	sortBy := ctx.Request.URL.Query().Get("sort")
	sortOrder := ctx.Request.URL.Query().Get("order")

	user, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":         "get trades for inspection",
		"user":        user.ID,
		"company":     user.CompanyID,
		"skip":        skip,
		"take":        take,
		"requestType": requestType,
		"status":      status,
		"sortBy":      sortBy,
		"sortOrder":   sortOrder,
	})

	tradeRequests, count, err := db.TradeModel(nil).FindForInspection(user.CompanyID, skip, take, requestType, status, sortBy, sortOrder)
	if HandleError(ctx, err, nil, "") {
		return
	}

	results := make([]RequestTradeResponse, 0)
	for _, tr := range tradeRequests {
		results = append(results, GetTradeResponse(&tr))
	}
	contextLogger.Info("Count:", len(results))
	ctx.JSON(http.StatusOK, ListForInspection{
		Items:  results,
		Counts: count,
	})
}

// Upload reports godoc
// @Summary Upload reports
// @Description Upload reports
// @Tags inspection
// @Accept json
// @Produce json
// @Param id path uint true "Trade request ID"
// @Param reportId path uint true "Trade request file"
// @Success 200
// @Failure 500 {object} api.ErrorMessage
// @Router /inspection/{id}/report_inspection [post]
func (a *tradeApi) UploadReport(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":     "upload document",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})

	file, header, err := ctx.Request.FormFile("upload")

	path := "uploads/inspection_reports/" + uuid.NewV4().String()

	out, err := os.Create(path)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("File saved for inspection report ", header.Filename)

	tf := &db.FileInspectionReport{
		Name:   header.Filename,
		Source: path,
		Owner:  scx.User.CompanyID,
	}

	tx := db.Connection.Begin()
	defer tx.Commit()

	err = db.FileModel(tx).SaveInspectionReport(tf)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	ir := &db.InspectionReport{
		FileID:      tf.ID,
		TradeItemID: scx.Trade.TradeItemID,
	}

	err = db.InspectionReportModel(tx).Save(ir)
	if HandleError(ctx, err, contextLogger, "") {
		tx.Rollback()
		return
	}

	ctx.JSON(http.StatusOK, IDMessage{
		ID: ir.ID,
	})
}

// Get reports godoc
// @Summary Get reports
// @Description Get reports
// @Tags inspection
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.MessageReports
// @Failure 500 {object} api.ErrorMessage
// @Router /inspection/{id}/report_inspection/ [get]
func (a *tradeApi) GetReports(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	reports, err := db.InspectionReportModel(nil).GetByTradeItemId(scx.Trade.TradeItemID)

	ctx.JSON(http.StatusOK, MessageReports{
		Reports: reports,
	})
}

// Get reports godoc
// @Summary Get reports
// @Description Get reports
// @Tags inspection
// @Accept json
// @Produce multipart/form-data
// @Param id path uint true "ID"
// @Param reportId path uint true "Report file"
// @Success 200
// @Failure 500 {object} api.ErrorMessage
// @Router /inspection/{id}/report_file/{reportId} [get]
func (a *tradeApi) GetReportFile(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID &&
		scx.User.CompanyID != *scx.Trade.TradeItem.InspectionID {
		HandleError(ctx, errors.New("user doesn't have access to this file"), nil, "")
		return

	}

	reportIdStr, ok := ctx.Params.Get("reportId")
	if !ok {
		HandleError(ctx, errors.New("invalid file id"), nil, "")
		return

	}

	reportId, err := strconv.Atoi(reportIdStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	report, err := db.InspectionReportModel(nil).Get(uint(reportId))
	if HandleError(ctx, err, nil, "") {
		return
	}

	if report.TradeItemID != scx.Trade.TradeItemID {
		HandleError(ctx, errors.New("file id is not related to current trade"), nil, "")
		return

	}

	file, err := db.FileModel(nil).GetInspectionReport(report.FileID)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.FileAttachment(file.Source, file.Name)
}

func (a *inspectionApi) user(ctx *gin.Context) (user *db.User, err error) {
	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), true, true, false)
	return
}

func (a *inspectionApi) tradeRequest(ctx *gin.Context) (tradeRequest *db.TradeRequest, err error) {
	idStr, ok := ctx.Params.Get("id")

	if !ok {
		err = errors.New("invalid TradeRequest ID")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return
	}

	tradeRequest, err = db.TradeModel(nil).Get(uint(id), true)
	return
}
