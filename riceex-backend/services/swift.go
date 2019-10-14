package services

import (
	"net/http"
	"os"

	"bytes"

	"encoding/json"

	"errors"
	"io/ioutil"

	"encoding/pem"

	"crypto/x509"

	"encoding/base64"

	"crypto"

	"github.com/fullsailor/pkcs7"
	"github.com/mastahyeti/cms"
	log "github.com/sirupsen/logrus"
)

func InitiateSWIFTPayment(requestJSON string) (response string, err error) {

	signPayload("test")
	return "", nil
	apiUrl := os.Getenv("SWIFT_API_URL")
	apiKey := os.Getenv("SWIFT_API_KEY")
	apiUrl = apiUrl + "/payment_initiation"
	log.Debug(apiUrl)
	log.Debug(apiKey)
	client := &http.Client{}
	req, _ := http.NewRequest("POST", apiUrl, bytes.NewBuffer([]byte(requestJSON)))
	req.Header.Add("x-api-key", apiKey)
	res, _ := client.Do(req)
	defer res.Body.Close()
	if res.StatusCode != http.StatusCreated {
		bodyBytes, err := ioutil.ReadAll(res.Body)
		if err != nil {
			log.Fatal(err)
		}
		bodyString := string(bodyBytes)
		log.Warn(bodyString)
		return "", errors.New(bodyString)
	}

	type uetrResponse struct {
		Uetr string `json:"uetr"`
	}

	decoder := json.NewDecoder(res.Body)
	var uetrRes uetrResponse
	err = decoder.Decode(&uetrRes)
	if err != nil {
		log.Warn(err)
		return "", err
	}
	log.Info("uetrRes: ", uetrRes.Uetr)
	payload, err := SWIFTGetPayload(uetrRes.Uetr)
	log.Info("payload: ", payload)
	signedPayload, err := signPayload(payload)
	_ = signedPayload
	signResult, err := SWIFTPOSTPayload(uetrRes.Uetr, signedPayload)
	log.Info("signResult: ", signResult)
	trackerStatus, err := SWIFTCheckPaymentStatus(uetrRes.Uetr)
	log.Info("trackerStatus: ", trackerStatus)
	return "", nil
}

func SWIFTGetPayload(uetr string) (payload string, err error) {

	apiUrl := os.Getenv("SWIFT_API_URL")
	apiKey := os.Getenv("SWIFT_API_KEY")
	apiUrl = apiUrl + "/payment_initiation/" + uetr + "/payload_unsigned"
	client := &http.Client{}
	req, _ := http.NewRequest("GET", apiUrl, nil)
	req.Header.Add("x-api-key", apiKey)
	res, _ := client.Do(req)

	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		bodyBytes, err := ioutil.ReadAll(res.Body)
		if err != nil {
			log.Fatal(err)
		}
		bodyString := string(bodyBytes)
		log.Warn(bodyString)
		return "", errors.New(bodyString)
	}

	bodyBytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Fatal(err)
	}
	bodyString := string(bodyBytes)

	return bodyString, nil
}

func SWIFTPOSTPayload(uetr, signedPayload string) (result string, err error) {

	apiUrl := os.Getenv("SWIFT_API_URL")
	apiKey := os.Getenv("SWIFT_API_KEY")
	apiUrl = apiUrl + "/payment_initiation/" + uetr + "/payload_signed"
	type signRequest struct {
		Paylaod string `json:"payload_signed"`
	}
	signReq := signRequest{Paylaod: signedPayload}
	signReqString, err := json.Marshal(signReq)
	_ = signReqString
	if err != nil {
		log.Warn(err)
		return "", err
	}
	client := &http.Client{}
	req, _ := http.NewRequest("POST", apiUrl, bytes.NewBuffer([]byte(signedPayload)))
	req.Header.Add("x-api-key", apiKey)
	res, _ := client.Do(req)

	defer res.Body.Close()

	if res.StatusCode != http.StatusCreated {
		bodyBytes, err := ioutil.ReadAll(res.Body)
		if err != nil {
			log.Fatal(err)
		}
		bodyString := string(bodyBytes)
		log.Warn(bodyString)
		return "", errors.New(bodyString)
	}

	bodyBytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Fatal(err)
	}
	bodyString := string(bodyBytes)

	return bodyString, nil
}

