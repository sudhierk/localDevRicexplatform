package db

import (
	"github.com/jinzhu/gorm"
)

type shipmentModel struct {
	db *gorm.DB
}

func ShipmentModel(tx *gorm.DB) *shipmentModel {
	if tx == nil {
		tx = Connection
	}
	return &shipmentModel{db: tx}
}

func (m *shipmentModel) Get(id uint) (shipment *Shipment, err error) {

	shipment = &Shipment{}
	err = m.db.Model(&Shipment{}).Where("ID = ?", id).Preload("Bill").Find(shipment).Error
	return
}

func (m *shipmentModel) GetByTradeItemId(tradeItemId uint) (shipments []Shipment, err error) {

	shipments = []Shipment{}
	err = m.db.Model(&Shipment{}).Where("trade_item_id = ?", tradeItemId).Find(&shipments).Error
	return
}

func (m *shipmentModel) Save(shipmentModel *Shipment) (err error) {

	err = m.db.Save(shipmentModel).Error
	return
}
