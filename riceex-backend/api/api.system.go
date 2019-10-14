package api

import (
	"net/http"
	"strings"

	"strconv"

	"time"

	"github.com/gin-gonic/gin"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/services"
)

type systemApi struct {
	*auth
}

func (a *systemApi) Routes(r gin.IRoutes) {
	r.GET("/cities", a.GetCities)
	r.GET("/test-ws/:userId", a.TestWS)
}

// Get cities godoc
// @Summary Get cities
// @Description Get cities
// @Tags system
// @Accept json
// @Produce json
// @Param country path string true "country"
// @Success 200 {object} api.GetCitiesMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /system/cities [get]
func (a *systemApi) GetCities(ctx *gin.Context) {
	country := strings.ToUpper(ctx.Request.URL.Query().Get("country"))

	result := []db.City{}

	err := db.Connection.Model(&db.City{}).Where("iso = ?", country).Order("city asc").Find(&result).Error

	if HandleError(ctx, err, nil, "") {
		return
	}

	ctx.JSON(http.StatusOK, GetCitiesMessage{
		Items: result,
	})

}

// Test ws cities godoc
// @Summary Test ws
// @Description Test ws
// @Tags system
// @Accept json
// @Produce json
// @Param userId path uint true "user ID"
// @Success 200 {object} api.SuccessMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /system/test-ws/{userId} [get]
func (a *systemApi) TestWS(ctx *gin.Context) {

	userIdString, _ := ctx.Params.Get("userId")
	userId, _ := strconv.ParseUint(userIdString, 10, 64)
	services.SendNotification(
		&services.NotificationStruct{
			uint(userId),
			&services.NotificationMessageStruct{0, "test type", "test data", "System", 0, time.Now()},
			false,
		})
	ctx.JSON(http.StatusOK, SuccessTrueMessage)

}
