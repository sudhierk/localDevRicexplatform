package api

import (
	"net/http"

	"io"
	"os"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"github.com/twinj/uuid"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

type templatesApi struct {
	*auth
}

func (a *templatesApi) Routes(r gin.IRoutes) {
	r.POST("/inspectionReport", a.SetInspectionReport)
	r.GET("/inspectionReport", a.GetInspectionReport)
}

// Set inspection report godoc
// @Summary Set inspection report
// @Description Set inspection report
// @Tags templates
// @Accept multipart/form-data
// @Produce json
// @Success 200 {object} api.IDMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /templates/inspectionReport [post]
func (a *templatesApi) SetInspectionReport(ctx *gin.Context) {

	contextLogger := log.WithFields(log.Fields{
		"api": "upload template",
	})

	file, header, err := ctx.Request.FormFile("upload")

	path := "uploads/templates/" + uuid.NewV4().String()
	fileType := constants.FILE_INSPECTION_REPORT_TEMPLATE

	out, err := os.Create(path)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("File saved ", header.Filename)

	tf := &db.FileTemplate{
		Name:   header.Filename,
		Type:   fileType,
		Source: path,
		Owner:  0,
	}

	oldFile, err := db.FileModel(nil).GetTemplateByType(constants.FILE_INSPECTION_REPORT_TEMPLATE)
	if err != nil {
		contextLogger.Info("template INSPECTION_REPORT_TEMPLATE not found")
	} else {
		//TODO delete old file
		contextLogger.Info("template INSPECTION_REPORT_TEMPLATE found and overwritten")
		tf.ID = oldFile.ID
	}

	err = db.FileModel(nil).SaveTemplate(tf)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	ctx.JSON(http.StatusOK, IDMessage{
		ID: tf.ID,
	})

}

// Get inspection report godoc
// @Summary Get inspection report
// @Description Get inspection report
// @Tags templates
// @Accept json
// @Produce multipart/form-data
// @Success 200
// @Failure 500 {object} api.ErrorMessage
// @Router /templates/inspectionReport [get]
func (a *templatesApi) GetInspectionReport(ctx *gin.Context) {

	fi, err := db.FileModel(nil).GetTemplateByType(constants.FILE_INSPECTION_REPORT_TEMPLATE)
	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.FileAttachment(fi.Source, fi.Name)
}
