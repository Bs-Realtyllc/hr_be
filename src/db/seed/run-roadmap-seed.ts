import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

async function loadEnvironment() {
  const rootDir = path.resolve(__dirname, '../../../../');
  dotenv.config({ path: path.join(rootDir, '.env.production') });
  dotenv.config({ path: path.join(rootDir, '.env') });
}

async function main() {
  await loadEnvironment();

  const sqlFile = path.join(__dirname, 'roadmap_seed.sql');
  const sql = await fs.readFile(sqlFile, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'hr_platform',
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log(`Applied roadmap seed from ${sqlFile}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Roadmap seed failed:', error);
  process.exit(1);
});