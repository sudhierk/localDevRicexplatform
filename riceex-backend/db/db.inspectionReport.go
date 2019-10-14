package db

import (
	"github.com/jinzhu/gorm"
)

type inspectionReportModel struct {
	db *gorm.DB
}

func InspectionReportModel(tx *gorm.DB) *inspectionReportModel {
	if tx == nil {
		tx = Connection
	}
	return &inspectionReportModel{db: tx}
}

func (m *inspectionReportModel) Get(id uint) (inspectionReport *InspectionReport, err error) {

	inspectionReport = &InspectionReport{}
	err = m.db.Model(&InspectionReport{}).Where("ID = ?", id).Preload("File").Find(inspectionReport).Error
	return
}

func (m *inspectionReportModel) GetByTradeItemId(tradeItemId uint) (inspectionReports []InspectionReport, err error) {

	inspectionReports = []InspectionReport{}
	err = m.db.Model(&InspectionReport{}).Where("trade_item_id = ?", tradeItemId).Preload("File").Find(&inspectionReports).Error
	return
}

func (m *inspectionReportModel) GetByFileId(tradeItemId uint) (inspectionReports InspectionReport, err error) {

	err = m.db.Model(&InspectionReport{}).Where("file_id = ?", tradeItemId).Find(inspectionReports).Error
	return
}

func (m *inspectionReportModel) Save(inspectionReport *InspectionReport) (err error) {

	err = m.db.Save(inspectionReport).Error
	return
}
