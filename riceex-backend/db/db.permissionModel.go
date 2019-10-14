package db

import "github.com/jinzhu/gorm"

type permissionModel struct {
	db *gorm.DB
}

func PermissionModel(tx *gorm.DB) *permissionModel {
	if tx == nil {
		tx = Connection
	}
	return &permissionModel{db: tx}
}

func (m *permissionModel) Save(permission *Permission) (err error) {

	err = m.db.Save(permission).Error
	return
}

func (m *permissionModel) Get(id uint) (p *Permission, err error) {

	p = &Permission{}
	err = m.db.Model(&Permission{}).Where("ID = ?", id).Find(p).Error
	return
}
