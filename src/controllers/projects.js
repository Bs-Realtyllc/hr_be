const db = require('../db');

function toArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
}

function toJSON(v) {
  if (!v) return null;
  const arr = Array.isArray(v) ? v : [v];
  const clean = arr.map(s => String(s).trim()).filter(Boolean);
  return clean.length ? JSON.stringify(clean) : null;
}

function parse(row) {
  return { ...row, repo_url: toArr(row.repo_url), docs_url: toArr(row.docs_url) };
}

exports.list = async (req, res) => {
  try {
    const { status } = req.query;
    let q = 'SELECT * FROM projects WHERE 1=1';
    const p = [];
    if (status) { q += ' AND status = ?'; p.push(status); }
    q += ' ORDER BY created_at DESC';
    const [rows] = await db.query(q, p);
    res.json(rows.map(parse));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, description, repo_url, docs_url, status, start_date, expected_end_date } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO projects (name, description, repo_url, docs_url, status, start_date, expected_end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, toJSON(repo_url), toJSON(docs_url), status || 'active', start_date || null, expected_end_date || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const allowed = ['name', 'description', 'repo_url', 'docs_url', 'status', 'start_date', 'expected_end_date'];
  const updates = [];
  const values = [];
  for (const f of allowed) {
    if (req.body[f] === undefined) continue;
    if (f === 'repo_url' || f === 'docs_url') {
      updates.push(`${f} = ?`);
      values.push(toJSON(req.body[f]));
    } else {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.params.id);
  try {
    await db.query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pa.*, e.name, e.designation, e.profile_picture, e.timezone
       FROM project_assignments pa
       JOIN employees e ON pa.employee_id = e.id
       WHERE pa.project_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAssignment = async (req, res) => {
  const { employee_id, role } = req.body;
  try {
    await db.query(
      `INSERT INTO project_assignments (project_id, employee_id, role) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [req.params.id, employee_id, role]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeAssignment = async (req, res) => {
  try {
    await db.query(
      `DELETE FROM project_assignments WHERE project_id = ? AND employee_id = ?`,
      [req.params.id, req.params.empId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMilestones = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMilestone = async (req, res) => {
  const { title, due_date, status } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO milestones (project_id, title, due_date, status) VALUES (?, ?, ?, ?)`,
      [req.params.id, title, due_date, status || 'pending']
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMilestone = async (req, res) => {
  const { title, due_date, status } = req.body;
  try {
    await db.query(
      `UPDATE milestones SET title = COALESCE(?, title), due_date = COALESCE(?, due_date), status = COALESCE(?, status)
       WHERE id = ? AND project_id = ?`,
      [title, due_date, status, req.params.mid, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT service_key FROM project_services WHERE project_id = ?`,
      [req.params.id]
    );
    res.json(rows.map(r => r.service_key));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addService = async (req, res) => {
  const { service_key } = req.body;
  if (!service_key) return res.status(400).json({ error: 'service_key required' });
  try {
    await db.query(
      `INSERT IGNORE INTO project_services (project_id, service_key) VALUES (?, ?)`,
      [req.params.id, service_key]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeService = async (req, res) => {
  try {
    await db.query(
      `DELETE FROM project_services WHERE project_id = ? AND service_key = ?`,
      [req.params.id, req.params.serviceKey]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns all projects an employee is assigned to, with their role + milestones
exports.byEmployee = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, pa.role AS assigned_role
       FROM project_assignments pa
       JOIN projects p ON pa.project_id = p.id
       WHERE pa.employee_id = ?
       ORDER BY p.created_at DESC`,
      [req.params.empId]
    );
    const projects = rows.map(parse);

    // Attach milestones to each project
    for (const proj of projects) {
      const [ms] = await db.query(
        `SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC`,
        [proj.id]
      );
      proj.milestones = ms;
    }

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
