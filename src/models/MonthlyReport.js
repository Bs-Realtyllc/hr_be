const db = require('../db');

// employeeId === null/undefined => no employee filter (privileged/"all" view).
// fromYear/fromMonth and toYear/toMonth define an inclusive month range,
// compared as (year, month) tuples so ranges spanning multiple years work correctly.
exports.findWithEmployeeNames = async ({ employeeId, month, year, fromYear, fromMonth, toYear, toMonth }) => {
  let q = `SELECT r.*, e.name AS employee_name, e.designation, e.department
           FROM monthly_reports r
           JOIN employees_flat e ON r.employee_id = e.id
           WHERE 1=1`;
  const p = [];

  if (employeeId) {
    q += ' AND r.employee_id = ?';
    p.push(employeeId);
  }

  // Legacy single month/year filter (kept for backward compatibility)
  if (month) { q += ' AND r.month = ?'; p.push(month); }
  if (year)  { q += ' AND r.year = ?';  p.push(year);  }

  if (fromYear && fromMonth) {
    q += ' AND (r.year > ? OR (r.year = ? AND r.month >= ?))';
    p.push(fromYear, fromYear, fromMonth);
  }
  if (toYear && toMonth) {
    q += ' AND (r.year < ? OR (r.year = ? AND r.month <= ?))';
    p.push(toYear, toYear, toMonth);
  }

  q += ' ORDER BY r.year DESC, r.month DESC, r.submitted_at DESC';

  const [rows] = await db.query(q, p);
  return rows;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO monthly_reports (employee_id, title, month, year, file_name, file_path, file_size, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.employee_id, data.title, data.month, data.year, data.file_name, data.file_path, data.file_size, data.notes ?? null]
  );
  return result.insertId;
};

exports.findById = async (id) => {
  const [[report]] = await db.query('SELECT * FROM monthly_reports WHERE id = ?', [id]);
  return report || null;
};

exports.remove = async (id) => {
  await db.query('DELETE FROM monthly_reports WHERE id = ?', [id]);
};
