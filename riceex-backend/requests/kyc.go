package requests

import "time"

type CompanyShareholders struct {
	Name       string `json:"name"`
	Percentage uint   `json:"percentage"`
}

type CompanyUBOsRequest struct {
	Name         string `json:"name"`
	PassportName string `json:"passportName"`
	PassportData string `json:"passportData"`
	PassportMime string `json:"passportMime"`
}

type CompanyTradeReferences struct {
	CompanyName string `json:"companyName"`
	ContactName string `json:"contactName"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`
	Email       string `json:"email"`
}

type AuthorizedOfficer struct {
	Name     string `json:"name"`
	Position string `json:"position"`
}

//swagger:model
type CompanyKYCRequest struct {
	Name        string  `json:"name"`
	CompanyType string  `json:"companyType"`
	Contact     string  `json:"contact"`
	Tax         string  `json:"tax"`
	Phone       string  `json:"phone"`
	Address1    string  `json:"address1"`
	Address2    *string `json:"address2"`
	Site        string  `json:"site"`

	CEO               string  `json:"ceo"`
	CFO               *string `json:"cfo"`
	MarketingManager  *string `json:"marketingManager"`
	OperationsManager *string `json:"operationsManager"`

	Email                          string  `json:"email"`
	CertificateOfIncorporationName string  `json:"certificateOfIncorporationName"`
	CertificateOfIncorporationData string  `json:"certificateOfIncorporationData"`
	CertificateOfIncorporationMime string  `json:"certificateOfIncorporationMime"`
	BusinessNature                 *string `json:"businessNature"`

	IsMemberOf           *string `json:"isMemberOf"`
	DoHaveCertifications *string `json:"doHaveCertifications"`

	AuthorizedOfficers     []AuthorizedOfficer      `json:"authorizedOfficers"`
	CompanyTradeReferences []CompanyTradeReferences `json:"companyTradeReferences"`
	CompanyUBOs            []CompanyUBOsRequest     `json:"companyUBOs"`
	CompanyShareholders    []CompanyShareholders    `json:"companyShareholders"`

	Date time.Time `json:"date"`
}
