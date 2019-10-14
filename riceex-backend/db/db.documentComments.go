package db

import (
	"github.com/jinzhu/gorm"
)

type documentCommentModel struct {
	db *gorm.DB
}

func DocumentCommentsModel(tx *gorm.DB) *documentCommentModel {
	if tx == nil {
		tx = Connection
	}
	return &documentCommentModel{db: tx}
}

func (m *documentCommentModel) Get(id uint) (comment *Comment, err error) {

	comment = &Comment{}
	err = m.db.Model(&Company{}).Where("ID = ?", id).Find(comment).Error
	return
}

func (m *documentCommentModel) GetTree(docID, companyID uint) (comments []DocumentComment, err error) {

	dbObj := Connection.Model(&DocumentComment{}).
		Set("gorm:auto_preload", true).
		Joins("left join document_comments as parents on parents.id = document_comments.parent_id").
		Where("document_comments.document_id = ?", docID)

	dbObj = dbObj.Where("parents.user_id = ? OR document_comments.user_id = ? OR parents.receiver = ? OR document_comments.receiver = ? OR document_comments.auto_comment = ?", companyID, companyID, companyID, companyID, true)

	comments = []DocumentComment{}
	err = dbObj.Find(&comments).Error

	return
}

func (m *documentCommentModel) Save(comment *DocumentComment) (err error) {

	err = m.db.Save(comment).Error
	return
}
