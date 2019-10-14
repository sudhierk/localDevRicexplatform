package main_test

import (
	"testing"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

//TODO auth header for each request (before each)
//TODO check HL condition, when HL will be done by Uruguay team
func TestRiceexBackend(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "RiceexBackend Suite")
}
