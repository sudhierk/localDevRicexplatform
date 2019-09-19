package responses

import (
	"time"

	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

//swagger:model
type ResponseDocumentComment struct {
	ID               uint
	ParentID         *uint
	UserID           uint
	FirstName        string
	LastName         string
	Name             string
	Text             string
	CreatedAt        time.Time
	ReceiverName     string
	ReceiverFullName string
	ReceiverID       uint
	ReceiverRole     string
	SenderRole       string
	AutoComment      bool
}

func GetResponseDocumentComment(c db.DocumentComment, receiver db.User, receiverRole, senderRole string, autoComment bool) ResponseDocumentComment {
	return ResponseDocumentComment{c.ID,
		c.ParentID,
		c.UserID,
		c.User.UserProfile.FirstName,
		c.User.UserProfile.LastName,
		c.User.Company.Name,
		c.Text,
		c.CreatedAt,
		receiver.Company.Name,
		receiver.UserProfile.FullName(),
		receiver.ID,
		receiverRole,
		senderRole,
		autoComment,
	}
}
