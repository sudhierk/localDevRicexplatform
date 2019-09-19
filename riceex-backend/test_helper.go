package main

import (
	"net/http"
	"net/http/httptest"

	"bytes"

	"gitlab.com/riceexchangeplatform/riceex-backend/testMocks"

	"encoding/json"

	"strconv"

	"crypto"
	"crypto/rand"
	"crypto/rsa"

	"crypto/x509"

	"encoding/pem"

	"encoding/base64"

	"mime/multipart"

	"io"
	"os"

	"strings"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	"gitlab.com/riceexchangeplatform/riceex-backend/api"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

var a App
var appIsInited bool
var err error
var user1ID uint = 1000
var user2ID uint = 1001
var user3ID uint = 1002
var userInspectionID uint = 1003

var user1Token string
var user2Token string
var user3Token string
var userInspectionToken string
var tradeRequestID uint

func initApp() {
	if appIsInited {
		return
	}
	a = App{}
	a.Initialize()
	appIsInited = true
}

func closeTrade(userToken string, tradeRequestID uint, resultStatus string) {

	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/close", nil)
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
}

func confirmPayment(userToken string, tradeRequestID uint, resultStatus string) {
	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/confirm_payment", nil)
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
}

func initiatePayment(userToken string, tradeRequestID uint, resultStatus string) {
	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/payment", nil)
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
}

func uploadInvoice(userToken string, tradeRequestID uint, privKey, resultStatus string) (invoiceID uint) {
	PSSmessage := "test1"
	sigBase64 := getSignature(PSSmessage, privKey)

	request := testMocks.GetInvoiceRequest(PSSmessage, string(sigBase64))
	b, _ := json.Marshal(request)
	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/invoice", bytes.NewBuffer(b))
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.InvoiceMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
	return responseStruct.DocumentID
}

func uploadBill(userToken string, tradeRequestID uint, resultStatus string) (billID uint) {
	request := testMocks.GetBillRequest()
	b, _ := json.Marshal(request)
	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/shipment/1/bill", bytes.NewBuffer(b))
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.CreateUpdateBillMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
	return *responseStruct.BillID
}

func sendShipmentAdvice(userToken string, tradeRequestID uint, resultStatus string) {
	request := testMocks.GetDocumentaryInstructionRequest()
	b, _ := json.Marshal(request)
	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/advice", bytes.NewBuffer(b))
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
}

func sendDocumentaryInstructtions(userToken string, tradeRequestID uint, resultStatus string) {
	request := testMocks.GetDocumentaryInstructionRequest()
	b, _ := json.Marshal(request)
	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/instructions", bytes.NewBuffer(b))
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
}

func rejectVessel(userToken string, tradeRequestID uint, httpStatus int, resultStatus string) {
	req, _ := http.NewRequest("PUT", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/reject_vessel_nomination", nil)
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(httpStatus))
	if httpStatus != http.StatusOK {
		return
	}
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
}

func acceptVessel(userToken string, tradeRequestID uint, inspectionCompany *uint, httpStatus int, resultStatus string) {
	request := testMocks.GetAcceptVesselRequest(inspectionCompany)
	b, _ := json.Marshal(request)
	req, _ := http.NewRequest("PUT", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/accept_vessel_nomination", bytes.NewBuffer(b))
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(httpStatus))
	if httpStatus != http.StatusOK {
		return
	}
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
}

func getVesselNomination(userToken string, tradeRequestID uint, httpStatus int) (vessel api.SmartVesselMessage) {
	req, _ := http.NewRequest("GET", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/vessel_nomination", nil)
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(httpStatus))
	if httpStatus != http.StatusOK {
		return
	}
	responseStruct := api.SmartVesselMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	return responseStruct
}

func nominateVessel(userToken string, tradeRequestID uint, inspectionCompany *uint, httpStatus int, resultStatus string) {
	request := testMocks.GetNominateVesselRequest(inspectionCompany)
	b, _ := json.Marshal(request)
	req, _ := http.NewRequest("PUT", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/nominate_vessel", bytes.NewBuffer(b))
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(httpStatus))
	if httpStatus != http.StatusOK {
		return
	}
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultStatus))
}

func acceptPublicTradeRequest(userToken string, tradeRequestID uint) {
	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/smart/accept", nil)
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(TRADE_STATUS_DEAL))
	//TODO check in HL if status is deal
}

