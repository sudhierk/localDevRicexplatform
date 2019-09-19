package api

import (
	"errors"

	"strconv"

	"github.com/gin-gonic/gin"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

type fileApi struct {
	*auth
}

func (a *fileApi) Routes(r gin.IRoutes) {
	r.GET("/:id", a.GetFile)
}

// Get file godoc
// @Summary Get file
// @Description Get file
// @Tags file
// @Accept json
// @Produce multipart/form-data
// @Param id path uint true "Trade request ID"
// @Success 200
// @Failure 500 {object} api.ErrorMessage
// @Router /file/{id}/ [get]
func (a *fileApi) GetFile(ctx *gin.Context) {
	//TODO access to reports
	_, err := a.user(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	idStr, ok := ctx.Params.Get("id")
	if !ok {
		err = errors.New("invalid TradeRequest ID")
		return
	}

	id, err := strconv.Atoi(idStr)
	if HandleError(ctx, err, nil, "") {
		return
	}

	file, err := db.FileModel(nil).GetInspectionReport(uint(id))
	if HandleError(ctx, err, nil, "") {
		return
	}

	/*if file.Owner != user.CompanyID {
		HandleError(ctx, errors.New("permission denied"), nil, "")
		return
	}*/

	ctx.FileAttachment(file.Source, file.Name)
}

func (a *fileApi) user(ctx *gin.Context) (user *db.User, err error) {
	userId, ok := ctx.Get("UserID")
	if !ok {
		err = errors.New("invalid User ID")
		return
	}

	user, err = db.UserModel(nil).Get(userId.(uint), false, true, false)
	return
}
