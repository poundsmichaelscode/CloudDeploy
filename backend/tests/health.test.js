'use strict';
const { createApp } = require('../app');

async function serve(app, callback) {
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve, reject) => {
      if (server.listening) return resolve();
      server.once('listening', resolve);
      server.once('error', reject);
    });
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}
describe('application health', () => {
  it('reports liveness with a request ID', async () => {
    await serve(createApp({ sequelize: { authenticate: async () => {} }, mountRoutes: false }), async url => {
      const response = await fetch(`${url}/health/live`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
      expect(response.headers.get('x-request-id')).toMatch(/^[\da-f-]{36}$/);
      expect(response.headers.get('x-powered-by')).toBeNull();
    });
  });
  it('reports database readiness', async () => {
    await serve(createApp({ sequelize: { authenticate: async () => {} }, mountRoutes: false }), async url => {
      const response = await fetch(`${url}/health/ready`);
      expect(response.status).toBe(200);
      expect((await response.json()).status).toBe('ready');
    });
  });
  it('returns 503 when PostgreSQL is unavailable', async () => {
    await serve(createApp({ sequelize: { authenticate: async () => { throw new Error('unavailable'); } }, mountRoutes: false }), async url => {
      const response = await fetch(`${url}/health/ready`);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ status: 'not_ready', checks: { database: 'unavailable' } });
    });
  });
});
