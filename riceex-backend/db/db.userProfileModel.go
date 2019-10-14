package db

import "github.com/jinzhu/gorm"

type userProfileModel struct {
	db *gorm.DB
}

func UserProfileModel(tx *gorm.DB) *userProfileModel {
	if tx == nil {
		tx = Connection
	}
	return &userProfileModel{db: tx}
}

func (m *userProfileModel) Save(user *UserProfile) (err error) {

	err = m.db.Save(user).Error
	return
}
