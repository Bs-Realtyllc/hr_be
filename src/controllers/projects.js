const db = require('../db');

exports.list = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
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
      [name, description, repo_url, docs_url, status || 'active', start_date, expected_end_date]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const fields = ['name', 'description', 'repo_url', 'docs_url', 'status', 'start_date', 'expected_end_date'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  });
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
      `INSERT INTO project_assignments (project_id, employee_id, role) VALUES (?, ?, ?)`,
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
