package api

import (
	"errors"
	"net/http"
	"strings"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/jwtApiKeys"
)

var (
	error_InvalidRequest          = errors.New("invalid Request")
	error_VerificationNotRequired = errors.New("verification not required")
	error_IvalidCode              = errors.New("invalid verification code")
	error_CodeExpired             = errors.New("verification code expired")
)

type auth struct {
	realm string
}

func (a *auth) AuthorizationChecker() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.Request.Header.Get("Authorization")
		if !strings.HasPrefix(tokenString, "Bearer ") {
			a.unauthorized(c, http.StatusUnauthorized, "No Authorization Header")
			return
		}
		token, err := jwtApiKeys.ApiKeys.ParseToken(strings.TrimPrefix(tokenString, "Bearer "))
		if err != nil {
			a.unauthorized(c, http.StatusUnauthorized, err.Error())
			return
		}
		claims := token.Claims.(jwt.MapClaims)

		if claims["id"] != nil {
			c.Set("UserID", uint(claims["id"].(float64)))
		}

		if claims["companyId"] != nil {
			c.Set("CompanyID", uint(claims["companyId"].(float64)))
		}

		c.Set("JWT_CLAIMS", claims)
		c.Next()
		return
	}
}

func (a *auth) InspectionChecker() gin.HandlerFunc {
	return func(c *gin.Context) {

		companyId, _ := c.Get("CompanyID")
		company, err := db.CompanyModel(nil).Get(companyId.(uint))

		if err != nil {
			a.unauthorized(c, http.StatusUnauthorized, err.Error())
			return
		}
		if company.CompanyType == constants.COMPANY_INSPECTION {
			c.Next()
		} else {
			a.unauthorized(c, http.StatusUnauthorized, "company is not inspector")
			return
		}
	}
}

func (a *auth) PlatformAdminChecker() gin.HandlerFunc {
	return func(c *gin.Context) {

		userId, _ := c.Get("UserID")
		user, err := db.UserModel(nil).Get(userId.(uint), false, false, false)

		if err != nil {
			a.unauthorized(c, http.StatusUnauthorized, err.Error())
			return
		}
		if user.UserType == constants.USER_TYPE_PLATFORM_ADMIN {
			c.Next()
		} else {
			a.unauthorized(c, http.StatusUnauthorized, "user is not platform admin")
			return
		}
	}
}

func (a *auth) CompanyOrPlatformAdminChecker() gin.HandlerFunc {
	return func(c *gin.Context) {

		userId, _ := c.Get("UserID")
		user, err := db.UserModel(nil).Get(userId.(uint), false, false, false)

		if err != nil {
			a.unauthorized(c, http.StatusUnauthorized, err.Error())
			return
		}
		if user.UserType == constants.USER_TYPE_COMPANY_ADMIN || user.UserType == constants.USER_TYPE_PLATFORM_ADMIN {
			c.Next()
		} else {
			a.unauthorized(c, http.StatusUnauthorized, "user is not admin")
			return
		}
	}
}

func (a *auth) CompanyAdminChecker() gin.HandlerFunc {
	return func(c *gin.Context) {

		userId, _ := c.Get("UserID")
		user, err := db.UserModel(nil).Get(userId.(uint), false, false, false)

		if err != nil {
			a.unauthorized(c, http.StatusUnauthorized, err.Error())
			return
		}
		if user.UserType == constants.USER_TYPE_COMPANY_ADMIN {
			c.Next()
		} else {
			a.unauthorized(c, http.StatusUnauthorized, "user is not company admin")
			return
		}
	}
}

func (a *auth) unauthorized(c *gin.Context, code int, message string) {
	c.Header("WWW-Authenticate", "JWT realm="+a.realm)
	c.Abort()

	c.JSON(code, gin.H{
		"code":    code,
		"message": message,
	})
	return
}
