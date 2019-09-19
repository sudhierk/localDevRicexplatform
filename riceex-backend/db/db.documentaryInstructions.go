package db

import (
	"github.com/jinzhu/gorm"
)

type docInstructionsModel struct {
	db *gorm.DB
}

func DocInstructionsModel(tx *gorm.DB) *docInstructionsModel {
	if tx == nil {
		tx = Connection
	}
	return &docInstructionsModel{db: tx}
}

func (m *docInstructionsModel) Get(id uint) (docInstructions *DocumentaryInstructions, err error) {

	docInstructions = &DocumentaryInstructions{}
	err = m.db.Model(&DocumentaryInstructions{}).Where("ID = ?", id).Find(docInstructions).Error
	return
}

func (m *docInstructionsModel) GetByTradeId(tradeId uint) (docInstructions *DocumentaryInstructions, err error) {

	docInstructions = &DocumentaryInstructions{}
	err = m.db.Model(&DocumentaryInstructions{}).Where("trade_item_id = ?", tradeId).Find(docInstructions).Error
	return
}

func (m *docInstructionsModel) Save(docInstructions *DocumentaryInstructions) (err error) {

	err = m.db.Save(docInstructions).Error
	return
}
