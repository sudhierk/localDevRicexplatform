package db

import (
	"github.com/jinzhu/gorm"
)

type notificationModel struct {
	db *gorm.DB
}

func NotificationModel(tx *gorm.DB) *notificationModel {
	if tx == nil {
		tx = Connection
	}
	return &notificationModel{db: tx}
}

func (m *notificationModel) GetForUserID(userId uint, skip, take interface{}) (notifications []Notification, count uint, err error) {

	dbObj := Connection.Model(&Notification{}).
		Offset(skip).Limit(take).
		Where("receiver_id = ?", userId).
		Order("created_at desc")

	notifications = []Notification{}
	err = dbObj.Find(&notifications).Offset(0).Limit(-1).Count(&count).Error
	return
}

func (m *notificationModel) GetUnreadForUserID(userId uint) (count uint, err error) {

	dbObj := Connection.Model(&Notification{}).
		Where("receiver_id = ?", userId).
		Where("read = ?", false).
		Order("created_at desc")

	err = dbObj.Count(&count).Error
	return
}

func (m *notificationModel) Get(id uint) (notification *Notification, err error) {

	notification = &Notification{}
	err = m.db.Model(notification).Where("ID = ?", id).Find(notification).Error
	return
}

func (m *notificationModel) MarkAllAsRead(userId uint) (err error) {

	err = m.db.Model(Notification{}).Where("receiver_id = ?", userId).Update("read", true).Error
	return
}

func (m *notificationModel) Save(notification *Notification) (err error) {

	err = m.db.Save(notification).Error
	return
}

func (m *notificationModel) Delete(notification *Notification) (err error) {

	err = m.db.Delete(notification).Error
	return
}

func (m *notificationModel) DeleteAll(userId uint) (err error) {

	err = m.db.Where("receiver_id = ?", userId).Delete(&Notification{}).Error
	return
}
