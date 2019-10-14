package services

import (
	"os"

	sendgrid "github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	log "github.com/sirupsen/logrus"
)

var Sendgrid *sendgridService

func init() {

	Sendgrid = &sendgridService{"ricex@ricex.io"}
	log.Debug("Sendgrid Key: ", os.Getenv("SENDGRID_API_KEY"))
	return
}

type sendgridService struct {
	from string
}

func (m *sendgridService) send(email string, title string, body string) error {
	log.Info("email from: ", m.from)
	from := mail.NewEmail("Rice Exchange", m.from)
	to := mail.NewEmail("Ricex User", email)
	message := mail.NewSingleEmail(from, title, to, body, body)
	client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
	response, err := client.Send(message)
	log.Debug(response.Body)
	return err
}
