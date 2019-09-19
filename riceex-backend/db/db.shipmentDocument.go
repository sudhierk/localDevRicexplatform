package db

import (
	"github.com/jinzhu/gorm"
)

type shipmentDocumentModel struct {
	db *gorm.DB
}

func ShipmentDocumentModel(tx *gorm.DB) *shipmentDocumentModel {
	if tx == nil {
		tx = Connection
	}
	return &shipmentDocumentModel{db: tx}
}

func (m *shipmentDocumentModel) Get(id uint) (shipmentDocument *ShipmentDocument, err error) {

	shipmentDocument = &ShipmentDocument{}
	err = m.db.Model(&ShipmentDocument{}).Preload("Files").Preload("Shipment").Where("ID = ?", id).Find(shipmentDocument).Error
	return
}

func (m *shipmentDocumentModel) GetByTypeForShipment(id uint, docType string) (shipmentDocument *ShipmentDocument, res bool) {

	shipmentDocument = &ShipmentDocument{}
	res = m.db.Model(&ShipmentDocument{}).Preload("Files").Preload("Shipment").Where("shipment_id = ?", id).Where("type = ?", docType).Find(shipmentDocument).RecordNotFound()
	return
}

func (m *shipmentDocumentModel) GetByShipmentId(shipmentId uint) (shipmentDocuments []ShipmentDocument, err error) {

	shipmentDocuments = []ShipmentDocument{}
	err = m.db.Model(&ShipmentDocument{}).Preload("Files").Where("shipment_id = ?", shipmentId).Find(&shipmentDocuments).Error
	return
}

func (m *shipmentDocumentModel) GetByBillId(billId uint) (shipmentDocument *ShipmentDocument, err error) {

	shipmentDocument = &ShipmentDocument{}
	err = m.db.Model(&ShipmentDocument{}).Preload("Files").Where("bill_id = ?", billId).Find(shipmentDocument).Error
	return
}

func (m *shipmentDocumentModel) GetByInvoiceId(invoiceId uint) (shipmentDocument *ShipmentDocument, err error) {

	shipmentDocument = &ShipmentDocument{}
	err = m.db.Model(&ShipmentDocument{}).Preload("Files").Where("invoice_id = ?", invoiceId).Find(shipmentDocument).Error
	return
}

func (m *shipmentDocumentModel) Save(shipmentDocumentModel *ShipmentDocument) (err error) {

	err = m.db.Save(shipmentDocumentModel).Error
	return
}

func (m *shipmentDocumentModel) Update(id uint, values map[string]interface{}) (err error) {

	err = m.db.Model(&ShipmentDocument{}).Where("id = ?", id).Updates(values).Error
	return
}
