package api

import (
	"errors"

	"net/http"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	"gitlab.com/riceexchangeplatform/riceex-backend/jwtApiKeys"
	"gitlab.com/riceexchangeplatform/riceex-backend/services"
)

type wsApi struct {
	*auth
}

func (a *wsApi) Routes(r gin.IRoutes) {
	r.GET("/:token", a.Connect)
}

func (a *wsApi) Connect(ctx *gin.Context) {

	tokenString, _ := ctx.Params.Get("token")

	token, err := jwtApiKeys.ApiKeys.ParseToken(tokenString)
	if err != nil {
		a.unauthorized(ctx, http.StatusUnauthorized, err.Error())
		return
	}

	claims := token.Claims.(jwt.MapClaims)

	if claims["id"] != nil {
		ctx.Set("UserID", uint(claims["id"].(float64)))
	}

	if claims["companyId"] != nil {
		ctx.Set("CompanyID", uint(claims["companyId"].(float64)))
	}

	ctx.Set("JWT_CLAIMS", claims)

	userId, ok := ctx.Get("UserID")

	user, err := db.UserModel(nil).Get(userId.(uint), false, true, false)

	if !ok {
		HandleError(ctx, errors.New("invalid User ID"), nil, "")
		return
	}

	services.WSHandler(userId.(uint), user.Company.CompanyType, ctx.Writer, ctx.Request)
}
