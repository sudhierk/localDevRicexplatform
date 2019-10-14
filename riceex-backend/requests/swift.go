package requests

type (
	SWIFTPaymentInitiationRequest struct {
		ExecutionDate struct {
			Date string `json:"date"`
		} `json:"requested_execution_date"`
		Amount struct {
			InstructedAmount struct {
				Currency string `json:"currency"`
				Amount   string `json:"amount"`
			} `json:"instructed_amount"`
		} `json:"amount"`
		Debtor struct {
			Name             string `json:"name"`
			InstructedAmount struct {
				Lei string `json:"lei"`
			} `json:"organisation_identification"`
		} `json:"debtor"`
		DebtorAgent struct {
			Bicfi string `json:"bicfi"`
		} `json:"debtor_agent"`
		CreditorAgent struct {
			Bicfi string `json:"bicfi"`
		} `json:"creditor_agent"`
		DebtorAccount struct {
			Iban string `json:"iban"`
		} `json:"debtor_account"`
		Credetor struct {
			Name             string `json:"name"`
			InstructedAmount struct {
				Lei string `json:"lei"`
			} `json:"organisation_identification"`
		} `json:"creditor"`
		CreditorAccount struct {
			Iban string `json:"iban"`
		} `json:"creditor_account"`
		RemittanceInformation string `json:"remittance_information"`
		PaymentIdentification struct {
			EndToEndIdentification string `json:"end_to_end_identification"`
		} `json:"payment_identification"`
	}
	executionDate struct {
		Date string `json:"date"`
	}
	amount struct {
		instructedAmount struct {
			Currency string `json:"currency"`
			Amount   string `json:"amount"`
		} `json:"instructed_amount"`
	}
	instructedAmount struct {
		Currency string `json:"currency"`
		Amount   string `json:"amount"`
	}
)

func CreateObject() (obj *SWIFTPaymentInitiationRequest) {
	/*obj := SWIFTPaymentInitiationRequest{
		executionDate{Date: "2019-01-02"},
		amount{instructedAmount:instructedAmount{Currency:"GBP", Amount:"160000.00"}},
		{},
		{},
		{},
		{},
		{},
		{},
		{},
		{}.
	}*/
	return nil
}
