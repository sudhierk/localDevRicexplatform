package cron

import (
	"github.com/robfig/cron"
	log "github.com/sirupsen/logrus"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

func init() {
	c := cron.New()
	c.AddFunc("@every 12h10m", checkExpiredTrades)
	c.Start()
	log.Info("Expired trade requests cron added")
}

func checkExpiredTrades() {
	log.Info("Checking expired Trade Requests")
	expiredRequests, err := db.TradeModel(nil).GetExpired()
	if err != nil {
		log.Warn(err)
	}
	log.Info("Found expired Trade Requests: ", len(expiredRequests))
	cnt := 0
	for _, item := range expiredRequests {
		log.Debug("expired ---> ", item.ID, " ", item.TradeItem.ValidateDate)
		db.TradeModel(nil).UpdateStatus(item.ID, constants.TRADE_STATUS_CANCELED)
		cnt++
	}

	log.Info("Processed expired Trade Requests: ", cnt)

}
