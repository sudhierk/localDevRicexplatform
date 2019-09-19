package db

import (
	"github.com/jinzhu/gorm"
)

type fileModel struct {
	db *gorm.DB
}

func FileModel(tx *gorm.DB) *fileModel {
	if tx == nil {
		tx = Connection
	}
	return &fileModel{db: tx}
}

func (m *fileModel) GetInspectionReport(id uint) (file *FileInspectionReport, err error) {

	file = &FileInspectionReport{}
	err = m.db.Model(&FileInspectionReport{}).Where("ID = ?", id).Find(file).Error
	return
}

func (m *fileModel) GetDocument(id uint) (file *FileDocument, err error) {

	file = &FileDocument{}
	err = m.db.Model(&FileDocument{}).Where("ID = ?", id).Find(file).Error
	return
}

func (m *fileModel) GetTemplate(id uint) (file *FileTemplate, err error) {

	file = &FileTemplate{}
	err = m.db.Model(&FileTemplate{}).Where("ID = ?", id).Find(file).Error
	return
}

func (m *fileModel) GetTemplateByType(fType string) (file *FileTemplate, err error) {

	file = &FileTemplate{}
	err = m.db.Model(&FileTemplate{}).Where("type = ?", fType).Find(file).Error
	return
}

func (m *fileModel) SaveTemplate(file *FileTemplate) (err error) {

	err = m.db.Save(file).Error
	return
}

func (m *fileModel) SaveInspectionReport(file *FileInspectionReport) (err error) {

	err = m.db.Save(file).Error
	return
}

func (m *fileModel) SaveDocument(file *FileDocument) (err error) {

	err = m.db.Save(file).Error
	return
}
