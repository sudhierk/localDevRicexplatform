FROM golang:1.10-alpine

RUN apk add --no-cache git
RUN apk add --no-cache g++

WORKDIR /go/src/gitlab.com/riceexchangeplatform/riceex-backend

COPY . .
RUN go get -u github.com/pressly/goose/cmd/goose
RUN go get -u github.com/swaggo/swag/cmd/swag

WORKDIR /root/
RUN chmod +x /go/bin/swag
RUN /go/bin/swag init --dir=/go/src/gitlab.com/riceexchangeplatform/riceex-backend --output=/go/src/gitlab.com/riceexchangeplatform/riceex-backend/docs

WORKDIR /go/src/gitlab.com/riceexchangeplatform/riceex-backend
RUN GOARCH=amd64 GOOS=linux go build -o riceex_api .


FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=0 /go/src/gitlab.com/riceexchangeplatform/riceex-backend/db/migrations ./migrations
COPY --from=0 /go/src/gitlab.com/riceexchangeplatform/riceex-backend/keys ./keys
COPY --from=0 /go/src/gitlab.com/riceexchangeplatform/riceex-backend/cards ./cards
COPY --from=0 /go/src/gitlab.com/riceexchangeplatform/riceex-backend/riceex_api .
COPY --from=0 /go/bin/goose ./migrations/


RUN chmod +x ./migrations/goose
RUN chmod +x ./riceex_api

EXPOSE 8080

CMD ["./riceex_api"]
