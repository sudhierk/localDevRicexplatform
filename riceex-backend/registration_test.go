package main

import (
	. "github.com/onsi/ginkgo"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
)

var _ = Describe("Registration", func() {

	initApp()

	Context("Registration, activation and login", func() {
		BeforeEach(func() {

		})

		It("Should be able to register new user", func() {

			clearDB()
			migrateDB()

			registerNewUser(user1ID, "test1@test.com", COMPANY_EXPORTER, "taxNumber1", "companyName1", false)
		})

		It("Should return error when using the same email for user registration", func() {

			registerNewUser(user1ID, "test1@test.com", COMPANY_EXPORTER, "taxNumber1", "companyName1", true)
		})

		It("Should be able to activate new user", func() {

			activateNewUser(user1ID)
		})

		It("Should be able to login new user", func() {

			login("test1@test.com")
		})

	})

})
