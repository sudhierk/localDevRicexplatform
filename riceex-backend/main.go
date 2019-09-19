package main

import (
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	log "github.com/sirupsen/logrus"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gitlab.com/riceexchangeplatform/riceex-backend/api"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	_ "gitlab.com/riceexchangeplatform/riceex-backend/cron"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	// _ "gitlab.com/riceexchangeplatform/riceex-backend/docs"
	"gitlab.com/riceexchangeplatform/riceex-backend/jwtApiKeys"
	"gitlab.com/riceexchangeplatform/riceex-backend/services"
)

func init() {
	if os.Getenv("ENV") == constants.ENV_DEV {
		log.SetLevel(log.DebugLevel)
	}
	if os.Getenv("ENV") == constants.ENV_STAGE {
		log.SetLevel(log.DebugLevel)
	}
}

type App struct {
	Router *gin.Engine
	DB     *gorm.DB
}

func (a *App) Initialize() {

	log.SetFormatter(&log.TextFormatter{ForceColors: true,
		TimestampFormat: "02-01-2006 15:04:05",
		FullTimestamp:   true})

	checkFolders()

	log.Info("Env: ", os.Getenv("ENV"))

	a.Router = gin.Default()
	a.Router.Use(CORSMiddleware())
	a.Router.Static("/uploads", "./uploads")

	log.Info("blockchain url: ", os.Getenv("BLOCKCHAIN_URL"))

	log.Info("1. Init Keys...")
	jwtApiKeys.InitKeys(os.Getenv("KEY_PATH"))

	log.Info("2. Init Database...")
	a.DB = db.Init(os.Getenv("APP_DB"), true)
	time.Sleep(60 * time.Millisecond)
	//defer db.Connection.Close()

	log.Info("3. Init Mail...")
	services.Init(os.Getenv("MAIL_HOST"), os.Getenv("MAIL_ACCOUNT"), os.Getenv("MAIL_PASSWORD"), os.Getenv("MAIL_FROM"), os.Getenv("WEB_URL"))

	log.Info("4. Init API routes...")
	api.New(a.Router.Group("v1/api"))

	log.Info("5. Init WS...")
	services.NewWSService()

	log.Info("6. Init HL Api...")
	services.HyperledgerApi()
}

func (a *App) Run() {
	log.Info("7. Run API...")
	if os.Getenv("ENV") == constants.ENV_SANDBOX {
		a.Router.RunTLS(":8080", "/keys/testnet.ricex.io.chained.crt", "/keys/riceex.key")
	} else {
		webUrl := os.Getenv("WEB_URL")
		strurl := webUrl + ":8080/swagger/doc.json"
		url := ginSwagger.URL(strurl) // The url pointing to API definition
		log.Info("Swagger url ", strurl)
		a.Router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))
		a.Router.Run()
	}
}

// @title Swagger Riceex
// @version 1.0
// @license.name Apache 2.0
func main() {
	a := App{}
	a.Initialize()
	a.Run()
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func checkFolders() {
	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		os.Mkdir("uploads", 0777)
	}

	if _, err := os.Stat("uploads/templates"); os.IsNotExist(err) {
		os.Mkdir("uploads/templates", 0777)
	}

	if _, err := os.Stat("uploads/documents"); os.IsNotExist(err) {
		os.Mkdir("uploads/documents", 0777)
	}

	if _, err := os.Stat("uploads/inspection_reports"); os.IsNotExist(err) {
		os.Mkdir("uploads/inspection_reports", 0777)
	}

	if _, err := os.Stat("uploads/kyc_documents"); os.IsNotExist(err) {
		os.Mkdir("uploads/kyc_documents", 0777)
	}
}
