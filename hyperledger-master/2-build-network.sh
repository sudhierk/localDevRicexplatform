#!/usr/bin/env bash
export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"

composer archive create -t dir -n ./ricex-network -a ricex-network@0.0.1.bna
composer network install -c root@ricex-network -a ricex-network@0.0.1.bna
composer network start --networkName ricex-network --networkVersion 0.0.1 -A admin -S adminpw -c  root@ricex-network
composer card import -f ./admin@ricex-network.card
composer network ping -c admin@ricex-network