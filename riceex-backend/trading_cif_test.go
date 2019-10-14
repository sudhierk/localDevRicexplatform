package main

import (
	"net/http"
	"os"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/testMocks"
)

var _ = Describe("Trading CIF", func() {

	initApp()

	Context("Trade request creation and cif workflow", func() {

		documents := make(map[string]uint)

		It("Should be able to register, activate and login all participants", func() {

			registerAndLoginUsersAndInspction()
		})

		It("Should be able to create new trade request", func() {
			tradeRequestID = createTradeRequest(user1Token, TRADE_ITEM_REQUEST_TYPE_SELL, TRADE_ITEM_INCOTERM_CIF)
		})

		It("Should be able to accept public trade request", func() {

			acceptPublicTradeRequest(user2Token, tradeRequestID)
		})

		//TODO can't sign with wrong priv key
		It("Should be able to sign trade request by trade owner", func() {
			signTrade(user1Token, tradeRequestID, http.StatusOK, testMocks.GetCorrectPrivateKey(), TRADE_STATUS_DEAL)
		})

		It("Should be able to sign new trade request by counterparty", func() {
			signTrade(user2Token, tradeRequestID, http.StatusOK, testMocks.GetCorrectPrivateKey(), TRADE_STATUS_SIGNED)
		})

		It("Should not be able to nominate vessel by not participant", func() {

			nominateVessel(user3Token, tradeRequestID, &userInspectionID, http.StatusInternalServerError, "")
		})

		It("Should not be able to nominate vessel by buyer for CIF", func() {

			nominateVessel(user2Token, tradeRequestID, &userInspectionID, http.StatusInternalServerError, "")
		})

		It("Should be able to nominate vessel by seller for CIF", func() {

			nominateVessel(user1Token, tradeRequestID, &userInspectionID, http.StatusOK, TRADE_STATUS_VESSEL_NOMINATED)
		})

		It("Should be able to get vessel nomination for participants", func() {

			vessel := getVesselNomination(user1Token, tradeRequestID, http.StatusOK)
			Expect(vessel.Vessel.Nominated).To(Equal(true))
			Expect(vessel.Vessel.Accepted).To(Equal(true))
		})

		It("Should not be able to get vessel nomination for not participants", func() {

			getVesselNomination(user3Token, tradeRequestID, http.StatusInternalServerError)
		})

		It("Should not be able to accept or reject vessel, it is accepted automatically when seller provides it", func() {

			acceptVessel(user1Token, tradeRequestID, nil, http.StatusInternalServerError, "")
			acceptVessel(user2Token, tradeRequestID, nil, http.StatusInternalServerError, "")

			rejectVessel(user1Token, tradeRequestID, http.StatusInternalServerError, "")
			rejectVessel(user2Token, tradeRequestID, http.StatusInternalServerError, "")
		})

		It("Should be able to send Documentary instruction by buyer", func() {

			sendDocumentaryInstructtions(user2Token, tradeRequestID, TRADE_STATUS_INSTRUCTIONS)
		})

		It("Should be able to send advice by seller", func() {

			sendShipmentAdvice(user1Token, tradeRequestID, TRADE_STATUS_ADVICE)
		})

		It("Should be able to upload bill by seller", func() {

			documents[DOCUMENT_BILL] = uploadBill(user1Token, tradeRequestID, TRADE_STATUS_ADVICE)
		})

		It("Should be able to upload invoice by seller", func() {

			documents[DOCUMENT_INVOICE] = uploadInvoice(user1Token, tradeRequestID, testMocks.GetCorrectPrivateKey(), TRADE_STATUS_ADVICE)
		})

		It("Should be able to upload docs buy inspection", func() {
			documents[DOCUMENT_CERT_OF_QUALITY] = uploadDocByUser(DOCUMENT_CERT_OF_QUALITY, userInspectionToken, tradeRequestID)
			documents[DOCUMENT_CERT_OF_WEIGHT] = uploadDocByUser(DOCUMENT_CERT_OF_WEIGHT, userInspectionToken, tradeRequestID)
			documents[DOCUMENT_CERT_OF_FUMIGATION] = uploadDocByUser(DOCUMENT_CERT_OF_FUMIGATION, userInspectionToken, tradeRequestID)
			documents[DOCUMENT_QUALITY_APPEARANCE_CERT] = uploadDocByUser(DOCUMENT_QUALITY_APPEARANCE_CERT, userInspectionToken, tradeRequestID)
			documents[DOCUMENT_CERT_OF_PACKING] = uploadDocByUser(DOCUMENT_CERT_OF_PACKING, userInspectionToken, tradeRequestID)
		})

		It("Should be able to upload docs buy seller", func() {
			documents[DOCUMENT_PHYTOSANITARY] = uploadDocByUser(DOCUMENT_PHYTOSANITARY, user1Token, tradeRequestID)
			documents[DOCUMENT_NON_GMO] = uploadDocByUser(DOCUMENT_NON_GMO, user1Token, tradeRequestID)
			documents[DOCUMENT_EXPORT_DECLARATION] = uploadDocByUser(DOCUMENT_EXPORT_DECLARATION, user1Token, tradeRequestID)
			documents[DOCUMENT_INSURANCE] = uploadDocByUser(DOCUMENT_INSURANCE, user1Token, tradeRequestID)
		})

		It("Should be able to approve all docs by seller", func() {
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_CERT_OF_QUALITY], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_CERT_OF_WEIGHT], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_CERT_OF_FUMIGATION], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_QUALITY_APPEARANCE_CERT], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_CERT_OF_PACKING], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_PHYTOSANITARY], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_NON_GMO], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_EXPORT_DECLARATION], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_INSURANCE], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_BILL], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_ADVICE)
			approveDocByUser(user1Token, tradeRequestID, documents[DOCUMENT_INVOICE], DOCUMENT_STATUS_APPROVED_BY_SELLER, TRADE_STATUS_DOCUMENTS)
		})

		It("Should be able to make payment for buyer", func() {
			initiatePayment(user2Token, tradeRequestID, TRADE_STATUS_PAYMENT)
		})

		It("Should be able to confirm payment for seller", func() {
			confirmPayment(user1Token, tradeRequestID, TRADE_STATUS_PAYED)
		})

		It("Should be able to close trade by seller", func() {
			closeTrade(user1Token, tradeRequestID, TRADE_STATUS_PAYED)
		})

		It("Should be able to close trade by buyer", func() {
			closeTrade(user2Token, tradeRequestID, TRADE_STATUS_CLOSED)
		})

		It("Should be able to delete all uploads aftee test", func() {
			err := os.RemoveAll("uploads/documents")
			Expect(err).NotTo(HaveOccurred())
		})

	})

})
