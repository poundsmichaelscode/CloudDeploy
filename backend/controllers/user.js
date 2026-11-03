'use strict';
const { UnauthorizedError, ValidationError } = require('../helper/customErrors');
const { bcryptHash } = require('../helper/bcrypt');
const { jwtSign } = require('../helper/jwt');

const allowedFields = new Set(['username', 'email', 'bio', 'image', 'password']);

const currentUser = async (req, res, next) => {
  try {
    if (!req.loggedUser) throw new UnauthorizedError();
    res.json({ user: req.loggedUser });
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = req.loggedUser;
    if (!user) throw new UnauthorizedError();
    const changes = req.body?.user;
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      throw new ValidationError('A user object is required');
    }
    for (const field of Object.keys(changes)) {
      if (!allowedFields.has(field)) throw new ValidationError(`Field ${field} cannot be updated`);
    }
    for (const field of ['username', 'email']) {
      if (Object.hasOwn(changes, field) &&
        (typeof changes[field] !== 'string' || !changes[field].trim())) {
        throw new ValidationError(`${field} must be a non-empty string`);
      }
    }
    for (const field of ['bio', 'image']) {
      if (Object.hasOwn(changes, field) &&
        changes[field] !== null && typeof changes[field] !== 'string') {
        throw new ValidationError(`${field} must be a string or null`);
      }
    }
    if (Object.hasOwn(changes, 'password') &&
      (typeof changes.password !== 'string' || changes.password.length < 12)) {
      throw new ValidationError('Password must contain at least 12 characters');
    }
    const emailChanged = Object.hasOwn(changes, 'email') && changes.email !== user.email;
    for (const field of ['username', 'email', 'bio', 'image']) {
      if (Object.hasOwn(changes, field)) user[field] = changes[field];
    }
    if (Object.hasOwn(changes, 'password')) user.password = await bcryptHash(changes.password);
    await user.save();
    if (emailChanged) user.dataValues.token = await jwtSign(user);
    res.json({ user });
  } catch (error) { next(error); }
};

module.exports = { currentUser, updateUser };
