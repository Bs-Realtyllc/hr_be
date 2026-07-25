const db = require('../db');

exports.findByEmployeeId = async (employeeId) => {
  const [rows] = await db.query(
    'SELECT service_name, username, notes, updated_at FROM service_credentials WHERE employee_id = ?',
    [employeeId]
  );
  return rows;
};

exports.upsert = async (employeeId, { service_name, username, password, notes }) => {
  await db.query(
    `INSERT INTO service_credentials (employee_id, service_name, username, password, notes)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       username = VALUES(username),
       password = IF(VALUES(password) != '', VALUES(password), password),
       notes    = VALUES(notes)`,
    [employeeId, service_name, username, password, notes]
  );
};
