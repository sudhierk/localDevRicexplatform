package services

import (
	"bytes"
	"net/smtp"
	"strings"
	"text/template"

	"github.com/hoisie/mustache"
	log "github.com/sirupsen/logrus"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
)

var Mail *mailService

type mailService struct {
	auth   smtp.Auth
	host   string
	from   string
	webUrl string
}

func Init(host string, user string, password string, from, webUrl string) {
	log.Debug("Email settings: ", host, user, password)
	Mail = &mailService{host: host, from: from, webUrl: webUrl}
	h := strings.Split(host, ":")
	Mail.auth = smtp.PlainAuth("", user, password, h[0])
	return
}

type MailContext struct {
	Content string
	Footer  string
}

func (m *mailService) sendEmail(title, email, templconst string, data map[string]string) error {

	content := mustache.Render(templconst, data)
	ctx := MailContext{
		Content: content,
		Footer:  constants.TEMPLATE_FOOTER,
	}

	t, err := template.New("test").Parse(constants.TEMPLATE)
	if err != nil {
		panic(err)
	}

	var doc bytes.Buffer
	err = t.Execute(&doc, ctx)
	if err != nil {
		return err
	}

	bs := doc.Bytes()
	return Sendgrid.send(email, title, string(bs))

}

func (m *mailService) SendUpdateEmail(email, code string) error {

	log.Debug("sendUpdateEmail email, code: ", email, code)
	return m.sendEmail("Updating email", email, constants.UPDATE_MAIL,
		map[string]string{"action": "You are changing you email address. Please accept.",
			"link":  m.webUrl,
			"code":  code,
			"email": email,
		})

}

func (m *mailService) SendChangePassword(email, code string) error {

	log.Debug("sendChangePassword email, code: ", email, code)
	return m.sendEmail("Change password", email, constants.CHANGE_PASSWORD,
		map[string]string{"action": "Change password by this link",
			"link": m.webUrl,
			"code": code,
		})

}

func (m *mailService) SetAccountPassword(email, code string) error {

	log.Debug("setAccountPassword email, code: ", email, code)
	return m.sendEmail("Activate account", email, constants.ACCOUNT_PASSWORD,
		map[string]string{"action": "Activate your account by this link",
			"link": m.webUrl,
			"code": code,
		})
}

func (m *mailService) SendActivation(userName string, email, code string) error {

	log.Debug("sendActivation userName, email, code: ", userName, email, code)
	return m.sendEmail("Activate your Rice Exchange account", email, constants.ACTIVATION_EMAIL,
		map[string]string{"firstName": userName,
			"link":   m.webUrl + "/account/accept/" + code,
			"weburl": m.webUrl,
			"web":    strings.Replace(m.webUrl, "http://", "", -1),
		})
}

func (m *mailService) SendInvite(email, code, companyName string) error {

	log.Debug("send invite companyName, email ", companyName, email, code)
	return m.sendEmail("Register your Rice Exchange account", email, constants.INVITE_EMAIL,
		map[string]string{
			"companyName": companyName,
			"link":        m.webUrl + "/account/invite/" + code,
		})
}

func (m *mailService) SendLoginNotification(email, userName, userLastName, userEmail string) error {

	log.Debug("sendLoginNotification email, userName, userLastName, userEmail: ", email, userName, userLastName, userEmail)
	return m.sendEmail("Sandbox login alert", email, constants.LOGIN_NOTIFICATION_EMAIL,
		map[string]string{"firstName": userName,
			"lastName": userLastName,
			"email":    userEmail,
		})

}

func (m *mailService) SendVerification(email string, code string) error {

	log.Debug("sendActivation email, code: ", email, code)
	return m.sendEmail("Verification Code", email, constants.VERIFICATION,
		map[string]string{"url": m.webUrl,
			"code": code,
		})

}

func (m *mailService) SendDeclineMessage(email, companyName string) error {

	log.Debug("send decline messae companyName, email ", companyName, email)
	return m.sendEmail("Know Your Customer form has been rejected", email, constants.INVITE_EMAIL,
		map[string]string{
			"message": "Your Know Your Customer form has been rejected. You will be contacted soon to discuss the matter.",
		})
}
