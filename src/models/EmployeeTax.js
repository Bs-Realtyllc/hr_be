const db = require('../db');

exports.findAllWithProfile = async (id) => {
  const query = `
    SELECT e.id, e.name, e.designation, e.department, e.role, e.salary, e.pay_frequency,
           t.tax_id, t.country, t.filing_status, t.tax_regime,
           t.exemptions, t.additional_withholding, t.notes, t.updated_at
    FROM employees_flat e
    LEFT JOIN employee_tax_profiles t ON t.employee_id = e.id
    WHERE e.is_active = TRUE ${id ? 'AND e.id = ?' : ''}
    ORDER BY e.name`;
  const [rows] = await db.query(query, id ? [id] : []);
  return rows;
};

exports.upsertProfile = async (employeeId, data) => {
  await db.query(
    `INSERT INTO employee_tax_profiles
       (employee_id, tax_id, country, filing_status, tax_regime, exemptions, additional_withholding, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       tax_id = VALUES(tax_id), country = VALUES(country), filing_status = VALUES(filing_status),
       tax_regime = VALUES(tax_regime), exemptions = VALUES(exemptions),
       additional_withholding = VALUES(additional_withholding), notes = VALUES(notes)`,
    [employeeId, data.tax_id, data.country, data.filing_status, data.tax_regime,
     data.exemptions, data.additional_withholding, data.notes]
  );
};
