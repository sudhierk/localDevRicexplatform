package api

import (
	"net/http"
	"time"

	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"
	"gitlab.com/riceexchangeplatform/riceex-backend/responses"

	log "github.com/sirupsen/logrus"

	"strconv"

	"github.com/gin-gonic/gin"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"
)

type api struct {
	*auth
	Account       *accountApi
	Trade         *tradeApi
	Company       *companyApi
	Inspection    *inspectionApi
	System        *systemApi
	WS            *wsApi
	File          *fileApi
	Template      *templatesApi
	Notifications *notificationsApi
	UserProfile   *userProfileApi
	Permissions   *permissionsApi
	KYC           *kycApi
	CompanyAdmin  *companyAdminApi
	PlatformAdmin *platformAdminApi
}

func New(r *gin.RouterGroup) (result *api) {
	auth := &auth{}
	accountApi := &accountApi{}
	accountApi.auth = auth
	accountApi.hl = HyperledgerApi()

	tradeApi := &tradeApi{hl: HyperledgerApi()}
	companyApi := &companyApi{}
	systemApi := &systemApi{}
	notificationsApi := &notificationsApi{}
	kycApi := &kycApi{}
	permissionsApi := &permissionsApi{}

	result = &api{
		Account:       accountApi,
		Trade:         tradeApi,
		Company:       companyApi,
		System:        systemApi,
		Notifications: notificationsApi,
		KYC:           kycApi,
		Permissions:   permissionsApi,
	}
	result.auth = auth
	result.routes(r)
	return
}

func (a *api) routes(r *gin.RouterGroup) {
	a.Account.Routes(r.Group("auth"))
	a.Trade.Routes(r.Group("trade").Use(a.AuthorizationChecker()))
	a.Notifications.Routes(r.Group("notifications").Use(a.AuthorizationChecker()))
	a.Company.Routes(r.Group("company").Use(a.AuthorizationChecker()))
	a.Inspection.Routes(r.Group("inspection").Use(a.AuthorizationChecker(), a.InspectionChecker()))
	a.System.Routes(r.Group("system"))
	a.WS.Routes(r.Group("ws"))
	a.File.Routes(r.Group("file").Use(a.AuthorizationChecker()))
	a.Template.Routes(r.Group("templates").Use(a.AuthorizationChecker()))
	a.UserProfile.Routes(r.Group("userProfile").Use(a.AuthorizationChecker()))
	a.KYC.Routes(r.Group("kyc"))
	a.CompanyAdmin.Routes(r.Group("companyAdmin").Use(a.AuthorizationChecker(), a.CompanyAdminChecker()))
	a.PlatformAdmin.Routes(r.Group("platformAdmin").Use(a.AuthorizationChecker(), a.PlatformAdminChecker()))
	a.Permissions.Routes(r.Group("permissions").Use(a.AuthorizationChecker()))

}

type IRoutingApi interface {
	Routes(r gin.IRoutes)
}

func HandleError(ctx *gin.Context, err error, entry *log.Entry, status string) bool {
	if err != nil {
		if entry != nil {
			entry.Warn("api error: ", err)
		} else {
			log.Warn("api error: ", err)
		}

		code := http.StatusInternalServerError
		if status == "" {
			status = "internal_server_error"
		}

		strCode, errConv := strconv.Atoi(status)
		if errConv == nil {
			code = strCode
		}
		ctx.JSON(code, ErrorMessage{
			Message: err.Error(),
			Status:  status,
		})
		return true
	}
	return false
}

// swagger:model
type ErrorMessage struct {
	Message string `json:"message" `
	Status  string `json:"status" `
}

// swagger:model
type StatusMessage struct {
	Status string `json:"status" `
}

// swagger:model
type CanConfirmMessage struct {
	CanConfirm bool `json:"canConfirm" `
}

// swagger:model
type IDMessage struct {
	ID uint `json:"id" `
}

// swagger:model
type LoginMessage struct {
	Token       string `json:"token"`
	CompanyType string `json:"companyType"`
	UserType    string `json:"userType"`
}

// swagger:model
type AccountMessage struct {
	ID          uint   `json:"id"`
	Email       string `json:"email"`
	CompanyName string `json:"companyName"`
	CompanyType string `json:"companyType"`
	Name        string `json:"name"`
	UserType    string `json:"userType"`
}

// swagger:model
type TokenMessage struct {
	Token string `json:"token"`
}

// swagger:model
type SuccessMessage struct {
	Success interface{} `json:"success"`
}

var SuccessTrueMessage = SuccessMessage{
	Success: true,
}

var SuccessOkMessage = SuccessMessage{
	Success: "ok",
}

// swagger:model
type BidsResultMessage struct {
	Bids []db.Bid `json:"bids"`
}

// swagger:model
type CreateUpdateBillMessage struct {
	DocumentID uint   `json:"documentID"`
	FileID     uint   `json:"fileID"`
	BillID     *uint  `json:"BillID"`
	Status     string `json:"status"`
}

