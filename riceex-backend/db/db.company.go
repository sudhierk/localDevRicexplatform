package db

import (
	"github.com/jinzhu/gorm"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
)

type companyModel struct {
	db *gorm.DB
}

func CompanyModel(tx *gorm.DB) *companyModel {
	if tx == nil {
		tx = Connection
	}
	return &companyModel{db: tx}
}

func (m *companyModel) CheckUnique(name string, tax string, country string) (unique bool, err error) {

	cn := 0
	unique = true
	err = m.db.Model(&Company{}).Where("(name = ? or tax = ?) and (country = ?)", name, tax, country).Count(&cn).Error
	if cn > 0 {
		unique = false
	}
	return
}

func (m *companyModel) GetAllUsers(companyId uint) (count uint, err error) {
	return 1, nil
}

func (m *companyModel) GetPreload(id uint, preloadCertificateIncorporation bool) (сompany *Company, err error) {

	сompany = &Company{}
	if preloadCertificateIncorporation {
		err = m.db.Model(&Company{}).Preload("CertificateOfIncorporation").Where("ID = ?", id).Find(сompany).Error
	} else {
		err = m.db.Model(&Company{}).Where("ID = ?", id).Find(сompany).Error
	}

	return
}

func (m *companyModel) Get(id uint) (сompany *Company, err error) {
	return m.GetPreload(id, false)
}

func (m *companyModel) GetCounterParties(companyId uint, search string) (companies []Company, err error) {

	companies = []Company{}
	err = m.db.Model(&Company{}).
		Joins("left join users on users.company_id = companies.id").
		Where("users.status = ?", constants.USER_STATUS_ACTIVE).
		Where("lower(name) LIKE ?", "%"+search+"%").
		Where("companies.ID != ? AND company_type != ?", companyId, constants.COMPANY_INSPECTION).Find(&companies).Error
	return
}

func (m *companyModel) GetByType(companyId uint, companyType string) (companies []Company, err error) {

	companies = []Company{}
	err = m.db.Model(&Company{}).
		Joins("left join users on users.company_id = companies.id").
		Where("users.status = ?", constants.USER_STATUS_ACTIVE).
		Where("companies.ID != ? AND company_type = ?", companyId, companyType).Find(&companies).Error
	return
}

func (m *companyModel) Save(company *Company) (err error) {

	err = m.db.Save(company).Error
	return
}

func (m *companyModel) Find(user User, skip, take, sortOrder interface{}) (companies []Company,
	count uint, err error) {

	return m.FindByKYC(user, false, skip, take, sortOrder)
}

func (m *companyModel) FindByKYC(user User, byKyc, skip, take, sortOrder interface{}) (companies []Company,
	count uint, err error) {

	dbObj := Connection.Model(&Company{}).
		Set("gorm:auto_preload", true).
		Offset(skip).Limit(take)

	sort := "created_at" + " " + sortOrder.(string)
	dbObj = dbObj.Order(sort)

	companies = []Company{}
	if byKyc != nil && byKyc.(bool) {
		dbObj = dbObj.
			Joins("left join company_kycs on companies.id = company_kycs.company_id").
			Where("company_kycs.status = ? or company_kycs.status = ? ", constants.KYC_STATUS_NEW,
				constants.KYС_STATUS_EDITING)
	} else {
		dbObj = dbObj.Find(&companies)
	}

	err = dbObj.Find(&companies).Offset(0).Limit(-1).Count(&count).Error

	return
}
