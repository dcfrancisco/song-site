// Usage: NEW_PASSWORD='...' node scripts/set-user-password.js user@example.com
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const database = require("../database");
const { hashPassword, validatePasswordStrength } = require("../auth/password");

const email = process.argv[2];
const password = process.env.NEW_PASSWORD;
const problem = validatePasswordStrength(password);
if (!email || problem) {
  console.error(problem || "Usage: NEW_PASSWORD='...' node scripts/set-user-password.js <email>");
  process.exit(1);
}
const credential = database.getLoginCredentialByEmail(email);
if (!credential || !database.setUserPasswordHash(credential.id, hashPassword(password), { subject: "cli", provider: "cli" })) {
  console.error(`No user found for ${email}`);
  process.exit(1);
}
console.log(`Password updated for ${email}`);
