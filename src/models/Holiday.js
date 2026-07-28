const db = require('../db');

exports.findAll = async () => {
  const [rows] = await db.query('SELECT * FROM holidays ORDER BY holiday_date');
  return rows;
};

exports.findByYear = async (year) => {
  const [rows] = await db.query('SELECT * FROM holidays WHERE year = ? ORDER BY holiday_date', [year]);
  return rows;
};

exports.create = async ({ name, holiday_date, year, message }) => {
  const [result] = await db.query(
    'INSERT INTO holidays (name, holiday_date, year, message) VALUES (?, ?, ?, ?)',
    [name, holiday_date, year, message || null]
  );
  return result.insertId;
};

exports.remove = async (id) => {
  await db.query('DELETE FROM holidays WHERE id = ?', [id]);
};
