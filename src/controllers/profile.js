const fs  = require('fs');
const db  = require('../db');

exports.getProfile = async (req, res) => {
  try {
    const [[emp]] = await db.query(
      `SELECT id, name, email, phone, alt_phone, emergency_contact, designation, department,
              dob, bio, address, qualifications, profile_picture, citizenship_front, citizenship_back,
              timezone, work_hours, tech_stack, role, start_date
       FROM employees WHERE id = ? AND is_active = TRUE`,
      [req.user.id]
    );
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const ALLOWED = ['phone', 'alt_phone', 'emergency_contact', 'dob', 'bio', 'address', 'timezone', 'work_hours'];
  const updates = [];
  const values  = [];

  for (const f of ALLOWED) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f] || null);
    }
  }

  if (req.body.qualifications !== undefined) {
    updates.push('qualifications = ?');
    values.push(JSON.stringify(req.body.qualifications));
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.user.id);

  try {
    await db.query(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, values);

    if (req.body.dob) await upsertBirthdayEvent(req.user.id, req.body.dob);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    // Delete old photo if present
    const [[emp]] = await db.query('SELECT profile_picture FROM employees WHERE id = ?', [req.user.id]);
    if (emp?.profile_picture) deleteUpload('profile', emp.profile_picture);

    await db.query('UPDATE employees SET profile_picture = ? WHERE id = ?', [req.file.filename, req.user.id]);
    res.json({ filename: req.file.filename });
  } catch (err) {
    deleteUpload('profile', req.file.filename);
    res.status(500).json({ error: err.message });
  }
};

exports.uploadCitizenship = async (req, res) => {
  const { side } = req.params; // 'front' | 'back'
  if (!['front', 'back'].includes(side)) return res.status(400).json({ error: 'Invalid side' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const col = side === 'front' ? 'citizenship_front' : 'citizenship_back';
  try {
    const [[emp]] = await db.query(`SELECT ${col} FROM employees WHERE id = ?`, [req.user.id]);
    if (emp?.[col]) deleteUpload('docs', emp[col]);

    await db.query(`UPDATE employees SET ${col} = ? WHERE id = ?`, [req.file.filename, req.user.id]);
    res.json({ filename: req.file.filename });
  } catch (err) {
    deleteUpload('docs', req.file.filename);
    res.status(500).json({ error: err.message });
  }
};

// ── helpers ──────────────────────────────────────────────────────────────────

function deleteUpload(folder, filename) {
  const path = require('path');
  const full = path.join(__dirname, '../../uploads', folder, filename);
  fs.unlink(full, () => {});
}

async function upsertBirthdayEvent(employeeId, dob) {
  const d     = new Date(dob);
  const year  = new Date().getFullYear();
  const mm    = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd    = String(d.getUTCDate()).padStart(2, '0');
  const date  = `${year}-${mm}-${dd}`;

  const [[emp]] = await db.query('SELECT name FROM employees WHERE id = ?', [employeeId]);
  const title   = `${emp.name}'s Birthday`;

  const [[existing]] = await db.query(
    'SELECT id FROM culture_events WHERE employee_id = ? AND event_type = "birthday" LIMIT 1',
    [employeeId]
  );

  if (existing) {
    await db.query('UPDATE culture_events SET event_date = ?, title = ? WHERE id = ?',
      [date, title, existing.id]);
  } else {
    await db.query(
      'INSERT INTO culture_events (title, event_type, employee_id, event_date, description) VALUES (?, "birthday", ?, ?, ?)',
      [title, employeeId, date, `Happy Birthday ${emp.name}! 🎉`]
    );
  }
}
