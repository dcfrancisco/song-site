const crypto = require('node:crypto');

const KEY_LENGTH = 64;
const COST = 16384;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
// Verified against when the account is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`;
  }
  return null;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, { N: COST });
  return `scrypt$${COST}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

function verifyPassword(password, stored) {
  const [scheme, cost, salt, hash] = String(stored || DUMMY_HASH).split('$');
  const candidate = typeof password === 'string' && password.length <= MAX_PASSWORD_LENGTH ? password : '';
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = crypto.scryptSync(candidate, Buffer.from(salt, 'base64url'), expected.length, { N: Number(cost) });
  return crypto.timingSafeEqual(actual, expected) && Boolean(stored);
}

module.exports = { hashPassword, validatePasswordStrength, verifyPassword };
