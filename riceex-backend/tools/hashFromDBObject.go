package tools

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"strings"
	"time"

	"gitlab.com/riceexchangeplatform/riceex-backend/db"
)

func GetBillHash(bill db.ShipmentBill) string {

	str := bill.BillNumber +
		bill.ShippingComp +
		bill.Shipper +
		bill.Consignee +
		bill.VessVoyage +
		bill.BookingRef +
		bill.ShipperRef +
		fmt.Sprint(bill.QuantCleanOnBoard) +
		bill.FreightsCharges +
		bill.DeclaredValue +
		bill.PlaceIssue +
		strings.Split(bill.DateIssue.Format(time.RFC3339), "+")[0] +
		bill.CarriersAgentsEndorsm +
		bill.NotifyParties +
		bill.PortOfLoad +
		bill.PortOfDischarge +
		bill.PackGoodsDescript +
		bill.Marking +
		bill.CarrierReceipt +
		strings.Split(bill.ShippedOnBoard.Format(time.RFC3339), "+")[0]
	h := sha256.New()
	h.Write([]byte(str))
	return hex.EncodeToString(h.Sum(nil))
}

func GetInvoiceHash(invoice db.TradeInvoice) string {

	str := invoice.InvoiceNo + invoice.BankRequisites + fmt.Sprint(invoice.TotalAmount)
	h := sha256.New()
	h.Write([]byte(str))
	return hex.EncodeToString(h.Sum(nil))
}
