'use strict';

const SENSITIVE_KEYS = /^(authorization|cookie|password|token|secret|jwt|api[_-]?key)$/i;

function redact(value, depth = 0) {
  if (depth > 5) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    if (value instanceof Error) return { name: value.name, message: value.message };
    return Object.fromEntries(Object.entries(value).map(([key, item]) =>
      [key, SENSITIVE_KEYS.test(key) ? '[REDACTED]' : redact(item, depth + 1)]));
  }
  return value;
}

function log(level, message, fields = {}) {
  const record = { timestamp: new Date().toISOString(), level, message, ...redact(fields) };
  const line = JSON.stringify(record);
  if (level === 'error' || level === 'fatal') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}
module.exports = { log };
