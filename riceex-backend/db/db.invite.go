package db

import (
	"strings"

	"github.com/jinzhu/gorm"
)

type inviteModel struct {
	db *gorm.DB
}

func InviteModel(tx *gorm.DB) *inviteModel {
	if tx == nil {
		tx = Connection
	}
	return &inviteModel{db: tx}
}

func (m *inviteModel) GetByEmail(email string) (invite *Invite, err error) {

	invite = &Invite{}
	err = m.db.Model(&User{}).Where("email = ?", strings.ToLower(email)).Find(invite).Error
	return
}

func (m *inviteModel) GetByCode(code string) (invite *Invite, err error) {

	invite = &Invite{}
	err = m.db.Model(&User{}).Where("code = ?", code).Find(invite).Error
	return
}

func (m *inviteModel) Save(invite *Invite) (err error) {

	err = m.db.Save(invite).Error
	return
}
