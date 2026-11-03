"use strict";

const jwt = require("jsonwebtoken");
const { jwtSign, jwtVerify } = require("../helper/jwt");

const TEST_SECRET =
  "clouddeploy-test-only-key-32-characters-minimum";

const testUser = {
  username: "securitytester",
  email: "security@example.com",
};

const originalSecret = process.env.JWT_KEY;

beforeEach(() => {
  process.env.JWT_KEY = TEST_SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_KEY;
  } else {
    process.env.JWT_KEY = originalSecret;
  }
});

describe("JWT security", () => {
  it("signs HS256 tokens with a 15-minute expiry", async () => {
    const token = await jwtSign(testUser);

    const claims = jwt.decode(token, { complete: true });

    expect(claims.header.alg).toBe("HS256");
    expect(claims.payload.email).toBe(testUser.email);
    expect(claims.payload.exp - claims.payload.iat).toBe(900);
  });

  it("verifies a valid signed token", async () => {
    const token = await jwtSign(testUser);

    const claims = await jwtVerify(token);

    expect(claims.username).toBe(testUser.username);
    expect(claims.email).toBe(testUser.email);
  });

  it("rejects expired tokens", async () => {
    const token = jwt.sign(testUser, TEST_SECRET, {
      algorithm: "HS256",
      expiresIn: -1,
    });

    await expect(jwtVerify(token)).rejects.toThrow(
      "jwt expired"
    );
  });

  it("rejects tokens signed using another algorithm", async () => {
    const token = jwt.sign(testUser, TEST_SECRET, {
      algorithm: "HS384",
    });

    await expect(jwtVerify(token)).rejects.toThrow();
  });

  it("rejects tokens with invalid signatures", async () => {
    const token = jwt.sign(
      testUser,
      "another-test-key-with-sufficient-length",
      { algorithm: "HS256" }
    );

    await expect(jwtVerify(token)).rejects.toThrow(
      "invalid signature"
    );
  });

  it("rejects missing JWT secrets", async () => {
    delete process.env.JWT_KEY;

    await expect(jwtSign(testUser)).rejects.toThrow(
      "JWT_KEY must contain at least 32 characters"
    );
  });
});
