"use strict";

const path = require("node:path");
const { randomUUID } = require("node:crypto");
const request = require("supertest");

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";

describe.skipIf(!runIntegration)(
  "PostgreSQL authentication integration",
  () => {
    let app;
    let sequelize;
    let User;
    let bcryptCompare;
    let jwtVerify;
    let databaseVerified = false;

    const suffix = randomUUID().replace(/-/g, "").slice(0, 16);
    const email = `integration-${suffix}@example.test`;
    const username = `integration_${suffix}`;
    const password = "Strong-Test-Password-2026!";
    let token;

    beforeAll(async () => {
      // Refuse to access the development database.
      if (process.env.NODE_ENV !== "test") {
        throw new Error("Integration tests require NODE_ENV=test");
      }

      require("dotenv").config({
        path: path.resolve(process.cwd(), ".env"),
        quiet: true,
      });

      if (process.env.TEST_DB_NAME !== "clouddeploy_test") {
        throw new Error(
          "TEST_DB_NAME must be clouddeploy_test"
        );
      }

      if (!process.env.JWT_KEY ||
          process.env.JWT_KEY.length < 32) {
        throw new Error("A valid JWT_KEY is required");
      }

      ({ sequelize, User } = require("../models"));
      ({ bcryptCompare } = require("../helper/bcrypt"));
      ({ jwtVerify } = require("../helper/jwt"));

      await sequelize.authenticate();

      const [rows] = await sequelize.query(
        "SELECT current_database() AS name"
      );

      if (rows[0]?.name !== "clouddeploy_test") {
        throw new Error(
          `Unsafe database: ${rows[0]?.name}`
        );
      }

      databaseVerified = true;

      const { createApp } = require("../app");
      app = createApp({
        sequelize,
        mountRoutes: true,
        corsOrigins: [],
      });
    });

    afterAll(async () => {
      if (!sequelize) return;

      try {
        if (databaseVerified) {
          await User.destroy({
            where: { email },
          });
        }
      } finally {
        await sequelize.close();
      }
    });

    it("registers a user and securely persists the password", async () => {
      const response = await request(app)
        .post("/api/users")
        .send({
          user: {
            username,
            email,
            password,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(email);
      expect(response.body.user.password).toBeUndefined();
      expect(typeof response.body.user.token).toBe("string");

      const saved = await User.findOne({
        where: { email },
      });

      expect(saved).not.toBeNull();
      expect(saved.password).not.toBe(password);
      expect(
        await bcryptCompare(password, saved.password)
      ).toBe(true);
    });

    it("logs in and verifies the signed JWT", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          user: { email, password },
        });

      expect(response.status).toBe(200);

      token = response.body.user.token;
      expect(typeof token).toBe("string");

      const claims = await jwtVerify(token);
      expect(claims.email).toBe(email);
      expect(claims.username).toBe(username);
    });

    it("retrieves the authenticated current user", async () => {
      const response = await request(app)
        .get("/api/user")
        .set("Authorization", `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(email);
      expect(response.body.user.password).toBeUndefined();
    });

    it("rejects an incorrect password", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          user: {
            email,
            password: "Incorrect-Password-2026!",
          },
        });

      // Current Conduit behavior; authentication
      // response normalization comes later.
      expect(response.status).toBe(422);
      expect(response.body.user).toBeUndefined();
    });

    it("rejects anonymous and invalid-token access", async () => {
      const anonymous = await request(app)
        .get("/api/user");

      expect(anonymous.status).toBe(401);

      const invalid = await request(app)
        .get("/api/user")
        .set("Authorization", "Token invalid-token");

      expect(invalid.status).toBe(401);
    });
  }
);
