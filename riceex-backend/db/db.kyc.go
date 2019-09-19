package db

import (
	"fmt"
	"strings"

	"github.com/jinzhu/gorm"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
)

type kycModel struct {
	db *gorm.DB
}

func KYCModel(tx *gorm.DB) *kycModel {
	if tx == nil {
		tx = Connection
	}
	return &kycModel{db: tx}
}

func (m *kycModel) Get(id int) (kyc *CompanyKYC, err error) { //get the last one

	kyc = &CompanyKYC{}
	err = m.db.Model(&CompanyKYC{}).Preload("Company").Preload("CertificateOfIncorporation").
		Where("id = ?", id).Find(kyc).Error
	return
}

func (m *kycModel) GetNotReviewedByCompany(companyId uint) (kyc *CompanyKYC, err error) { //get the last one

	kyc = &CompanyKYC{}
	err = m.db.Model(&CompanyKYC{}).Preload("Company").Preload("CertificateOfIncorporation").
		Where("company_id = ? and status != ? and status != ? ", companyId, constants.KYC_STATUS_APPROVED, constants.KYC_STATUS_DECLINED).Find(kyc).Error
	return
}

func (m *kycModel) Save(kyc *CompanyKYC) (err error) {
	err = m.db.Save(kyc).Error
	return
}

func (m *kycModel) Create(kyc *CompanyKYC) (err error) {

	err = m.db.Create(kyc).Error
	return
}

func (m *kycModel) Find(statusesStr, visited, skip, take, sortBy, sortOrder interface{}) (kycs []CompanyKYC, count uint, err error) {

	statuses := strings.Split(fmt.Sprintf("%v", statusesStr), ",")

	statusesArr := make([]interface{}, len(statuses))
	var strstatuses = "("
	for i := 0; i < len(statuses)-1; i++ {
		strstatuses += "?, "
		statusesArr[i] = statuses[i]
	}
	if len(statuses) > 0 {
		strstatuses += "?)"
		statusesArr[len(statuses)-1] = statuses[len(statuses)-1]
	} else {
		strstatuses += ")"
	}

	dbObj := Connection.Model(&CompanyKYC{})

	if visited != "" && statuses[0] != "" {
		statusesArr = append(statusesArr, visited)
		dbObj = dbObj.Where("status in "+strstatuses+" and visited_by_platform_admin = ?", statusesArr...)
	} else if statuses[0] != "" {
		dbObj = dbObj.Where("status in "+strstatuses, statusesArr...)
	} else if visited != "" {
		dbObj = dbObj.Where("visited_by_platform_admin = ? ", visited)
	}

	dbObj = dbObj.Set("gorm:auto_preload", true).
		Offset(skip).Limit(take)

	if sortBy == "" {
		sortBy = "created_at"
	}
	sort := SortField(sortBy.(string)) + " " + sortOrder.(string)
	dbObj = dbObj.Order(sort)

	kycs = []CompanyKYC{}
	err = dbObj.Find(&kycs).Offset(0).Limit(-1).Count(&count).Error

	return
}