func SWIFTCheckPaymentStatus(uetr string) (result string, err error) {
	apiUrl := os.Getenv("SWIFT_API_URL")
	apiKey := os.Getenv("SWIFT_API_KEY")
	apiUrl = apiUrl + "/payment_initiation/" + uetr + "/tracker_status"
	client := &http.Client{}
	req, _ := http.NewRequest("GET", apiUrl, nil)
	req.Header.Add("x-api-key", apiKey)
	res, _ := client.Do(req)

	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		bodyBytes, err := ioutil.ReadAll(res.Body)
		if err != nil {
			log.Fatal(err)
		}
		bodyString := string(bodyBytes)
		log.Warn(bodyString)
		return "", errors.New(bodyString)
	}

	bodyBytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Fatal(err)
	}
	bodyString := string(bodyBytes)

	return bodyString, nil
}

func signPayload(payload string) (signedPayload string, err error) {

	// trim the bytes to actual length in call
	certFile, err := ioutil.ReadFile("keys/swiftTest/cert.pem")
	block, _ := pem.Decode(certFile)
	if block == nil {
		panic("failed to parse certificate PEM")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		log.Fatal("3", err)
	}
	log.Info(cert.Subject.CommonName)

	privKeyFile, err := ioutil.ReadFile("keys/swiftTest/key.pem")
	if err != nil {
		log.Fatal(err)
	}
	block, _ = pem.Decode([]byte(privKeyFile))
	privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		log.Fatal(err)
	}
	//keys parsed here

	der, _ := cms.Sign([]byte(payload), []*x509.Certificate{cert}, privKey.(crypto.Signer))
	sDer := base64.StdEncoding.EncodeToString(der)
	log.Info("version 1:", sDer)

	signedData1, _ := cms.NewSignedData([]byte(payload))
	signedData1.Sign([]*x509.Certificate{cert}, privKey.(crypto.Signer))
	signedData1.Detached()
	derEncoded, _ := signedData1.ToDER()
	sDer1 := base64.StdEncoding.EncodeToString(derEncoded)
	log.Info("version 2:", sDer1)

	// Initialize a SignedData struct with content to be signed
	signedData, err := pkcs7.NewSignedData([]byte(payload))
	if err != nil {
		log.Fatal("Cannot initialize signed data: %s", err)
	}

	// Add the signing cert and private key
	if err := signedData.AddSigner(cert, privKey, pkcs7.SignerInfoConfig{}); err != nil {
		log.Printf("Cannot add signer: %s", err)
	}

	signedData.Detach()
	// Finish() to obtain the signature bytes
	signature, err := signedData.Finish()

	if err != nil {
		log.Printf("Cannot finish signing data: %s", err)
	}
	pem.Encode(os.Stdout, &pem.Block{Type: "PKCS7", Bytes: signature})
	sEnc := base64.StdEncoding.EncodeToString(signature)
	//log.Info(sEnc)
	return sEnc, nil
}

func СheckSWIFT() {

	jsonReq := `{
  "requested_execution_date" : {
    "date" : "2019-01-02"
  },
  "amount" : {
    "instructed_amount" : {
      "currency" : "GBP",
      "amount" : "160000.00"
    }
  },
  "debtor" : {
    "name" : "PayingCorporate",
    "organisation_identification" : {
      "lei" : "5299000J2N45DDNE4Y28"
    }
  },
  "debtor_agent" : {
    "bicfi" : "KREDBEBB"
  },
  "creditor_agent" : {
    "bicfi" : "CITIGB2L"
  },
  "debtor_account" : {
    "iban" : "BE0473244135"
  },
  "creditor" : {
    "name" : "Receiving corp",
    "organisation_identification" : {
      "lei" : "6299300D2N76ADNE4Y55"
    }
  },
  "creditor_account" : {
    "iban" : "BE0473244135"
  },
  "remittance_information" : "arn:aws:acm-pca:eu-west-1:522843637103:certificate-authority\/e2a9c0fd-b62e-44a9-bcc2-02e46a1f61c2",
  "payment_identification" : {
    "end_to_end_identification" : "MyInVoice2You"
  }
}`
	InitiateSWIFTPayment(jsonReq)
}
