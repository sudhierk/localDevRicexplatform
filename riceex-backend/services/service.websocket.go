package services

import (
	"net/http"

	log "github.com/sirupsen/logrus"

	"encoding/json"

	"time"

	"github.com/gorilla/websocket"
	"gitlab.com/riceexchangeplatform/riceex-backend/constants"
)

const (
	pingPeriod = 5 * time.Second
)

var clients = make(map[uint]*websocket.Conn)
var clientsRoles = make(map[uint]string)

var broadcast = make(chan *NotificationStruct)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	HandshakeTimeout: 45 * time.Second,
}

func NewWSService() {
	go wsNotificationSender()
}

func SendWSNotification(notification *NotificationStruct) {
	broadcast <- notification
}

func WSHandler(userId uint, userRole string, w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	go sendPing(ws, userId)
	// register client
	clients[userId] = ws
	clientsRoles[userId] = userRole
}

func sendPing(c *websocket.Conn, userId uint) {
	ticker := time.NewTicker(pingPeriod)
	for {
		select {
		case <-ticker.C:
			if err := c.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				log.Warn("ping ws error ", err)
				return
			}
		}
	}
}

func wsNotificationSender() {

	for {
		val := <-broadcast
		notification, err := json.Marshal(val.Message)
		if err != nil {
			log.Printf("notification marshal error: %s", err)
		}
		if val.ReceiverID == 0 {
			for userId, client := range clients {
				if userId == val.Message.InitiatorID {
					log.Debug("user was skipped form receivers list ", userId)
					continue
				}
				if val.ExcludeInspections && clientsRoles[userId] == constants.COMPANY_INSPECTION {
					continue
				}
				err := client.WriteMessage(websocket.TextMessage, notification)
				if err != nil {
					log.Warn("Websocket error: %s", err)
					client.Close()
					delete(clients, userId)
					delete(clientsRoles, userId)
				}
			}
		} else if clients[val.ReceiverID] != nil {
			err = clients[val.ReceiverID].WriteMessage(websocket.TextMessage, notification)
			if err != nil {
				log.Printf("Websocket error: %s", err)
				clients[val.ReceiverID].Close()
				delete(clients, val.ReceiverID)
				delete(clientsRoles, val.ReceiverID)
			}
		} else {
			log.Warn("WS receivers socket is nil")
		}

	}
}
