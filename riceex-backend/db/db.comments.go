package db

import (
	"github.com/jinzhu/gorm"
)

type commentModel struct {
	db *gorm.DB
}

func CommentsModel(tx *gorm.DB) *commentModel {
	if tx == nil {
		tx = Connection
	}
	return &commentModel{db: tx}
}

func (m *commentModel) Get(id uint) (comment *Comment, err error) {
	comment = &Comment{}
	err = m.db.Model(&Company{}).Where("ID = ?", id).Find(comment).Error
	return
}

func (m *commentModel) GetTree(tradeID, ownerID, companyID uint) (comments []Comment, err error) {
	dbObj := Connection.Model(&Comment{}).
		Set("gorm:auto_preload", true).
		Joins("left join comments as parents on parents.id = comments.parent_id").
		Where("comments.request_id = ?", tradeID)

	if ownerID != companyID {
		dbObj = dbObj.Where("parents.user_id = ? OR comments.user_id = ? OR (comments.parent_id is Null AND comments.user_id = ?)", companyID, companyID, ownerID)
	}

	comments = []Comment{}
	err = dbObj.Find(&comments).Error

	return
}

func (m *commentModel) Save(comment *Comment) (err error) {
	err = m.db.Save(comment).Error
	return
}
