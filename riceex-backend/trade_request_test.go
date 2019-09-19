package main

import (
	. "github.com/onsi/ginkgo"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
)

var _ = Describe("Trade request (private and public)", func() {

	initApp()

	Context("Trade request creation", func() {

		It("Should be able to register, activate and login all participants", func() {

			registerAndLoginUsersAndInspction()
		})

		It("Should be able to create new trade request", func() {
			tradeRequestID = createTradeRequest(user1Token, TRADE_ITEM_REQUEST_TYPE_SELL, TRADE_ITEM_INCOTERM_CIF)
		})

		//TODO edit TR
		//TODO cancel
		//TODO search TR
		//TODO create private TR
		//TODO reject private TR

		It("Should be able to accept public trade request", func() {

			acceptPublicTradeRequest(user2Token, tradeRequestID)
		})

		//TODO user cannot accept own TR

	})

})
