package db

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"

	"os"
	"os/exec"

	log "github.com/sirupsen/logrus"
)

var Connection *gorm.DB

func Init(connectionString string, migrate bool) (db *gorm.DB) {
	log.Info("DB migrate ", migrate)
	log.Debug(connectionString)
	var err error
	Connection, err = Connect(connectionString, migrate)
	if err != nil {
		log.Fatal(err.Error())
	}

	if migrate {
		command := "goose"
		migrationsDir := "./db/migrations"
		//on docker
		if _, err := os.Stat("./migrations/goose"); err == nil {
			command = "./goose"
			migrationsDir = "./migrations"
		}
		log.Info("goose path and folder", command, migrationsDir)

		cmd := exec.Command(command, "postgres", connectionString, "up")
		cmd.Dir = migrationsDir
		_, err = cmd.Output()
		if err != nil {
			log.Fatal(err)
		}
	}
	return Connection
}

func Connect(connectionString string, migrate bool) (result *gorm.DB, err error) {
	result, err = gorm.Open("postgres", connectionString)
	result.LogMode(false)
	if err != nil {
		return nil, err
	}
	if migrate {
		result.AutoMigrate(
			&User{},
			&UserProfile{},
			&Company{},
			&TradeRequest{},
			&TradeItem{},
			&VesselNomination{},
			&Comment{},
			&DocumentComment{},
			&FileInspectionReport{},
			&FileTemplate{},
			&FileDocument{},
			&KYCDocument{},
			&InspectionReport{},
			&Shipment{},
			&DocumentaryInstructions{},
			&ShipmentBill{},
			&ShipmentDocument{},
			&TradeInvoice{},
			&City{},
			&Notification{},
			&Bid{},
			&Shipment{},
			&CompanyKYC{},
			&Invite{},
			&Permission{})
	}

	result.Model(&User{}).AddForeignKey("permission_id", "permissions(id)", "CASCADE", "RESTRICT")

	result.Model(&User{}).AddForeignKey("user_profile_id", "user_profiles(id)", "CASCADE", "RESTRICT")

	result.Model(&User{}).AddForeignKey("company_id", "companies(id)", "CASCADE", "RESTRICT")

	result.Model(&TradeRequest{}).AddForeignKey("trade_item_id", "trade_items(id)", "CASCADE", "RESTRICT")

	result.Model(&TradeRequest{}).AddForeignKey("vessel_nomination_id", "vessel_nominations(id)", "CASCADE", "RESTRICT")

	result.Model(&Comment{}).AddForeignKey("request_id", "trade_requests(id)", "RESTRICT", "RESTRICT")

	result.Model(&DocumentaryInstructions{}).AddForeignKey("trade_item_id", "trade_items(id)", "RESTRICT", "RESTRICT")

	result.Model(&Shipment{}).AddForeignKey("trade_item_id", "trade_items(id)", "RESTRICT", "RESTRICT")

	result.Model(&Shipment{}).AddForeignKey("bill_id", "shipment_bills(id)", "CASCADE", "RESTRICT")

	result.Model(&InspectionReport{}).AddForeignKey("file_id", "file_inspection_reports(id)", "CASCADE", "RESTRICT")

	result.Model(&CompanyKYC{}).AddForeignKey("company_id", "companies(id)", "CASCADE", "RESTRICT")

	return
}
