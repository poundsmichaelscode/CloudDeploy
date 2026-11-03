'use strict';
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env'), quiet: true });
const { log } = require('./observability/logger');

async function start() {
  const { sequelize } = require('./models');
  const { createApp } = require('./app');
  const port = Number(process.env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_KEY) {
    throw new Error('JWT_KEY is required in production');
  }
  const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  let server;
  let stopping = false;
  let forceTimer;
  try {
    await sequelize.authenticate();
    log('info', 'database_connected');
    server = await new Promise((resolve, reject) => {
      const s = createApp({ sequelize, corsOrigins }).listen(port);
      s.once('listening', () => resolve(s));
      s.once('error', reject);
    });
    log('info', 'server_listening', { port });
  } catch (err) {
    await sequelize.close().catch(() => {});
    throw err;
  }

  async function shutdown(signal) {
    if (stopping) return;
    stopping = true;
    log('info', 'shutdown_started', { signal });
    forceTimer = setTimeout(() => {
      log('fatal', 'shutdown_timeout');
      server.closeAllConnections?.();
      process.exitCode = 1;
    }, 10000);
    forceTimer.unref();
    try {
      await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
      await sequelize.close();
      log('info', 'shutdown_complete');
    } catch (err) {
      log('error', 'shutdown_failed', { error: err });
      process.exitCode = 1;
    } finally {
      clearTimeout(forceTimer);
    }
  }
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.once('SIGINT', () => { void shutdown('SIGINT'); });
  return { server, sequelize, shutdown };
}

if (require.main === module) {
  start().catch(err => {
    log('fatal', 'startup_failed', { error: err });
    process.exitCode = 1;
  });
}
module.exports = { start };
