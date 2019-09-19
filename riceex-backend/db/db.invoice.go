package db

import (
	"github.com/jinzhu/gorm"
)

type invoiceModel struct {
	db *gorm.DB
}

func InvoiceModel(tx *gorm.DB) *invoiceModel {
	if tx == nil {
		tx = Connection
	}
	return &invoiceModel{db: tx}
}

func (m *invoiceModel) Update(id uint, values map[string]interface{}) (err error) {

	err = m.db.Model(&TradeInvoice{}).Where("id = ?", id).Updates(values).Error
	return
}

func (m *invoiceModel) Save(invoice *TradeInvoice) (err error) {

	err = m.db.Save(invoice).Error
	return
}
