

1. Run Playground 
```
docker run --name composer-playground --publish 8080:8080 hyperledger/composer-playground
```

2. Load binaries
```
sudo chown -R $USER...
curl -sSL https://goo.gl/6wtTN5 | bash -s 1.1.0
```
#./bin/cryptogen generate --config=./crypto-config.yaml

3. Setup Network.
```



npm install -g passport-jwt jsonwebtoken


sudo chown -R $USER .
sudo chmod u+x ./1-deploy-blockchain.sh

./createPeerAdminCard.sh -h 92.53.66.51

composer archive create -t dir -n ./ricex-network -a ricex-network@0.0.1.bna
composer network install -c PeerAdmin@ricex-network -a ricex-network@0.0.1.bna
composer network start --networkName ricex-network --networkVersion 0.0.1 -A admin -S adminpw -c PeerAdmin@ricex-network
composer card import -f admin@ricex-network.card 

docker run -d --name mongo  -v /my/custom:/etc/mongo -p 27017:27017 mongo

```

4. Setup Deployment

4.1. Create user, login
    ```
    adduser hyper
    usermod -aG sudo hyper
    su hyper
    ```
    
4.2. Instal Hyperledger composer
    https://hyperledger.github.io/composer/v0.19/installing/installing-prereqs#ubuntu
    
```
curl -O https://hyperledger.github.io/composer/v0.19/prereqs-ubuntu.sh
chmod u+x prereqs-ubuntu.sh
./prereqs-ubuntu.sh
npm install -g composer-cli@0.19

``` 