//swagger:model
type GetBillMessage struct {
	BillID                uint                 `json:"billID"`
	Document              *db.ShipmentDocument `json:"document"`
	BillNumber            string               `json:"BillNumber"`
	ShippingComp          string               `json:"ShippingComp"`
	Shipper               string               `json:"Shipper"`
	VessVoyage            string               `json:"VessVoyage"`
	BookingRef            string               `json:"BookingRef"`
	ShipperRef            string               `json:"ShipperRef"`
	QuantCleanOnBoard     uint                 `json:"QuantCleanOnBoard"`
	FreightsCharges       string               `json:"FreightsCharges"`
	DeclaredValue         string               `json:"DeclaredValue"`
	PlaceIssue            string               `json:"PlaceIssue"`
	DateIssue             time.Time            `json:"DateIssue"`
	CarriersAgentsEndorsm string               `json:"CarriersAgentsEndorsm"`
	NotifyParties         string               `json:"NotifyParties"`
	PortOfLoad            string               `json:"PortOfLoad"`
	PortOfDischarge       string               `json:"PortOfDischarge"`
	PackGoodsDescript     string               `json:"PackGoodsDescript"`
	Marking               string               `json:"Marking"`
	ShippedOnBoard        time.Time            `json:"ShippedOnBoard"`
	Consignee             string               `json:"Consignee"`
	CarrierReceipt        string               `json:"CarrierReceipt"`
	CreatedAt             time.Time            `json:"CreatedAt"`
}

//swagger:model
type TradeCommentMessage struct {
	Comment requests.CreateComment `json:"comment"`
}

//swagger:model
type TradeCommentsMessage struct {
	Comments []requests.CreateComment `json:"comments"`
}

//swagger:model
type CommentsMessage struct {
	Comments []responses.ResponseComment `json:"comments"`
}

//swagger:model
type InspectionsCompaniesMessage struct {
	Companies []db.Company `json:"companies"`
}

//swagger:model
type CompaniesCountMessage struct {
	Companies []db.Company `json:"companies"`
	Count     uint         `json:"count"`
}

//swagger:model
type UsersCountMessage struct {
	Users []db.User `json:"users"`
	Count uint      `json:"count"`
}

//swagger:model
type KYCResponse struct {
	Kyc                db.CompanyKYC `json:"kyc"`
	UsersInCompany     uint          `json:"usersInCompany"`
	RegisteredUserName string        `json:"registeredUserName"`
}

//swagger:model
type KYCCountMessage struct {
	Kyc   []KYCResponse `json:"kycs"`
	Count uint          `json:"count"`
}

//swagger:model
type CompaniesMessage struct {
	Companies []responses.CompaniesList `json:"items"`
}

//swagger:model
type DocType struct {
	DocType string
}

//swagger:model
type UploadDocumentMessage struct {
	DocumentID uint   `json:"documentID"`
	FileID     uint   `json:"fileID"`
	Type       string `json:"type"`
	File       string `json:"file"`
	Status     string `json:"status"`
}

//swagger:model
type ShipmentDocumentsMessage struct {
	ShipmentDocuments []db.ShipmentDocument `json:"shipmentDocuments"`
}

//swagger:model
type ApproveDocumentMessage struct {
	DocumentStatus string `json:"documentStatus"`
	TradeStatus    string `json:"tradeStatus"`
}

//swagger:model
type DocumentStatusMessage struct {
	DocumentStatus string `json:"documentStatus"`
}

//swagger:model
type DocumentCommentMessage struct {
	CommentID uint `json:"commentId"`
}

//swagger:model
type DocumentCommentsMessage struct {
	Comments []responses.ResponseDocumentComment `json:"comments"`
}

//swagger:model
type DocumentFileHashMessage struct {
	Sha256 string `json:"sha256"`
}

//swagger:model
type DocumentInstructionsMessage struct {
	DocumentaryInstructions *db.DocumentaryInstructions `json:"documentaryInstructions"`
	Shipments               []db.Shipment               `json:"shipments"`
}

//swagger:model
type MessageReports struct {
	Reports []db.InspectionReport `json:"reports"`
}

//swagger:model
type ListForInspection struct {
	Items  []responses.RequestTradeResponse `json:"items"`
	Counts uint                             `json:"counts"`
}

//swagger:model
type InvoiceMessage struct {
	DocumentID uint   `json:"DocumentID"`
	InvoiceID  uint   `json:"InvoiceID"`
	Status     string `json:"status"`
}

//swagger:model
type UpdateInvoiceMessage struct {
	Invoice  *db.TradeInvoice     `json:"invoice"`
	Document *db.ShipmentDocument `json:"document"`
}

//swagger:model
type UserProfileMessage struct {
	Id          uint           `json:"id"`
	Email       string         `json:"email"`
	Role        string         `json:"role"`
	Company     string         `json:"company"`
	UserProfile db.UserProfile `json:"userProfile"`
}

//swagger:model
type SmartVesselMessage struct {
	Vessel db.VesselNomination `json:"vesselNomination"`
}

//swagger:model
type KYCWithCreatorMessage struct {
	Company            *db.CompanyKYC `json:"Company"`
	Date               time.Time      `json:"Date"`
	Status             string         `json:"Status"`
	RegisteredUserName string         `json:"registeredUserName"`
}

//swagger:model
type KYCMessage struct {
	Company *db.CompanyKYC `json:"Company"`
	Date    time.Time      `json:"Date"`
	Status  string         `json:"Status"`
}

//swagger:model
type NotificationMessage struct {
	Notofications []db.Notification `json:"notifications"`
	Count         uint              `json:"count"`
	Unread        uint              `json:"unread"`
}

//swagger:model
type SmartPaymentMessage struct {
	Status string `json:"status"`
	Payed  bool   `json:"payed"`
}

//swagger:model
type ShipmentsMessage struct {
	Shipments []db.Shipment `json:"shipments"`
}

//swagger:model
type GetCitiesMessage struct {
	Items []db.City `json:"items"`
}

//swagger:model
type GetTradeMessage struct {
	Request responses.RequestTradeResponse `json:"request"`
}

//swagger:model
type GetTradeInfoMessage struct {
	Info responses.TradeRequestInfoResponse `json:"info"`
}
