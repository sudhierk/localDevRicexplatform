package requests

//swagger:model
type BlockCompanyRequest struct {
	Block bool `json:"block"`
}

//swagger:model
type KycEmailRequest struct {
	Email string `json:"email"`
}
