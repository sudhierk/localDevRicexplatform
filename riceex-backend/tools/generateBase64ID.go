package tools

import (
	"crypto/rand"
	"encoding/base64"
	"strings"
)

func GenerateBase64ID(size int) (string, error) {
	b := make([]byte, size)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	encoded := strings.ToLower(base64.URLEncoding.EncodeToString(b))
	return encoded, nil
}
