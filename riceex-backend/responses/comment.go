package responses

import (
	"time"

	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)//

//swagger:model
type ResponseComment struct {
	ID        uint
	ParentID  *uint
	UserID    uint
	FirstName string
	LastName  string
	Name      string
	Text      string
	CreatedAt time.Time
}

func GetResponseComment(c db.Comment) ResponseComment {
	return ResponseComment{c.ID,
		c.ParentID,
		c.UserID,
		c.User.UserProfile.FirstName,
		c.User.UserProfile.LastName,
		c.User.Company.Name,
		c.Text,
		c.CreatedAt}
}
