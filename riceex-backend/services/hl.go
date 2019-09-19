package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

var (
	TradeUrl                      = "/api/txCreate"
	CompanyUrl                    = "/api/company"
	RegisterParticipantUrl        = "/api/system/identities/issue"
	AuthUrl                       = "/api/wallet/import?name="
	GetTradeUrl                   = "/api/trade/%d"
	GetDocumentUrl                = "/api/document/%d"
	TradeDealUrl                  = "/api/tradeDeal"
	TradeDeclinedUrl              = "/api/tradeDeclined"
	CreateContract                = "/api/createContract"
	SignContract                  = "/api/txSign"
	DocumentaryInstructions       = "/api/documentaryInstructions"
	DocumentaryInstructionsFilled = "/api/documentaryInstructionsFilled"
	ShippingAdvice                = "/api/shippingAdvice"
	ShippingAdviceFilled          = "/api/shippingAdviceFilled"
	DocumentsRequired             = "/api/documentsRequired"
	PaymentsRequired              = "/api/paymentsRequired"
	AllDocumentsFilled            = "/api/allDocumentsFilled"
	BlockchainUrl                 = os.Getenv("BLOCKCHAIN_URL")
)

type HyperledgerApiStruct struct {
}

func HyperledgerApi() (res *HyperledgerApiStruct) {
	res = &HyperledgerApiStruct{}
	t, _ := res.GetJwt("admin")
	log.Debug("admin token", t)
	return
}

type RegisterCompanyData struct {
	Class     string `json:"$class"`
	CompanyID uint   `json:"companyId"`
	Name      string `json:"name"`
}

func (h *HyperledgerApiStruct) RegisterCompany(id uint, name string) (card []byte, err error) {
	jsonData, err := json.Marshal(RegisterCompanyData{Class: "org.ricex.net.Company", CompanyID: id, Name: name})
	if err != nil {
		return
	}

	log.Debug("RegisterCompany, Connect as admin ", BlockchainUrl+CompanyUrl, string(jsonData))
	cl, err := h.Connect("admin")
	if err != nil {
		return
	}

	req, err := http.NewRequest("POST", BlockchainUrl+CompanyUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		return
	}

	res, err := cl(req)
	log.Debug("RegisterCompany, HL response", string(res), err)
	if err != nil {
		return
	}

	/*type RegisterParticipantData struct {
		Participant string `json:"participant"`
		UserID      string `json:"userID"`
	}

	rp := RegisterParticipantData{
		Participant: "org.hyperledger.composer.system.NetworkAdmin#admin",
		UserID:      fmt.Sprintf("dev%d", id),
	}

	jsonData, err = json.Marshal(rp)
	log.Debug("HL req for create id", string(jsonData))
	req, err = http.NewRequest("POST", BlockchainUrl+RegisterParticipantUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		return
	}

	card, err = cl(req)
	log.Debug("Card", string(card))
	if err != nil {
		return
	}
	idStr := fmt.Sprintf("%d", id)
	err = h.ImportCard(idStr, card)*/
	return
}

func (h *HyperledgerApiStruct) CreateTrade(companyID uint, author string, tradeID uint, counterpartyID uint, validTime time.Time, requestType string, incoterm string) (err error) {

	j := struct {
		Class        string `json:"$class"`
		Author       string `json:"author"`
		TradeID      string `json:"tradeId"`
		RequestType  string `json:"requestType"`
		ValidTime    string `json:"validTime"`
		Owner        string `json:"owner"`
		Counterparty string `json:"counterparty"`
		Incoterm     string `json:"incoterm"`
	}{
		Class:        "org.ricex.net.txCreate",
		Author:       author,
		TradeID:      fmt.Sprintf("%d", tradeID),
		RequestType:  strings.ToUpper(requestType),
		ValidTime:    fmt.Sprint(validTime),
		Incoterm:     incoterm,
		Owner:        fmt.Sprintf("%s%d", "resource:org.ricex.net.Company#", companyID),
		Counterparty: fmt.Sprintf("%s%d", "resource:org.ricex.net.Company#", counterpartyID),
	}

	log.Debug("Trade:", j)

	locJson, err := json.Marshal(j)
	log.Debug(string(locJson))
	log.Debug(TradeUrl)
	if err != nil {
		log.Fatal(err)
	}

	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, TradeUrl, 0)
	return checkError(resp)
}

