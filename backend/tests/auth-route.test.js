"use strict";

const express = require("express");
const request = require("supertest");

const {
  createAuthentication,
} = require("../middleware/authentication");

function buildApp({ verifyJwt, findUser }) {
  const app = express();

  const auth = createAuthentication({ verifyJwt, findUser });

  app.get("/optional", auth, (req, res) => {
    res.json({
      authenticated: Boolean(req.loggedUser),
    });
  });

  app.get("/private", auth.required, (req, res) => {
    res.json({
      email: req.loggedUser.email,
    });
  });

  app.use((error, _req, res, _next) => {
    const status = error.name === "UnauthorizedError" ? 401 : 500;
    res.status(status).json({
      errors: {
        body: [status === 500 ? "Internal server error" : error.message],
      },
    });
  });

  return app;
}

const fakeUser = {
  email: "tester@example.com",
  dataValues: {},
};

function setup(overrides = {}) {
  const verifyJwt =
    overrides.verifyJwt ||
    vi.fn(async () => ({ email: fakeUser.email }));

  const findUser =
    overrides.findUser ||
    vi.fn(async () => ({ ...fakeUser, dataValues: {} }));

  return {
    app: buildApp({ verifyJwt, findUser }),
    verifyJwt,
    findUser,
  };
}

describe("HTTP authentication routes", () => {
  it("allows anonymous access on optional routes", async () => {
    const { app, findUser } = setup();

    const res = await request(app).get("/optional");

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
    expect(findUser).not.toHaveBeenCalled();
  });

  it("rejects anonymous access on protected routes", async () => {
    const { app, findUser } = setup();

    const res = await request(app).get("/private");

    expect(res.status).toBe(401);
    expect(findUser).not.toHaveBeenCalled();
  });

  it("accepts valid credentials on protected routes", async () => {
    const { app } = setup();

    const res = await request(app)
      .get("/private")
      .set("Authorization", "Token valid-example");

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(fakeUser.email);
  });

  it("rejects malformed authorization headers", async () => {
    const { app } = setup();

    const res = await request(app)
      .get("/private")
      .set("Authorization", "InvalidScheme abc");

    expect(res.status).toBe(401);
  });

  it("rejects invalid JWTs", async () => {
    const { app } = setup({
      verifyJwt: vi.fn(async () => {
        throw new Error("invalid signature");
      }),
    });

    const res = await request(app)
      .get("/private")
      .set("Authorization", "Token invalid-example");

    expect(res.status).toBe(401);
  });

  it("rejects tokens belonging to unknown users", async () => {
    const { app } = setup({
      findUser: vi.fn(async () => null),
    });

    const res = await request(app)
      .get("/private")
      .set("Authorization", "Bearer valid-example");

    expect(res.status).toBe(401);
  });

  it("does not disguise database errors as authentication errors", async () => {
    const { app } = setup({
      findUser: vi.fn(async () => {
        throw new Error("database connection failed");
      }),
    });

    const res = await request(app)
      .get("/private")
      .set("Authorization", "Token valid-example");

    expect(res.status).toBe(500);
    expect(res.text).not.toContain("database connection failed");
  });
});
