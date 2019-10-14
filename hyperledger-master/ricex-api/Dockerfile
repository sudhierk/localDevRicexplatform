FROM hyperledger/composer-rest-server:0.19.20


RUN npm install --production loopback-connector-mongodb passport-jwt passport-github && \
    npm cache clean --force && \
    ln -s node_modules .node_modules

RUN mkdir -p /home/composer/.composer

COPY ./ricex-api/providers.json /home/composer/.npm-global/lib/node_modules/composer-rest-server/server/providers.json

COPY ./ricex-api/custom-jwt.js /home/composer/custom-jwt.js
RUN cat /home/composer/.npm-global/lib/node_modules/composer-rest-server/lib/util.js
RUN cat /home/composer/.npm-global/lib/node_modules/composer-rest-server/server/server.js
COPY ./ricex-api/util.js /home/composer/.npm-global/lib/node_modules/composer-rest-server/lib/util.js
COPY ./ricex-api/passport-configurator.js  /home/composer/.npm-global/lib/node_modules/composer-rest-server/node_modules/loopback-component-passport/lib/passport-configurator.js
