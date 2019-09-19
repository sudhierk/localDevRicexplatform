#!/usr/bin/env bash
export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"

composer archive create -t dir -n ./ricex-network -a ricex-network@0.0.3.bna
composer network install -c root@ricex-network -a ricex-network@0.0.3.bna
composer network upgrade --networkName ricex-network --networkVersion 0.0.3 -c  root@ricex-network
