"use strict";

const { User } = require("../models");
const { jwtSign } = require("../helper/jwt");
const { bcryptHash, bcryptCompare } = require("../helper/bcrypt");
const {
  ValidationError,
  AlreadyTakenError,
} = require("../helper/customErrors");

const INVALID_CREDENTIALS = "Invalid email or password";

function requireUserPayload(body) {
  const user = body?.user;

  if (!user || typeof user !== "object" || Array.isArray(user)) {
    throw new ValidationError("A user object is required");
  }

  return user;
}

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} must be a non-empty string`);
  }

  return value.trim();
}

function validateEmail(value) {
  const email = requireText(value, "Email").toLowerCase();

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new ValidationError("A valid email address is required");
  }

  return email;
}

function validatePassword(value) {
  if (typeof value !== "string" || value.length < 12) {
    throw new ValidationError(
      "Password must contain at least 12 characters"
    );
  }

  return value;
}

// POST /api/users
const signUp = async (req, res, next) => {
  try {
    const input = requireUserPayload(req.body);

    const username = requireText(input.username, "Username");
    const email = validateEmail(input.email);
    const password = validatePassword(input.password);

    for (const field of ["bio", "image"]) {
      if (
        input[field] !== undefined &&
        input[field] !== null &&
        typeof input[field] !== "string"
      ) {
        throw new ValidationError(
          `${field} must be a string or null`
        );
      }
    }

    const existing = await User.findOne({
      where: { email },
    });

    if (existing) {
      throw new AlreadyTakenError("Email", "try logging in");
    }

    const user = await User.create({
      username,
      email,
      bio: input.bio,
      image: input.image,
      password: await bcryptHash(password),
    });

    user.dataValues.token = await jwtSign(user);

    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
};

// POST /api/users/login
const signIn = async (req, res, next) => {
  try {
    const input = requireUserPayload(req.body);

    const email = validateEmail(input.email);
    const password = requireText(input.password, "Password");

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      throw new ValidationError(INVALID_CREDENTIALS);
    }

    const validPassword = await bcryptCompare(
      password,
      user.password
    );

    if (!validPassword) {
      throw new ValidationError(INVALID_CREDENTIALS);
    }

    user.dataValues.token = await jwtSign(user);

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

module.exports = { signUp, signIn };
