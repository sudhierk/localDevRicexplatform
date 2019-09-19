package jwtApiKeys

import (
	"crypto/rsa"
	"fmt"
	"io/ioutil"
	"log"
	"time"

	"github.com/dgrijalva/jwt-go"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

var ApiKeys apiKeys

type apiKeys struct {
	verifyKey *rsa.PublicKey
	signKey   *rsa.PrivateKey
}

func InitKeys(path string) {
	ApiKeys = apiKeys{}

	signBytes, err := ioutil.ReadFile(path + "/app")
	if err != nil {
		log.Fatal(err)
	}

	ApiKeys.signKey, err = jwt.ParseRSAPrivateKeyFromPEM(signBytes)
	if err != nil {
		log.Fatal(err)
	}

	verifyBytes, err := ioutil.ReadFile(path + "/app.pub")
	if err != nil {
		log.Fatal(err)
	}

	ApiKeys.verifyKey, err = jwt.ParseRSAPublicKeyFromPEM(verifyBytes)
	if err != nil {
		log.Fatal(err)
	}
}

func (a *apiKeys) ParseToken(tokenString string) (token *jwt.Token, err error) {
	token, err = jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			msg := fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			return nil, msg
		}
		return a.verifyKey, nil
	})
	return
}

func (a *apiKeys) CreateToken(user *db.User, companyId uint) (token string, err error) {
	t := jwt.New(jwt.SigningMethodRS256)
	claims := make(jwt.MapClaims)
	claims["exp"] = time.Now().Add(time.Hour * time.Duration(210240)).Unix()
	claims["iat"] = time.Now().Unix()
	claims["id"] = user.ID
	claims["companyId"] = companyId
	t.Claims = claims
	token, err = t.SignedString(a.signKey)
	return
}

func (a *apiKeys) CreateHlToken(company string) (token string, err error) {
	t := jwt.New(jwt.SigningMethodRS256)
	claims := make(jwt.MapClaims)
	claims["exp"] = time.Now().Add(time.Minute * time.Duration(30)).Unix()
	claims["iat"] = time.Now().UnixNano()
	claims["id"] = company
	t.Claims = claims
	token, err = t.SignedString(a.signKey)
	return
}