func (h *HyperledgerApiStruct) TradeSign(companyID uint, author string, tradeID uint) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txSign",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, SignContract, 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) TradeVessel(companyID uint, author string, tradeID uint) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txVessel",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, SignContract, 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) RejectVessel(companyID uint, author string, tradeID uint) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txRejectVessel",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, SignContract, 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) TradeInstructions(companyID uint, author string, tradeID uint, instructionsForHLString string) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Shipments   string `json:"shipments"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txCreateShipments",
		Author:      author,
		Shipments:   instructionsForHLString,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	log.Debug(j)
	resp, err := sendRequest(t, "POST", locJson, "/api/txCreateShipments", 0)
	log.Debug(string(resp), err)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) TradeAdvice(companyID uint, author string, tradeID uint) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txAdvice",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, "/api/txAdvice", 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

//TODO one method and different txComamnds for UploadDocument, ApproveDocument, RejectDocument, ReleaseForBuyerDocument, ConfirmDocument
func (h *HyperledgerApiStruct) UploadDocument(companyID uint, author string, tradeID uint, shipmentId uint, docId uint, docType string, sha256 string) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
		Type        string `json:"type"`
		Shipment    string `json:"shipment"`
		DocumentId  string `json:"documentId"`
		Sha256      string `json:"sha256"`
	}{
		Class:       "org.ricex.net.txUploadDocument",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
		Type:        docType,
		Shipment:    fmt.Sprintf("org.ricex.net.Shipment#%d", shipmentId),
		DocumentId:  fmt.Sprintf("%d", docId),
		Sha256:      sha256,
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	log.Debug("Upload doc", j)
	resp, err := sendRequest(t, "POST", locJson, "/api/txUploadDocument", 0)
	log.Debug(string(resp), err)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) ApproveDocument(companyID uint, author string, tradeID uint, docId uint, shipmentId uint, docType string) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
		DocumentId  string `json:"documentId"`
		Type        string `json:"type"`
		Shipment    string `json:"shipment"`
	}{
		Class:       "org.ricex.net.txApproveDocument",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
		DocumentId:  fmt.Sprintf("%d", docId),
		Type:        docType,
		Shipment:    fmt.Sprintf("org.ricex.net.Shipment#%d", shipmentId),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	log.Debug("Upload doc", j)
	resp, err := sendRequest(t, "POST", locJson, "/api/txApproveDocument", 0)
	log.Debug(string(resp), err)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) RejectDocument(companyID uint, author string, tradeID uint, docId uint, shipmentId uint, docType string) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
		DocumentId  string `json:"documentId"`
		Type        string `json:"type"`
		Shipment    string `json:"shipment"`
	}{
		Class:       "org.ricex.net.txRejectDocument",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
		DocumentId:  fmt.Sprintf("%d", docId),
		Type:        docType,
		Shipment:    fmt.Sprintf("org.ricex.net.Shipment#%d", shipmentId),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	log.Debug("Upload doc", j)
	resp, err := sendRequest(t, "POST", locJson, "/api/txRejectDocument", 0)
	log.Debug(string(resp), err)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) ReleaseForBuyerDocument(companyID uint, author string, tradeID uint, docId uint, shipmentId uint, docType string) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
		DocumentId  string `json:"documentId"`
		Type        string `json:"type"`
		Shipment    string `json:"shipment"`
	}{
		Class:       "org.ricex.net.txReleaseForBuyerDocument",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
		DocumentId:  fmt.Sprintf("%d", docId),
		Type:        docType,
		Shipment:    fmt.Sprintf("org.ricex.net.Shipment#%d", shipmentId),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	log.Debug("Upload doc", j)
	resp, err := sendRequest(t, "POST", locJson, "/api/txReleaseForBuyerDocument", 0)
	log.Debug(string(resp), err)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) RemoveDocument(companyID int64, author string, tradeID uint, docType string) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
		Document    string `json:"document"`
	}{
		Class:       "org.ricex.net.txRemoveDocument",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}

	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, "/api/txRemoveDocument", 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) ConfirmDocument(companyID uint, author string, tradeID uint) (state string, err error) {

	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txConfirmDocument",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}
	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, "/api/txConfirmDocument", 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) ProcessPayment(companyID uint, author string, tradeID uint) (state string, err error) {

	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txPayment",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}
	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, "/api/txPayment", 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) ConfirmPayment(companyID uint, author string, tradeID uint) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txAcceptPayment",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}
	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, "/api/txAcceptPayment", 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func (h *HyperledgerApiStruct) CloseTrade(companyID uint, author string, tradeID uint) (state string, err error) {
	j := struct {
		Class       string `json:"$class"`
		Author      string `json:"author"`
		Trade       string `json:"trade"`
		Participant string `json:"participant"`
	}{
		Class:       "org.ricex.net.txClose",
		Author:      author,
		Trade:       fmt.Sprintf("org.ricex.net.Trade#%d", tradeID),
		Participant: fmt.Sprintf("%s%d", "org.ricex.net.Company#", companyID),
	}
	locJson, err := json.Marshal(j)
	if err != nil {
		return
	}
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "POST", locJson, "/api/txClose", 0)
	if err != nil {
		return
	}

	err = checkError(resp)
	if err != nil {
		return
	}

	return getTradeState(t, tradeID)
}

