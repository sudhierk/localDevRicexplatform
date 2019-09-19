package db

import (
	"errors"
	"strings"

	"github.com/jinzhu/gorm"
)

type userModel struct {
	db *gorm.DB
}

func UserModel(tx *gorm.DB) *userModel {
	if tx == nil {
		tx = Connection
	}
	return &userModel{db: tx}
}

func (m *userModel) GetByEmail(email string) (user *User, err error) {

	user = &User{}
	err = m.db.Model(&User{}).Where("email = ?", strings.ToLower(email)).Preload("Company").Preload("UserProfile").Find(user).Error
	return
}

func (m *userModel) Save(user *User) (err error) {

	err = m.db.Save(user).Error
	return
}

func (m *userModel) Create(user *User) (err error) {

	err = m.db.Create(user).Error
	return
}

func (m *userModel) UpdatePassword(userID uint, password string) (err error) {

	err = m.db.Model(&User{}).Where("id = ?", userID).Update("password", password).Error
	return
}

func (m *userModel) UpdateUserAgent(userID uint, userAgent string) (err error) {

	err = m.db.Model(&User{}).Where("id = ?", userID).Update("last_login_user_agent", userAgent).Error
	return
}

func (m *userModel) GetByActivation(code string) (user *User, err error) {

	user = &User{}
	err = m.db.Model(&User{}).Where("code = ?", strings.ToLower(code)).Find(user).Error
	return
}

func (m *userModel) Get(id uint, preloadProfile bool, preloadCompany bool, preloadPermissions bool) (user *User, err error) {

	user = &User{}

	v := m.db.Model(&User{})
	if preloadCompany {
		v = v.Preload("Company")
	}
	if preloadProfile {
		v = v.Preload("UserProfile")
	}
	if preloadPermissions {
		v = v.Preload("Permission")
	}
	err = v.Where("ID = ?", id).Find(user).Error

	return
}

func (m *userModel) GetByCompany(id uint) (user *User, err error) {

	user = &User{}
	err = m.db.Model(&User{}).Where("company_id = ?", id).Preload("Company").Preload("UserProfile").Find(user).Error
	return
}

func (m *userModel) GetUsersByCompany(id uint) (users []User, count uint, err error) {

	users = []User{}
	err = m.db.Model(&User{}).Where("company_id = ?", id).Find(&users).Count(&count).Error
	return
}

func (m *userModel) CheckPassword(email string, passwordHash string) (user *User, err error) {

	user = &User{}
	err = m.db.Model(&User{}).Where("email = ?", strings.ToLower(email)).Find(user).Error
	if err != nil {
		return
	}

	if user.PasswordHash == strings.ToLower(passwordHash) {
		err = errors.New("invalid Username or Password")
	}
	return
}

func (m *userModel) GetUserProfileById(user *User) (result *UserProfile, err error) {

	result = &UserProfile{}
	err = m.db.Model(&UserProfile{}).Where("user_id = ?", user.ID).Find(result).Error
	return
}

func (m *userModel) Find(user User, skip, take, sortBy, sortOrder interface{}) (users []User, count uint, err error) {

	dbObj := Connection.Model(&User{}).
		Set("gorm:auto_preload", true).
		Offset(skip).Limit(take)

	sort := SortField(sortBy.(string)) + " " + sortOrder.(string)
	if sortBy == "measurement" {
		sort = sort + ", trade_items.quantity " + sortOrder.(string)
	}
	dbObj = dbObj.Order(sort)

	users = []User{}
	err = dbObj.Find(&users).Offset(0).Limit(-1).Count(&count).Error

	return
}
