// Creates the very first admin account, since there is no self-signup page.
// Usage: npm run create-admin -- "Full Name" "email@company.com" "Password123"
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Usage: npm run create-admin -- "Full Name" "email@company.com" "Password123"');
  process.exit(1);
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const existing = await conn.query('SELECT id FROM employees WHERE email = ?', [email]);
  if (existing[0].length > 0) {
    console.error(`An employee with email ${email} already exists.`);
    await conn.end();
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await conn.query(
    `INSERT INTO employees (name, email, is_active) VALUES (?, ?, TRUE)`,
    [name, email]
  );
  await conn.query(
    `INSERT INTO employee_auth (employee_id, password_hash, role) VALUES (?, ?, 'admin')`,
    [result.insertId, password_hash]
  );

  console.log(`Admin account created: ${email}`);
  console.log('You can now log in with this email and the password you provided.');
  await conn.end();
})().catch(err => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
