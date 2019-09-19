#!/usr/bin/env bash

export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"

#./fabric-tools/stopFabric.sh
#./fabric-tools/teardownFabric.sh
composer card delete -c root@ricex-network
./fabric-tools/startFabric.sh
./fabric-tools/createPeerAdminCard.sh -h localhost
composer card export -c root@ricex-network -f root@ricex.card

