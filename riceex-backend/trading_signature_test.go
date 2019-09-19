package main

import (
	"net/http"

	. "github.com/onsi/ginkgo"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/testMocks"
)

var _ = Describe("Trading Signature", func() {

	initApp()

	Context("Trade request creation and signature workflow", func() {

		It("Should be able to register, activate and login all participants", func() {

			registerAndLoginUsersAndInspction()
		})

		It("Should be able to create new trade request", func() {
			tradeRequestID = createTradeRequest(user1Token, TRADE_ITEM_REQUEST_TYPE_SELL, TRADE_ITEM_INCOTERM_CIF)
		})

		It("Should be able to accept public trade request", func() {

			acceptPublicTradeRequest(user2Token, tradeRequestID)
		})

		It("Should not be able to sign trade request with wrong private key", func() {
			signTrade(user1Token, tradeRequestID, http.StatusInternalServerError, testMocks.GetWrongPrivateKey(), "")
		})

		It("Should not be able to sign trade request with correct private key but not participant", func() {
			signTrade(user3Token, tradeRequestID, http.StatusInternalServerError, testMocks.GetCorrectPrivateKey(), "")
		})

		It("Should be able to sign trade request by trade owner", func() {
			signTrade(user1Token, tradeRequestID, http.StatusOK, testMocks.GetCorrectPrivateKey(), TRADE_STATUS_DEAL)
		})

		It("Should be able to sign new trade request by counterparty", func() {
			signTrade(user2Token, tradeRequestID, http.StatusOK, testMocks.GetCorrectPrivateKey(), TRADE_STATUS_SIGNED)
		})

		It("Should not be able to sign trade request again", func() {
			signTrade(user1Token, tradeRequestID, http.StatusInternalServerError, testMocks.GetCorrectPrivateKey(), "")
		})

	})

})
