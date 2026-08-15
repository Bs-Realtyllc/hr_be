const db = require('../db');

exports.upsertSubmission = async ({ policyId, employeeId, signedFilePath }) => {
  await db.query(
    `INSERT INTO policy_acknowledgements (policy_id, employee_id, signed_file_path, status, rejection_reason, submitted_at)
     VALUES (?, ?, ?, 'pending', NULL, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       signed_file_path = VALUES(signed_file_path),
       status = 'pending',
       rejection_reason = NULL,
       submitted_at = CURRENT_TIMESTAMP,
       reviewed_by = NULL,
       reviewed_at = NULL`,
    [policyId, employeeId, signedFilePath]
  );
};

exports.findByPolicyAndEmployee = async (policyId, employeeId) => {
  const [rows] = await db.query(
    'SELECT * FROM policy_acknowledgements WHERE policy_id = ? AND employee_id = ?',
    [policyId, employeeId]
  );
  return rows[0] || null;
};

exports.listForEmployee = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT pa.*, p.title AS policy_title, p.type AS policy_type, p.category AS policy_category
     FROM policy_acknowledgements pa
     JOIN policies p ON pa.policy_id = p.id
     WHERE pa.employee_id = ?`,
    [employeeId]
  );
  return rows;
};

exports.listForPolicy = async (policyId) => {
  const [rows] = await db.query(
    `SELECT pa.*, e.name AS employee_name, e.email AS employee_email
     FROM policy_acknowledgements pa
     JOIN employees_flat e ON pa.employee_id = e.id
     WHERE pa.policy_id = ?
     ORDER BY pa.submitted_at DESC`,
    [policyId]
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM policy_acknowledgements WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.review = async (id, { status, rejectionReason, reviewedBy }) => {
  await db.query(
    `UPDATE policy_acknowledgements
     SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, rejectionReason || null, reviewedBy, id]
  );
};
