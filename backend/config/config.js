'use strict';
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

function configFor(prefix) {
  const required = ['USERNAME','PASSWORD','NAME','HOSTNAME'];
  const missing = required.filter(k => !process.env[`${prefix}_DB_${k}`]);
  if (missing.length) throw new Error(`Missing ${prefix} database variables: ${missing.join(', ')}`);
  const dialect = process.env[`${prefix}_DB_DIALECT`] || 'postgres';
  if (dialect !== 'postgres') throw new Error(`Unsupported ${prefix} DB dialect: ${dialect}`);
  const port = Number(process.env[`${prefix}_DB_PORT`] || (prefix === 'DEV' ? 5435 : 5432));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid database port');
  return {
    username: process.env[`${prefix}_DB_USERNAME`],
    password: process.env[`${prefix}_DB_PASSWORD`],
    database: process.env[`${prefix}_DB_NAME`],
    host: process.env[`${prefix}_DB_HOSTNAME`],
    port,
    dialect,
    logging: process.env[`${prefix}_DB_LOGGING`] === 'true' ? console.log : false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  };
}

const active = process.env.NODE_ENV || 'development';
const prefix = { development: 'DEV', test: 'TEST', production: 'PROD' }[active];
if (!prefix) throw new Error(`Invalid NODE_ENV: ${active}`);
module.exports = { [active]: configFor(prefix) };
