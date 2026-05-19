const db = require('../db');

exports.list = async (req, res) => {
  try {
    const { project_id, show_sensitive } = req.query;
    let query = `SELECT s.*, p.name AS project_name FROM servers s LEFT JOIN projects p ON s.project_id = p.id WHERE 1=1`;
    const params = [];
    if (project_id) { query += ' AND s.project_id = ?'; params.push(project_id); }
    // Only return sensitive details if explicitly requested (role-based in real app)
    const [rows] = await db.query(query + ' ORDER BY s.environment, s.name', params);
    const sanitized = rows.map(r => ({
      ...r,
      ip_address: show_sensitive === 'true' ? r.ip_address : r.is_sensitive ? '••••••••' : r.ip_address,
      ssh_user: show_sensitive === 'true' ? r.ssh_user : r.is_sensitive ? '••••••••' : r.ssh_user,
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { project_id, name, environment, ip_address, domain, ssh_user, notes, is_sensitive } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO servers (project_id, name, environment, ip_address, domain, ssh_user, notes, is_sensitive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id || null, name, environment, ip_address, domain, ssh_user, notes, is_sensitive || false]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const fields = ['name', 'environment', 'ip_address', 'domain', 'ssh_user', 'notes', 'is_sensitive'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.params.id);
  try {
    await db.query(`UPDATE servers SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query(`DELETE FROM servers WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
