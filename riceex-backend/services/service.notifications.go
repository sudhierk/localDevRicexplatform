package services

import (
	"time"

	log "github.com/sirupsen/logrus"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

//Use UserId 0 to broadcast message to all connected users
type NotificationStruct struct {
	ReceiverID         uint
	Message            *NotificationMessageStruct
	ExcludeInspections bool
}

type NotificationMessageStruct struct {
	ID          uint      `json:"id"`
	Type        string    `json:"type"`
	Data        string    `json:"data"`
	Initiator   string    `json:"initiator"`
	InitiatorID uint      `json:"initiatorID"`
	Date        time.Time `json:"date"`
}

func SendNotification(notification *NotificationStruct) (err error) {
	log.WithFields(log.Fields{
		"Notification": notification.Message.Type,
		"User":         notification.ReceiverID,
		"Initiator":    notification.Message.InitiatorID,
	}).Debug(notification.Message.Data)

	if notification.ReceiverID != 0 {
		notificationToSave := &db.Notification{}
		notificationToSave.ReceiverID = notification.ReceiverID
		notificationToSave.Type = notification.Message.Type
		notificationToSave.Data = notification.Message.Data
		notificationToSave.Initiator = notification.Message.Initiator
		notificationToSave.Read = false
		err = db.NotificationModel(nil).Save(notificationToSave)
		if err != nil {
			log.Warn(err)
			return err
		}
		notification.Message.ID = notificationToSave.ID
	}
	SendWSNotification(notification)
	return nil
}