func createTradeRequest(userToken, requestType, incoterm string) (id uint) {
	loginRequest := testMocks.GetTradeRequestRequest(incoterm, requestType)
	b, _ := json.Marshal(loginRequest)
	req, _ := http.NewRequest("POST", "/v1/api/trade/", bytes.NewBuffer(b))
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(http.StatusOK))

	responseStruct := api.IDMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.ID).To(Not(Equal(0)))
	return responseStruct.ID
}

func signTrade(userToken string, tradeID uint, httpStatus int, privKey, resultTradeStatus string) {

	PSSmessage := "test1"
	sigBase64 := getSignature(PSSmessage, privKey)
	request := testMocks.GetSignTradeRequest(PSSmessage, string(sigBase64))
	b, _ := json.Marshal(request)
	req, _ := http.NewRequest("POST", "/v1/api/trade/"+strconv.Itoa(int(tradeID))+"/smart/sign", bytes.NewBuffer(b))
	response := executeRequest(req, userToken, false)
	Expect(response.Code).To(Equal(httpStatus))
	if httpStatus != http.StatusOK {
		return
	}
	responseStruct := api.StatusMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Status).To(Equal(resultTradeStatus))
}

func registerAndLoginUsersAndInspction() {
	clearDB()
	migrateDB()

	registerNewUser(user1ID, "test1@test.com", COMPANY_EXPORTER, "taxNumber1", "companyName1", false)
	activateNewUser(user1ID)

	registerNewUser(user2ID, "test2@test.com", COMPANY_EXPORTER, "taxNumber2", "companyName2", false)
	activateNewUser(user2ID)

	registerNewUser(user3ID, "test3@test.com", COMPANY_EXPORTER, "taxNumber3", "companyName3", false)
	activateNewUser(user3ID)

	registerNewUser(userInspectionID, "testIncspection@test.com", COMPANY_INSPECTION, "taxNumberInspection", "taxNumberInspection", false)
	activateNewUser(userInspectionID)

	user1Token = login("test1@test.com")

	user2Token = login("test2@test.com")

	user3Token = login("test3@test.com")

	userInspectionToken = login("test3@test.com")
}

func login(email string) (token string) {
	loginRequest := testMocks.GetLoginRequestUser(email)

	b, err := json.Marshal(loginRequest)
	Expect(err).NotTo(HaveOccurred())

	req, _ := http.NewRequest("POST", "/v1/api/auth/login/", bytes.NewBuffer(b))
	response := executeRequest(req, "", false)

	Expect(response.Code).To(Equal(http.StatusOK))

	loginResponse := api.LoginMessage{}

	err = json.Unmarshal([]byte(response.Body.String()), &loginResponse)
	Expect(err).NotTo(HaveOccurred())

	Expect(loginResponse.Token).To(Not(Equal("")))

	return loginResponse.Token
}

func activateNewUser(userID uint) {
	activateAccountRequest := testMocks.GetActivateAccountRequest()

	b, err := json.Marshal(activateAccountRequest)
	Expect(err).NotTo(HaveOccurred())

	var user1 *db.User
	user1, err = db.UserModel(nil).Get(userID, true, true, true)

	req, err := http.NewRequest("POST", "/v1/api/auth/update/"+user1.Code, bytes.NewBuffer(b))
	Expect(err).NotTo(HaveOccurred())
	response := executeRequest(req, "", false)

	Expect(response.Code).To(Equal(http.StatusOK))

	activationRepsonse := activationResp{}
	err = json.Unmarshal([]byte(response.Body.String()), &activationRepsonse)
	Expect(err).NotTo(HaveOccurred())

	Expect(activationRepsonse.ID).To(Equal(userID))
	Expect(activationRepsonse.Token).To(Not(Equal("")))

	//TODO check activation code is removed from DB
}

func registerNewUser(userID uint, email, companyType, taxNumber, companyName string, checkSameEmailError bool) {
	jsonReq := testMocks.GetRegistrationRequest(email, companyType, taxNumber, companyName)
	b, err := json.Marshal(jsonReq)
	Expect(err).NotTo(HaveOccurred())

	req, err := http.NewRequest("POST", "/v1/api/auth/register/", bytes.NewBuffer(b))
	Expect(err).NotTo(HaveOccurred())

	response := executeRequest(req, "", false)
	if checkSameEmailError {
		Expect(response.Code).To(Equal(http.StatusInternalServerError))
		Expect(response.Body.String()).To(Equal("{\"message\":\"user already exist\",\"status\":\"registration_email_exist\"}"))
		return
	}
	Expect(response.Code).To(Equal(http.StatusOK))
	Expect(response.Body.String()).To(Equal("{\"id\":" + strconv.Itoa(int(userID)) + "}"))

	By("Have records with new user in DB and activation code")

	var user *db.User
	user, err = db.UserModel(nil).Get(userID, true, true, true)
	Expect(err).NotTo(HaveOccurred())
	Expect(user.Code).To(Not(Equal("")))
}

