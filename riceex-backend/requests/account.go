package requests

//swagger:model
type AccountLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

//swagger:model
type AccountPasswordUpdateRequest struct {
	Password  string `json:"password"`
	PublicKey string `json:"publicKey"`
}

//swagger:model
type AccountRegisterRequest struct {
	User struct {
		Email       string `json:"email"`
		FirstName   string `json:"firstName"`
		LastName    string `json:"lastName"`
		CompanyRole string `json:"companyRole"`
		Phone       string `json:"phone" `
	} `json:"user"`
	Company struct {
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
	} `json:"company"`
}

//swagger:model
type AccountRegisterByInviteRequest struct {
	Code      string `json:"code"`
	Password  string `json:"password"`
	PublicKey string `json:"publicKey"`
	User      struct {
		Email       string `json:"email"`
		FirstName   string `json:"firstName"`
		LastName    string `json:"lastName"`
		CompanyRole string `json:"companyRole"`
		Phone       string `json:"phone" `
	} `json:"user"`
}

//swagger:model
type AccountForgotRequest struct {
	Email string `json:"email"`
}

//swagger:model
type InviteUserRequest struct {
	Email string `json:"email"`
}
