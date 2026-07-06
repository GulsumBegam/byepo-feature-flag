// Run with: node scripts/hash-password.js yourPasswordHere
// Prints a bcrypt hash to paste into .env as SUPER_ADMIN_PASSWORD_HASH
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
});
