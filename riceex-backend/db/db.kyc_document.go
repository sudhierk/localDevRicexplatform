package db

import "github.com/jinzhu/gorm"

type kycDocumentModel struct {
	db *gorm.DB
}

func KYCDocumentModel(tx *gorm.DB) *kycDocumentModel {
	if tx == nil {
		tx = Connection
	}
	return &kycDocumentModel{db: tx}
}

func (m *kycDocumentModel) SaveDocument(file *KYCDocument) (err error) {

	err = m.db.Save(file).Error
	return
}

func (m *kycDocumentModel) GetDocBySource(path string) (file *KYCDocument, err error) {

	file = &KYCDocument{}
	err = m.db.Model(&KYCDocument{}).Where("source = ?", path).Find(file).Error
	return
}

func (m *kycDocumentModel) Get(id uint) (file *KYCDocument, err error) {

	file = &KYCDocument{}
	err = m.db.Model(&KYCDocument{}).Where("ID = ?", id).Find(file).Error
	return
}

func (m *kycDocumentModel) Delete(file *KYCDocument) (err error) {

	err = m.db.Delete(file).Error
	return
}
