FROM node:10.13 as builder
ARG build_env

#RUN apk add --update git make curl

WORKDIR /root/riceex
COPY . .

#COPY truffle/build src/static

RUN echo ${build_env}
RUN yarn \
    && yarn build:${build_env}

FROM nginx:1.15-alpine

COPY --from=builder /root/riceex/build /usr/share/nginx/riceex

# Copy custom configuration file from the current directory
COPY nginx.conf /etc/nginx/conf.d/riceex.conf
COPY .htpasswd /etc/nginx/conf.d/.htpasswd

EXPOSE 80

