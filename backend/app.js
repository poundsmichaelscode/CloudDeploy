'use strict';

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('node:crypto');
const { log } = require('./observability/logger');
const { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } = require('./helper/customErrors');

/** Pure application factory; importing this file never starts the server or touches the DB. */
function createApp({ sequelize, mountRoutes = true, corsOrigins = [] }) {
  if (!sequelize || typeof sequelize.authenticate !== 'function') {
    throw new TypeError('A Sequelize connection with authenticate() is required');
  }
  const app = express();
  app.disable('x-powered-by');
  // The ALB terminates TLS. Do not blindly trust arbitrary forwarded headers.
  app.set('trust proxy', false);
  app.use((req, res, next) => {
    const started = process.hrtime.bigint();
    req.requestId = randomUUID();
    res.setHeader('x-request-id', req.requestId);
    res.on('finish', () => log('info', 'http_request', {
      requestId: req.requestId, method: req.method, path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
    }));
    next();
  });
  app.use(cors({ origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  } }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/health/live', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/health/ready', async (_req, res) => {
    try {
      await sequelize.authenticate();
      return res.status(200).json({ status: 'ready', checks: { database: 'ok' } });
    } catch (err) {
      log('error', 'readiness_failed', { error: err });
      return res.status(503).json({ status: 'not_ready', checks: { database: 'unavailable' } });
    }
  });

  if (mountRoutes) {
    // The upstream Conduit API contract remains unchanged.
    app.use('/api/users', require('./routes/users'));
    app.use('/api/user', require('./routes/user'));
    app.use('/api/articles', require('./routes/articles'));
    app.use('/api/profiles', require('./routes/profiles'));
    app.use('/api/tags', require('./routes/tags'));
    if (process.env.NODE_ENV === 'production') {
      const path = require('node:path');
      app.use(express.static(path.resolve(__dirname, '../frontend/dist')));
    } else {
      app.get('/', (_req, res) => res.json({ status: 'API is running on /api' }));
    }
  }
  app.use((_req, res) => res.status(404).json({ errors: { body: ['Not found'] } }));
  app.use((err, req, res, _next) => {
    log('error', 'unhandled_request_error', { requestId: req.requestId, error: err });
    if (res.headersSent) return _next(err);
    const status = err instanceof UnauthorizedError ? 401
      : err instanceof ForbiddenError ? 403
      : err instanceof NotFoundError ? 404
      : err instanceof ValidationError ? 422 : 500;
    const message = status === 500 ? 'Internal server error' : err.message;
    return res.status(status).json({ errors: { body: [message] }, requestId: req.requestId });
  });
  return app;
}
module.exports = { createApp };
