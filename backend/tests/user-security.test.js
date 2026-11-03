// Run these controller regression tests using the real crypto helpers.
// The production helpers are CommonJS modules and are loaded via require(),
// so Vitest's ESM vi.mock() would not replace them reliably.
const previousJwtKey = process.env.JWT_KEY;
process.env.JWT_KEY = 'clouddeploy-unit-test-only-secret-not-for-production';

const { bcryptCompare } = require('../helper/bcrypt');
const { jwtVerify } = require('../helper/jwt');
const { updateUser } = require('../controllers/user');

function fakeUser() {
  return {
    username: 'securitytester',
    email: 'old@example.com',
    password: 'original-hash',
    dataValues: {},
    save: vi.fn(async () => {}),
  };
}

async function run(body) {
  const user = fakeUser();
  const res = { json: vi.fn() };
  const next = vi.fn();
  await updateUser({ loggedUser: user, body }, res, next);
  return { user, res, next };
}

afterAll(() => {
  if (previousJwtKey === undefined) delete process.env.JWT_KEY;
  else process.env.JWT_KEY = previousJwtKey;
});

describe('user update security', () => {
  it('does not hash or replace a password when omitted', async () => {
    const { user, res, next } = await run({ user: { bio: 'hello' } });
    expect(next).not.toHaveBeenCalled();
    expect(user.password).toBe('original-hash');
    expect(user.bio).toBe('hello');
    expect(user.save).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledOnce();
  });

  it('rejects arbitrary mass-assignment properties', async () => {
    const { user, next } = await run({ user: { isAdmin: true } });
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].name).toBe('ValidationError');
    expect(user.isAdmin).toBeUndefined();
    expect(user.save).not.toHaveBeenCalled();
  });

  it('rejects empty passwords and missing user objects', async () => {
    for (const body of [{ user: { password: '' } }, {}]) {
      const { user, next } = await run(body);
      expect(next).toHaveBeenCalledOnce();
      expect(next.mock.calls[0][0].name).toBe('ValidationError');
      expect(user.save).not.toHaveBeenCalled();
    }
  });

  it('hashes a valid supplied password using bcrypt', async () => {
    const plaintext = 'strong-password-example';
    const { user, next } = await run({ user: { password: plaintext } });
    expect(next).not.toHaveBeenCalled();
    expect(user.password).not.toBe(plaintext);
    expect(user.password).toMatch(/^\$2[aby]\$/);
    expect(await bcryptCompare(plaintext, user.password)).toBe(true);
  });

  it('reissues a verifiable token after an email change', async () => {
    const { user, next } = await run({ user: { email: 'new@example.com' } });
    expect(next).not.toHaveBeenCalled();
    expect(user.save).toHaveBeenCalledOnce();
    expect(typeof user.dataValues.token).toBe('string');
    const claims = await jwtVerify(user.dataValues.token);
    expect(claims.email).toBe('new@example.com');
  });
});
