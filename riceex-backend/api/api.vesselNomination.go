package api

import (
	"errors"
	"net/http"

	"time"

	"github.com/gin-gonic/gin"
	. "gitlab.com/riceexchangeplatform/riceex-backend/constants"
	"gitlab.com/riceexchangeplatform/riceex-backend/db"
	. "gitlab.com/riceexchangeplatform/riceex-backend/notifications"
	"gitlab.com/riceexchangeplatform/riceex-backend/requests"
	. "gitlab.com/riceexchangeplatform/riceex-backend/services"

	"os"

	"github.com/sanity-io/litter"
	log "github.com/sirupsen/logrus"
)

// Put smart vessel godoc
// @Summary Put smart vessel
// @Description Put smart vessel
// @Tags trade
// @Accept json
// @Produce json
// @Param req body requests.VesselNominationRequest true "vessel nomination request"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/smart/nominate_vessel [put]
func (a *tradeApi) smartNominateVessel(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":   "nominate vessel",
		"user":  scx.User.ID,
		"trade": scx.Trade.ID,
	})

	var req = &requests.VesselNominationRequest{}
	err = ctx.BindJSON(&req)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	if scx.Trade.SellerID == nil || scx.Trade.BuyerID == nil {
		HandleError(ctx, errors.New("trade doesn't have seller and buyer yet"), contextLogger, "")
		return
	}

	if scx.User.ID == *scx.Trade.SellerID && scx.Trade.TradeItem.InspectionID == nil && req.InspectionCompanyID == nil {
		HandleError(ctx, errors.New("trade doesn't have inspection company, so must be provided by vessel nomination"), contextLogger, "")
		return
	}

	if scx.User.ID == *scx.Trade.BuyerID && req.InspectionCompanyID != nil {
		HandleError(ctx, errors.New("buyer can't set inspection company, only seller can"), contextLogger, "")
		return
	}

	if scx.Trade.Status != TRADE_STATUS_SIGNED {
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	if scx.Trade.VesselNomination.Nominated == true {
		HandleError(ctx, errors.New("vessel already nominated"), contextLogger, "")
		return
	}

	contextLogger.Info(litter.Sdump(req))

	if scx.Trade.TradeItem.Incoterm == TRADE_ITEM_INCOTERM_FOB {
		if scx.User.CompanyID == *scx.Trade.BuyerID {
			scx.Trade.VesselNomination.Nominated = true
		} else {
			contextLogger.Warn("only buyer can nominate vessel for FOB")
			HandleError(ctx, errors.New("only buyer can nominate vessel for FOB"), contextLogger, "")
			return
		}
	} else if scx.Trade.TradeItem.Incoterm == TRADE_ITEM_INCOTERM_CIF {
		if scx.User.CompanyID == *scx.Trade.SellerID {
			scx.Trade.VesselNomination.Nominated = true
			scx.Trade.VesselNomination.Accepted = true
			scx.Trade.Status = TRADE_STATUS_VESSEL_NOMINATED
		} else {
			contextLogger.Warn("only seller can nominate vessel CIF")
			HandleError(ctx, errors.New("only seller can nominate vessel CIF"), contextLogger, "")
			return
		}
	} else {
		contextLogger.Warn("wrong incoterm value " + scx.Trade.TradeItem.Incoterm)
		HandleError(ctx, errors.New("wrong incoterm value "+scx.Trade.TradeItem.Incoterm), contextLogger, "")
		return
	}

	if scx.Trade.TradeItem.InspectionID != nil && req.InspectionCompanyID != nil {
		HandleError(ctx, errors.New("inspection must be selected only once"), contextLogger, "")
		return
	}

	if req.LaycanDateFrom.After(req.LaycanDateTo) {
		contextLogger.Debug(req.LaycanDateFrom)
		contextLogger.Debug(req.LaycanDateTo)
		HandleError(ctx, errors.New("laycan from must be before laycan to"), contextLogger, "")
		return
	}
	scx.Trade.VesselNomination.Message = req.Message
	scx.Trade.VesselNomination.LaycanDateTo = req.LaycanDateTo
	scx.Trade.VesselNomination.LaycanDateFrom = req.LaycanDateFrom
	if req.InspectionCompanyID != nil {
		contextLogger.Info("inspection company was set by vessel", *req.InspectionCompanyID)
		scx.Trade.TradeItem.InspectionID = req.InspectionCompanyID
		inspCompany, err := db.CompanyModel(nil).Get(*req.InspectionCompanyID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		userByCompany, err := db.UserModel(nil).GetByCompany(inspCompany.ID)
		notification := NotificationStruct{
			ReceiverID: userByCompany.ID,
			Message: &NotificationMessageStruct{
				Initiator: scx.User.UserProfile.FullName(),
				Type:      INSPECTION_WAS_CHOOSED_NOTIF,
				Data:      GetTradeIdString(scx.Trade.ID),
				Date:      time.Now(),
			},
		}
		SendNotification(&notification)
	}

	scx.Trade.VesselNomination.InspectionCompanyID = req.InspectionCompanyID
	scx.Trade.VesselNomination.Name = req.Name

	if os.Getenv("ENV") != ENV_TEST {
		state, err := a.hl.TradeVessel(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		log.Info("state after vessel nomination from HL:", state)
	}

	err = db.TradeModel(nil).Save(scx.Trade)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notificationReceiverId := scx.Trade.OwnerID
	if scx.User.CompanyID == *scx.Trade.SellerID {
		notificationReceiverId = *scx.Trade.BuyerID
	} else {
		notificationReceiverId = *scx.Trade.SellerID
	}
	notification := NotificationStruct{
		ReceiverID: notificationReceiverId,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_REQUEST_VESSEL_NOMINATED_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: scx.Trade.Status,
	})
}

// Put smart vessel godoc
// @Summary Put smart vessel
// @Description Put smart vessel
// @Tags trade
// @Accept json2f
// @Produce json
// @Param req body requests.VesselNominationAcceptRequest true "vessel nomination accept request"
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/smart/accept_vessel_nomination [put]
func (a *tradeApi) smartAcceptVessel(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	var req = &requests.VesselNominationAcceptRequest{}
	err = ctx.BindJSON(&req)
	if HandleError(ctx, err, nil, "") {
		return
	}

	if scx.Trade.TradeItem.InspectionID != nil && req.InspectionCompanyID != nil {
		HandleError(ctx, errors.New("inspection must be selected only once"), nil, "")
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":   "accept vessel",
		"user":  scx.User.ID,
		"trade": scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_SIGNED {
		contextLogger.Warn("wrong trade status " + scx.Trade.Status)
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	if !scx.Trade.VesselNomination.Nominated {
		HandleError(ctx, errors.New("vessel is not nominated"), contextLogger, "")
		return
	}

	if scx.Trade.TradeItem.Incoterm == TRADE_ITEM_INCOTERM_FOB {
		if scx.User.CompanyID == *scx.Trade.BuyerID {
			HandleError(ctx, errors.New("only seller can accept vessel for FOB"), contextLogger, "")
			return
		} else {
			scx.Trade.VesselNomination.Accepted = true
			scx.Trade.Status = TRADE_STATUS_VESSEL_NOMINATED
		}
	} else if scx.Trade.TradeItem.Incoterm == TRADE_ITEM_INCOTERM_CIF {
		HandleError(ctx, errors.New("only vessel for FOB incoterm must be accepted, but not for CIF"), contextLogger, "")
		return
	} else {
		HandleError(ctx, errors.New("wrong incoterm value "+scx.Trade.TradeItem.Incoterm), contextLogger, "")
		return
	}

	if os.Getenv("ENV") != ENV_TEST {
		scx.Trade.Status, err = a.hl.TradeVessel(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		log.Info("state after HL:", scx.Trade.Status)
	} else {
		scx.Trade.Status = TRADE_STATUS_VESSEL_NOMINATED
	}

	if req.InspectionCompanyID != nil {
		contextLogger.Info("inspection company was set by vessel accept")
		scx.Trade.TradeItem.InspectionID = req.InspectionCompanyID
		scx.Trade.VesselNomination.InspectionCompanyID = req.InspectionCompanyID

		inspCompany, err := db.CompanyModel(nil).Get(*req.InspectionCompanyID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		userByCompany, err := db.UserModel(nil).GetByCompany(inspCompany.ID)
		notification := NotificationStruct{
			ReceiverID: userByCompany.ID,
			Message: &NotificationMessageStruct{
				Initiator: scx.User.UserProfile.FullName(),
				Type:      INSPECTION_WAS_CHOOSED_NOTIF,
				Data:      GetTradeIdString(scx.Trade.ID),
				Date:      time.Now(),
			},
		}
		SendNotification(&notification)
	}

	err = db.TradeModel(nil).Save(scx.Trade)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	notificationReceiverId := scx.Trade.OwnerID
	if scx.User.CompanyID == *scx.Trade.SellerID {
		notificationReceiverId = *scx.Trade.BuyerID
	} else {
		notificationReceiverId = *scx.Trade.SellerID
	}
	notification := NotificationStruct{
		ReceiverID: notificationReceiverId,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_REQUEST_VESSEL_NOMINATION_APPROVED_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: scx.Trade.Status,
	})
}

// Reject smart vessel godoc
// @Summary Reject smart vessel
// @Description Reject smart vessel
// @Tags trade
// @Accept json
// @Produce json
// @Success 200 {object} api.StatusMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/smart/reject_vessel_nomination [put]
func (a *tradeApi) smartRejectVessel(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	contextLogger := log.WithFields(log.Fields{
		"api":   "reject vessel",
		"user":  scx.User.ID,
		"trade": scx.Trade.ID,
	})

	if scx.Trade.Status != TRADE_STATUS_SIGNED {
		contextLogger.Warn("wrong trade status " + scx.Trade.Status)
		HandleError(ctx, errors.New("wrong trade status "+scx.Trade.Status), contextLogger, "")
		return
	}

	if !scx.Trade.VesselNomination.Nominated {
		HandleError(ctx, errors.New("vessel is not nominated"), contextLogger, "")
		return
	}

	if scx.Trade.TradeItem.Incoterm == TRADE_ITEM_INCOTERM_FOB {
		if scx.User.CompanyID == *scx.Trade.BuyerID {
			HandleError(ctx, errors.New("only seller can reject vessel for FOB"), contextLogger, "")
		} else {
			scx.Trade.VesselNomination.Nominated = false
		}
	} else if scx.Trade.TradeItem.Incoterm == TRADE_ITEM_INCOTERM_CIF {
		HandleError(ctx, errors.New("only vessel for FOB incoterm can be rejected, but not for CIF"), contextLogger, "")
	} else {
		HandleError(ctx, errors.New("wrong incoterm value "+scx.Trade.TradeItem.Incoterm), contextLogger, "")
		return
	}

	if os.Getenv("ENV") != ENV_TEST {
		scx.Trade.Status, err = a.hl.RejectVessel(scx.User.CompanyID, scx.User.UserProfile.FullName(), scx.Trade.ID)
		if HandleError(ctx, err, contextLogger, "") {
			return
		}
		log.Info("state after HL:", scx.Trade.Status)
	} else {
		scx.Trade.Status = TRADE_STATUS_SIGNED
	}

	err = db.TradeModel(nil).Save(scx.Trade)
	if HandleError(ctx, err, contextLogger, "") {
		return
	}

	contextLogger.Info("rejected successfully")

	notificationReceiverId := scx.Trade.OwnerID
	if scx.User.CompanyID == *scx.Trade.SellerID {
		notificationReceiverId = *scx.Trade.BuyerID
	} else {
		notificationReceiverId = *scx.Trade.SellerID
	}
	notification := NotificationStruct{
		ReceiverID: notificationReceiverId,
		Message: &NotificationMessageStruct{
			Initiator: scx.User.UserProfile.FullName(),
			Type:      TRADE_REQUEST_VESSEL_NOMINATION_REJECTED_NOTIF,
			Data:      GetTradeIdString(scx.Trade.ID),
			Date:      time.Now(),
		},
	}
	SendNotification(&notification)

	ctx.JSON(http.StatusOK, StatusMessage{
		Status: scx.Trade.Status,
	})
}

// Get smart vessel godoc
// @Summary Get smart vessel
// @Description Get smart vessel
// @Tags trade
// @Accept json
// @Produce json
// @Success 200 {object} api.SmartVesselMessage
// @Failure 500 {object} api.ErrorMessage
// @Router /trade/{id}/smart/vessel_nomination [get]
func (a *tradeApi) smartGetVessel(ctx *gin.Context) {
	scx, err := a.context(ctx)
	if HandleError(ctx, err, nil, "") {
		return
	}

	if scx.User.CompanyID != *scx.Trade.SellerID &&
		scx.User.CompanyID != *scx.Trade.BuyerID {
		HandleError(ctx, errors.New("user doesn't have access to sign this trade"), nil, "")
		return
	}

	ctx.JSON(http.StatusOK, SmartVesselMessage{
		Vessel: scx.Trade.VesselNomination,
	})
}
