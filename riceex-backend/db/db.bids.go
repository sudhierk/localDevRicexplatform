package db

import (
	"github.com/jinzhu/gorm"
)

type bidModel struct {
	db *gorm.DB
}

func BidModel(tx *gorm.DB) *bidModel {
	if tx == nil {
		tx = Connection
	}
	return &bidModel{db: tx}
}

func (m *bidModel) GetLastBid(tradeRequestID uint) (bid *Bid, res bool) {
	bid = &Bid{}
	res = !m.db.Model(&Bid{}).Where("trade_request_id = ?", tradeRequestID).Last(bid).RecordNotFound()
	return
}

func (m *bidModel) GetAllBids(tradeRequestID uint) (bids []Bid, err error) {

	bids = []Bid{}
	err = m.db.Model(&Bid{}).
		Where("trade_request_id = ? ", tradeRequestID).Order("id desc").Find(&bids).Error
	return
}

func (m *bidModel) Save(bid *Bid) (err error) {

	err = m.db.Save(bid).Error
	return
}
