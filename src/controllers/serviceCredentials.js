const db = require('../db');

exports.get = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT service_name, username, notes, updated_at FROM service_credentials WHERE employee_id = ?',
      [req.params.employeeId]
    );
    // Never return passwords to the client
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.save = async (req, res) => {
  const { service_name, username, password, notes } = req.body;
  if (!service_name) return res.status(400).json({ error: 'service_name is required' });
  try {
    await db.query(
      `INSERT INTO service_credentials (employee_id, service_name, username, password, notes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         password = IF(VALUES(password) != '', VALUES(password), password),
         notes    = VALUES(notes)`,
      [req.params.employeeId, service_name, username || '', password || '', notes || '']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
