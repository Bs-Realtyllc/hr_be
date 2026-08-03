const db = require('../db');

exports.findAll = async (status) => {
  let q = 'SELECT * FROM projects WHERE 1=1';
  const p = [];
  if (status) { q += ' AND status = ?'; p.push(status); }
  q += ' ORDER BY created_at DESC';
  const [rows] = await db.query(q, p);
  return rows;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO projects (name, description, repo_url, docs_url, status, start_date, expected_end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.description, data.repo_url, data.docs_url, data.status, data.start_date, data.expected_end_date]
  );
  return result.insertId;
};

exports.update = async (id, updates) => {
  const fields = Object.keys(updates);
  if (!fields.length) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);
  values.push(id);
  await db.query(`UPDATE projects SET ${setClause} WHERE id = ?`, values);
};

exports.remove = async (id) => {
  await db.query('DELETE FROM projects WHERE id = ?', [id]);
};

exports.findAssignments = async (projectId) => {
  const [rows] = await db.query(
    `SELECT pa.*, e.name, e.designation, e.profile_picture, e.timezone
     FROM project_assignments pa
     JOIN employees e ON pa.employee_id = e.id
     WHERE pa.project_id = ?`,
    [projectId]
  );
  return rows;
};

exports.addAssignment = async (projectId, employeeId, role) => {
  await db.query(
    `INSERT INTO project_assignments (project_id, employee_id, role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [projectId, employeeId, role]
  );
};

exports.removeAssignment = async (projectId, employeeId) => {
  await db.query(
    `DELETE FROM project_assignments WHERE project_id = ? AND employee_id = ?`,
    [projectId, employeeId]
  );
};

exports.findMilestones = async (projectId) => {
  const [rows] = await db.query(
    `SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC`,
    [projectId]
  );
  return rows;
};

// Same query as findMilestones, reused for byEmployee's per-project milestone attachment.
exports.findMilestonesForProject = exports.findMilestones;

exports.addMilestone = async (projectId, title, due_date, status) => {
  const [result] = await db.query(
    `INSERT INTO milestones (project_id, title, due_date, status) VALUES (?, ?, ?, ?)`,
    [projectId, title, due_date, status]
  );
  return result.insertId;
};

exports.updateMilestone = async (projectId, milestoneId, title, due_date, status) => {
  await db.query(
    `UPDATE milestones SET title = COALESCE(?, title), due_date = COALESCE(?, due_date), status = COALESCE(?, status)
     WHERE id = ? AND project_id = ?`,
    [title, due_date, status, milestoneId, projectId]
  );
};

exports.findServices = async (projectId) => {
  const [rows] = await db.query(
    `SELECT service_key FROM project_services WHERE project_id = ?`,
    [projectId]
  );
  return rows;
};

exports.addService = async (projectId, serviceKey) => {
  await db.query(
    `INSERT IGNORE INTO project_services (project_id, service_key) VALUES (?, ?)`,
    [projectId, serviceKey]
  );
};

exports.removeService = async (projectId, serviceKey) => {
  await db.query(
    `DELETE FROM project_services WHERE project_id = ? AND service_key = ?`,
    [projectId, serviceKey]
  );
};

// Returns all projects an employee is assigned to, with their role.
exports.findByEmployee = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT p.*, pa.role AS assigned_role
     FROM project_assignments pa
     JOIN projects p ON pa.project_id = p.id
     WHERE pa.employee_id = ?
     ORDER BY p.created_at DESC`,
    [employeeId]
  );
  return rows;
};