func getSignature(text string, privKey string) (sig string) {
	newhash := crypto.SHA256
	pssh := newhash.New()
	pssh.Write([]byte(text))
	hashed := pssh.Sum(nil)

	block, _ := pem.Decode([]byte(privKey))
	priv, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	Expect(err).NotTo(HaveOccurred())

	signature, err := rsa.SignPKCS1v15(rand.Reader, priv, newhash, hashed)
	Expect(err).NotTo(HaveOccurred())
	sigBase64 := base64.StdEncoding.EncodeToString(signature)
	return sigBase64
}

func approveDocByUser(token string, tradeRequestID uint, docID uint, resultDocumentStatus, resultTradeStatus string) {

	req, err := http.NewRequest("PUT", "/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/shipment/1/document/"+strconv.Itoa(int(docID))+"/approve", nil)
	Expect(err).NotTo(HaveOccurred())
	response := executeRequest(req, token, true)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.ApproveDocumentMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.TradeStatus).To(Equal(resultTradeStatus))
	Expect(responseStruct.DocumentStatus).To(Equal(resultDocumentStatus))
}

func uploadDocByUser(docType, token string, tradeRequestID uint) (docID uint) {
	values := map[string]io.Reader{
		"upload":  mustOpen("main.go"), // lets assume its this file
		"DocType": strings.NewReader(docType),
	}
	err, req := getRequest("/v1/api/trade/"+strconv.Itoa(int(tradeRequestID))+"/shipment/1/upload", values)
	Expect(err).NotTo(HaveOccurred())
	response := executeRequest(req, token, true)
	Expect(response.Code).To(Equal(http.StatusOK))
	responseStruct := api.UploadDocumentMessage{}
	err = json.Unmarshal([]byte(response.Body.String()), &responseStruct)
	Expect(err).NotTo(HaveOccurred())
	Expect(responseStruct.Type).To(Equal(docType))
	return responseStruct.DocumentID
}

func executeRequest(req *http.Request, token string, isForm bool) *httptest.ResponseRecorder {
	if isForm {
	} else {
		req.Header.Set("Content-Type", "application/json")
	}

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rr := httptest.NewRecorder()
	a.Router.ServeHTTP(rr, req)

	return rr
}

func clearDB() {
	a.DB.Exec("TRUNCATE bids  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE comments  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE companies  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE company_kycs  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE document_comments  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE documentary_instructions  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE file_documents  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE file_inspection_reports  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE file_templates  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE inspection_reports  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE kyc_documents  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE notifications  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE shipment_bills  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE shipment_documents  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE shipments  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE trade_invoices  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE trade_items  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE trade_requests  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE user_profiles  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE users  RESTART IDENTITY CASCADE;")
	a.DB.Exec("TRUNCATE vessel_nominations  RESTART IDENTITY CASCADE;")
}

func migrateDB() {
	a.DB.Exec("ALTER SEQUENCE companies_id_seq RESTART WITH 1000;")
	a.DB.Exec("ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1000;")
	a.DB.Exec("ALTER SEQUENCE users_id_seq RESTART WITH 1000;")
}

type activationResp struct {
	Token string `json:"token"`
	ID    uint   `json:"id"`
}

func getRequest(url string, values map[string]io.Reader) (err error, r *http.Request) {
	// Prepare a form that you will submit to that URL.
	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	for key, r := range values {
		var fw io.Writer
		if x, ok := r.(io.Closer); ok {
			defer x.Close()
		}
		// Add an image file
		if x, ok := r.(*os.File); ok {
			if fw, err = w.CreateFormFile(key, x.Name()); err != nil {
				return err, nil
			}
		} else {
			// Add other fields
			if fw, err = w.CreateFormField(key); err != nil {
				return err, nil
			}
		}
		if _, err = io.Copy(fw, r); err != nil {
			return err, nil
		}

	}
	// Don't forget to close the multipart writer.
	// If you don't close it, your request will be missing the terminating boundary.
	w.Close()

	// Now that you have a form, you can submit it to your handler.
	req, err := http.NewRequest("POST", url, &b)
	if err != nil {
		return
	}
	// Don't forget to set the content type, this will contain the boundary.
	req.Header.Set("Content-Type", w.FormDataContentType())

	return nil, req
}

func mustOpen(f string) *os.File {
	r, err := os.Open(f)
	if err != nil {
		panic(err)
	}
	return r
}
