package notifications

import "strconv"

func GetTradeIdString(id uint) string {
	return "{\"tradeID\":" + strconv.Itoa(int(id)) + "}"
}

func GetDocumentNotifString(tradeID, shipmentID uint, docType string) string {
	return "{\"tradeID\":" + strconv.Itoa(int(tradeID)) + ",\"shipmentID\":" + strconv.Itoa(int(shipmentID)) + ",\"docType\":\"" + docType + "\"}"
}
