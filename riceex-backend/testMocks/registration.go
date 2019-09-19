package testMocks

import (
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"
)

func GetRegistrationRequest(email, companyType, taxNumber, comapnyName string) (req *requests.AccountRegisterRequest) {

	type User struct {
		Email       string `json:"email"`
		FirstName   string `json:"firstName"`
		LastName    string `json:"lastName"`
		CompanyRole string `json:"companyRole"`
		Phone       string `json:"phone" `
	}

	type Company struct {
		Name          string `json:"name"`
		Site          string `json:"site"`
		CompanyType   string `json:"companyType"`
		Country       string `json:"country"`
		TaxNumber     string `json:"taxNumber"`
		City          string `json:"city"`
		Address1      string `json:"address1"`
		Address2      string `json:"address2"`
		Phone         string `json:"phone"`
		ContactPerson string `json:"contactPerson"`
	}

	return &requests.AccountRegisterRequest{
		User{email,
			"FirstName",
			"LastName",
			"Buyer",
			"+380000000000",
		},
		Company{comapnyName,
			"",
			companyType,
			"",
			taxNumber,
			"City",
			"Address1",
			"",
			"+4900000000000",
			"Artem Skliarov",
		},
	}
}

func GetActivateAccountRequest() (req *requests.AccountPasswordUpdateRequest) {
	return &requests.AccountPasswordUpdateRequest{"123456",
		"-----BEGIN PUBLIC KEY-----\n\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCWAwtX/P8wdEDUfnGNHdZzaOzV\n\n8XwLxmbTTbqvpdHwfMeAXgea3MOndCrgUo0wSzvh/SnJt4OpOTXkqCpZy5qCFxdv\n\nPtpbRbmF9BFpygzAqwcN6FHVFPbfKa57O8zUHAbuVlXrLXlvfU0OnxH2Ch2hhN/2\n\nngP8K0hI0ZPW5YWpfQIDAQAB\n\n-----END PUBLIC KEY-----",
	}
}

func GetPublicKey() (key string) {
	return `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCWAwtX/P8wdEDUfnGNHdZzaOzV
8XwLxmbTTbqvpdHwfMeAXgea3MOndCrgUo0wSzvh/SnJt4OpOTXkqCpZy5qCFxdv
PtpbRbmF9BFpygzAqwcN6FHVFPbfKa57O8zUHAbuVlXrLXlvfU0OnxH2Ch2hhN/2
ngP8K0hI0ZPW5YWpfQIDAQAB
-----END PUBLIC KEY-----`
}

func GetCorrectPrivateKey() (key string) {
	return `-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQCWAwtX/P8wdEDUfnGNHdZzaOzV8XwLxmbTTbqvpdHwfMeAXgea
3MOndCrgUo0wSzvh/SnJt4OpOTXkqCpZy5qCFxdvPtpbRbmF9BFpygzAqwcN6FHV
FPbfKa57O8zUHAbuVlXrLXlvfU0OnxH2Ch2hhN/2ngP8K0hI0ZPW5YWpfQIDAQAB
AoGAIkQLwUt/FxhW/rLrSSq5o58iCjSg+yeUsUueCyU7cU1vXLkdz5gB8Swt5xO0
QIXO5e4oL3WF04/H6bUoB17kqdzzg9JdivrbqXA7ckPh6U9/fbRkGR7YBLAJfmd2
qj4qwleCYXk9FuBJLnwiGEPuSIisoDjDEmsEIMve4AyGRlkCQQDMvcZBNKN+Qlxb
XqIMIaZUUX/FOZ1RYP2kXL1ex3dSUlGTOOi0RssNm9t6sXc1rUQE3u1y8JfIr59+
YN2+UF/nAkEAu5GRFfnDQ5tXxUhEfLFQ1QlltnBl9FZx2eWoGD11VJ2nfzXkR6E/
sExcIKOXqOzIgDk/hnmRFdaankcNEZ8O+wJAY4eBwCMJs5Ao+5XmasVU6TpxRXw7
mNrwkp0uxctrmw4/b7VDkpezkBsLN/rbe7GOFlwUzEJfVwThIPuP8Dt8UwJAPh+G
WCry+09WEKdQ16O6y/Ri1bwAaJ7A8pRXyj+AvtfAhCeLRhYoC/IeiUjlkDNsbNuJ
KLbW0M7VQxrxPybZRQJAZXz61hLzd9LzpjpOD259J/9XHU2ZbsYmC/Q+c+wdlX8u
TtzZ1oo18nNLLqYSDw8kp83FW0ccouaQhk5ZDddYHw==
-----END RSA PRIVATE KEY-----`
}

func GetWrongPrivateKey() (key string) {
	return `-----BEGIN RSA PRIVATE KEY-----
MIICWgIBAAKBgFgvmc9YRqqWfKdy33zHXeeGCooM7kNfrkFvF27GeknGWCwCly7Q
M2SRUqiFwJvd8ww6/TPZ9QsYZ9ONlUZ+K4hJZHeDgQk61bYXpngRO/s9QWfHxneK
p59YbaJsX9NMyJf+5G+X5t8UyIptdDf8nqh6SiM+mB2BKhLT5HmG9yRjAgMBAAEC
gYBAegU+ea+pWEAp+i53QBljhzi7ePrYHeP9iakbYFjXCgM7omVBYA7DcBF8j9ak
3+Gtxo+M0sZ8Z0q6feFv2h4fOmcvdN6aNehRm3qq+jMpjoaUfGyrxTWhsVJfFeug
ohyexICDJzl73wFODo4pZsZJ4PUapZoIAFRoOvrk4ui+MQJBAJ6vSdlf2pygnmZ8
7zQMz3ulN1lovCTwb1ON1OcLBBvj6xQr/dw5onZmhn9sPvy7gTPHm04n0K+Xj8j6
J34evRsCQQCORFrNvM+Pa/KDoEP3hxmrAqNl3CQ9lzk2vy3MOTDNGReR6i4bthw8
GDqQTiRohfLihhShzvTfZY52hlRgKpJZAkA8wzRNB1ZHmX1uEzLpRGqClx4dn2xD
3MlUPkAjBGXbZCfU/o9jr7IVEmc4DbQExKvRrwI6KCbRxgBp3dgXhB+3AkBfz1j3
xXhjNmeUjZI4WRvIN3ajWqZtdDJr1ESbjMh417Uv524162cIcai/FmEeo1b3hyTN
8/qlmFdhKwYX3ZPBAkAD1S9h/dqprKhoNEiOdopniFjSyksAuvLrioOo9NRcIs+G
YxLiGH7FLfldskDp0lxWLog2Pjm7ZCb3pgYWuSH9
-----END RSA PRIVATE KEY-----`
}

func GetLoginRequestUser(email string) (req *requests.AccountLoginRequest) {
	return &requests.AccountLoginRequest{
		email,
		"123456",
	}
}

func GetSignTradeRequest(text, sign string) (req *requests.TradeSignRequest) {
	return &requests.TradeSignRequest{
		sign,
		text,
	}
}
