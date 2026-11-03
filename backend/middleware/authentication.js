"use strict";

const { UnauthorizedError } = require("../helper/customErrors");
const { jwtVerify } = require("../helper/jwt");

function createAuthentication({ verifyJwt, findUser }) {
  const authenticate = (required) => async (req, _res, next) => {
    try {
      const authorization = req.get("authorization");

      if (!authorization) {
        return required ? next(new UnauthorizedError()) : next();
      }

      const match = /^(?:Token|Bearer)\s+(\S+)$/i.exec(authorization);
      if (!match) throw new UnauthorizedError();

      let claims;
      try {
        claims = await verifyJwt(match[1]);
      } catch {
        throw new UnauthorizedError();
      }

      if (!claims || typeof claims.email !== "string" || !claims.email) {
        throw new UnauthorizedError();
      }

      const user = await findUser({
        where: { email: claims.email },
      });

      if (!user) throw new UnauthorizedError();

      req.loggedUser = user;
      req.loggedUser.dataValues.token = match[1];

      return next();
    } catch (error) {
      return next(error);
    }
  };

  const optional = authenticate(false);
  optional.required = authenticate(true);

  return optional;
}

const verifyToken = createAuthentication({
  verifyJwt: jwtVerify,
  findUser: (options) => require("../models").User.findOne(options),
});

module.exports = verifyToken;
module.exports.createAuthentication = createAuthentication;
