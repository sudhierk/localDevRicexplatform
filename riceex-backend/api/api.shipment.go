package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	log "github.com/sirupsen/logrus"
)

// Get shipments godoc
// @Summary Get shipments
// @Description Get shipments
// @Tags trade
// @Accept json
// @Produce json
// @Param id path uint true "ID"
// @Success 200 {object} api.ShipmentsMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/shipments [get]
func (a *tradeApi) GetShipments(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}
	contextLogger := log.WithFields(log.Fields{
		"api":     "get shipments",
		"user":    scx.User.ID,
		"company": scx.User.CompanyID,
		"trade":   scx.Trade.ID,
	})
	contextLogger.Info("count:", len(scx.Trade.TradeItem.Shipments))
	ctx.JSON(http.StatusOK, ShipmentsMessage {
		Shipments: scx.Trade.TradeItem.Shipments,
	})
}
