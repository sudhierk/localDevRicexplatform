'use strict';

const passportJwt = require('passport-jwt');
const util = require('util');

console.log("CustomJwtStrategy")
function CustomJwtStrategy(options, verify) {
    console.log("CustomJwtStrategy")
    options.jwtFromRequest = passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken();
    passportJwt.Strategy.call(this, options, verify);
}

util.inherits(CustomJwtStrategy, passportJwt.Strategy);

module.exports = {
    Strategy: CustomJwtStrategy
};