package db

import (
	"github.com/jinzhu/gorm"
)

type billModel struct {
	db *gorm.DB
}

func BillModel(tx *gorm.DB) *billModel {
	if tx == nil {
		tx = Connection
	}
	return &billModel{db: tx}
}

func (m *billModel) Save(billModel *ShipmentBill) (err error) {
	err = m.db.Save(billModel).Error
	return
}
