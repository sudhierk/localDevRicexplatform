package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"

	log "github.com/sirupsen/logrus"
	"gitlab.com/riceexchangeplatform/riceex-backend/jwtApiKeys"
)

type requestFunc func(request *http.Request) ([]byte, error)

func (h *HyperledgerApiStruct) GetJwt(company string) (token string, err error) {
	client := &http.Client{}
	url := fmt.Sprintf("/auth/jwt/callback")
	t, err := jwtApiKeys.ApiKeys.CreateHlToken(company)
	log.Debug("Get Jwt, token ", t)
	if err != nil {
		return
	}

	req, err := http.NewRequest("GET", BlockchainUrl+url, nil)
	log.Debug("GetJwt blockchain url: ", BlockchainUrl+url)
	if err != nil {
		return
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", t))
	resp, err := client.Do(req)
	/*log.Debug("GetJwt response", resp)
	buf := new(bytes.Buffer)
	buf.ReadFrom(resp.Body)
	newStr := buf.String()
	log.Debug("resp.Body String", newStr)*/
	if err != nil {
		return
	}
	if resp.StatusCode != 200 {
		err = fmt.Errorf("HTTP Error Code: %d", resp.StatusCode)
		return
	}
	defer resp.Body.Close()

	var r = struct {
		Token string `json:"access_token"`
	}{}

	err = json.NewDecoder(resp.Body).Decode(&r)
	if err != nil {
		log.Debug("json error")
		return
	}
	token = r.Token
	log.Debug("GetJwt, New Token: ", token)
	return
}

func (h *HyperledgerApiStruct) Connect(company string) (res requestFunc, err error) {
	client := &http.Client{}
	log.Debug("jwt for", company)
	token, err := h.GetJwt(company)
	res = func(req *http.Request) (result []byte, err error) {
		req.Header.Set("Content-type", "application/json")
		req.Header.Set("X-Access-Token", token)
		client = &http.Client{}
		httpResp, err := client.Do(req)
		if err != nil {
			return
		}

		if httpResp.StatusCode != 200 {
			log.Debug("Connect JL http response: ", httpResp)
			err = fmt.Errorf("HTTP Error Code: %d", httpResp.StatusCode)
			return
		}
		defer httpResp.Body.Close()

		result, err = ioutil.ReadAll(httpResp.Body)
		return
	}
	return
}

func (h *HyperledgerApiStruct) ImportCard(name string, card []byte) (err error) {
	token, err := h.GetJwt(name)
	var remoteURL = BlockchainUrl + AuthUrl + name

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	r := bytes.NewReader(card)

	part, _ := w.CreateFormFile("card", name+"@ricex.card")
	io.Copy(part, r)

	w.Close()

	req, err := http.NewRequest("POST", remoteURL, &buf)
	req.Header.Set("X-Access-Token", token)
	req.Header.Add("Accept", "application/json")
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return
	}
	if res.StatusCode != http.StatusNoContent {
		err = fmt.Errorf("bad status: %s", res.Status)
	}
	return
}