func getTradeState(token string, tradeID uint) (state string, err error) {
	resp, err := sendRequest(token, "GET", []byte{}, fmt.Sprintf(GetTradeUrl, tradeID), 0)
	j := struct {
		ID    string `json:"tradeId"`
		State string `json:"state"`
	}{}
	err = json.Unmarshal(resp, &j)
	state = j.State
	return
}

func (h *HyperledgerApiStruct) GetDocumentHashState(companyID uint, documentID uint) (state string, err error) {
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	resp, err := sendRequest(t, "GET", []byte{}, fmt.Sprintf(GetDocumentUrl, documentID), 0)

	j := struct {
		Sha256 string `json:"sha256"`
	}{}
	err = json.Unmarshal(resp, &j)
	state = j.Sha256
	return
}

func (h *HyperledgerApiStruct) GetHistory(companyID uint, tradeID uint) (items []HistoryLog, err error) {
	t, err := h.GetJwt("admin")
	if err != nil {
		return
	}

	filter := fmt.Sprintf("/api/History?filter={\"where\":{\"trade\":%d}}", tradeID)
	resp, err := sendRequest(t, "GET", []byte{}, filter, 0)
	//log.Debug("resp", string(resp))
	if err != nil {
		return
	}
	err = json.Unmarshal(resp, &items)
	if err != nil {
		return
	}

	log.Debug(items)
	err = checkError(resp)
	return

}

type HistoryLog struct {
	Transaction string `json:"transactionId"`
	Comment     string `json:"comment"`
	Date        string `json:"date"`
	Author      string `json:"author"`
	Trade       string `json:"trade"`
	Company     string `json:"companyName"`
}

func checkError(resp []byte) error {
	if len(resp) > 0 {
		r := make(map[string]json.RawMessage)
		json.Unmarshal(resp, &r)
		if eData, ok := r["error"]; ok {
			err := &HyperledgerError{}
			json.Unmarshal(eData, err)
			return err
		}
	}
	return nil
}

func (h *HyperledgerApiStruct) GetTradeById(tradeId int) *Response {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s%s%d", os.Getenv("BLOCKCHAIN_URL"), "/api/Trade/", tradeId), nil)
	req.Header.Set("Content-type", "application/json")
	req.Header.Set("X-Access-Token", os.Getenv("GIT_HUB_TOKEN"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}

	defer resp.Body.Close()

	response := &Response{}
	json.NewDecoder(resp.Body).Decode(response)
	log.Debug("response trade by id:", response)
	return response
}

func sendRequest(token, method string, dataJson []byte, url string, attempt uint) (body []byte, err error) {
	req, err := http.NewRequest(method, fmt.Sprintf("%s%s", os.Getenv("BLOCKCHAIN_URL"), url), bytes.NewBuffer(dataJson))
	req.Header.Set("Content-type", "application/json")
	req.Header.Set("X-Access-Token", token)

	client := &http.Client{}
	log.Debug(req)
	resp, err := client.Do(req)
	if err != nil {
		if strings.Index(err.Error(), "MVCC_READ_CONFLICT") != -1 {
			if attempt < 4 {
				time.Sleep(1 * time.Second)
				attempt++
				log.Warn("MVCC_READ_CONFLICT error, try again ", attempt)
				return sendRequest(token, method, dataJson, url, attempt)
			} else {
				return
			}
		} else {
			return
		}
	}

	defer resp.Body.Close()

	body, err = ioutil.ReadAll(resp.Body)
	return
}

type Response struct {
	TradeId   string `json:"tradeId"`
	ValidTime string `json:"validTime"`
	Status    string `json:"status"`
}

type HyperledgerError struct {
	StatusCode int    `json:"statusCode"`
	Name       string `json:"name"`
	Message    string `json:"message"`
}

func (he *HyperledgerError) Error() string {
	return fmt.Sprintf("StatusCode: %d, %s %s", he.StatusCode, he.Name, he.Message)
}
