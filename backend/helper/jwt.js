"use strict";

const jwt = require("jsonwebtoken");

const ALGORITHM = "HS256";
const TOKEN_TTL = "15m";

function getJwtSecret() {
  const secret = process.env.JWT_KEY;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_KEY must contain at least 32 characters"
    );
  }

  return secret;
}

module.exports.jwtSign = async (user) => {
  if (
    !user ||
    typeof user.email !== "string" ||
    !user.email.trim() ||
    typeof user.username !== "string" ||
    !user.username.trim()
  ) {
    throw new TypeError("A valid user is required");
  }

  return jwt.sign(
    {
      username: user.username,
      email: user.email,
    },
    getJwtSecret(),
    {
      algorithm: ALGORITHM,
      expiresIn: TOKEN_TTL,
    }
  );
};

module.exports.jwtVerify = async (token) => {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: [ALGORITHM],
  });
};
