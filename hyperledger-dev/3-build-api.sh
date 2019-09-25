#!/usr/bin/env bash
export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"

export COMPOSER_PROVIDERS='{
   "jwt": {
    "provider": "jwt",
    "module": "/home/administrator/.nvm/versions/node/v8.16.1/lib/custom-jwt.js",
    "secretOrKey": "-----BEGIN PUBLIC KEY-----\nMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMreQxUy0g3yRIJ85Bf7PEwh0J03FH95\nw4LXlYIWyNhTuZmawYq4EpLLY2oVEPJXmtcE5BUHnhh104GX5GVoroUCAwEAAQ==\n-----END PUBLIC KEY-----",
    "authScheme": "saml",
    "successRedirect": "/",
    "failureRedirect":"/"
   }
}'

composer-rest-server -c admin@ricex-network \
    -n always \
    -a true \
    -m false \
    -w true
