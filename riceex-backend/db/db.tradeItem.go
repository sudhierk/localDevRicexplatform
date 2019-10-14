package db

import (
	"github.com/jinzhu/gorm"
)

type tradeItemModel struct {
	db *gorm.DB
}

func TradeItemModel(tx *gorm.DB) *tradeItemModel {
	if tx == nil {
		tx = Connection
	}
	return &tradeItemModel{db: tx}
}

func (m *tradeItemModel) Update(id uint, values map[string]interface{}) (err error) {

	err = m.db.Model(&TradeItem{}).Where("id = ?", id).Updates(values).Error
	return
}

func (m *tradeItemModel) UpdatePaymentComment(id uint, comment string) (err error) {

	err = m.db.Model(TradeItem{}).Where("id = ?", id).Update("payment_comment", comment).Error
	return
}

func (m *tradeItemModel) Save(tr *TradeItem) (err error) {

	err = m.db.Save(tr).Error
	return
}
