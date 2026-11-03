'use strict';
const { UnauthorizedError } = require('../helper/customErrors');
const { jwtVerify } = require('../helper/jwt');
const { User } = require('../models');

const verifyToken = async (req, _res, next) => {
  try {
    const authorization = req.get('authorization');
    // Preserve anonymous access on upstream optional-authentication routes.
    if (!authorization) return next();
    const match = /^Token\s+(\S+)$/i.exec(authorization) || /^Bearer\s+(\S+)$/i.exec(authorization);
    if (!match) throw new UnauthorizedError();
    let claims;
    try { claims = await jwtVerify(match[1]); }
    catch (_error) { throw new UnauthorizedError(); }
    if (!claims || typeof claims.email !== 'string') throw new UnauthorizedError();
    const loggedUser = await User.findOne({ where: { email: claims.email } });
    if (!loggedUser) throw new UnauthorizedError();
    req.loggedUser = loggedUser;
    req.loggedUser.dataValues.token = match[1];
    return next();
  } catch (error) { return next(error); }
};
module.exports = verifyToken;
