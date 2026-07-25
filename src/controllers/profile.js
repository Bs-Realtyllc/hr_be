const fs = require('fs');
const path = require('path');
const Employee = require('../models/Employee');
const CultureEvent = require('../models/CultureEvent');
const profileDto = require('../dtos/profileDto');

exports.getProfile = async (req, res) => {
  try {
    const emp = await Employee.findProfileById(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = profileDto.toUpdateInput(req.body);
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    await Employee.update(req.user.id, updates);

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
    const oldPicture = await Employee.findProfilePictureById(req.user.id);
    if (oldPicture) deleteUpload('profile', oldPicture);

    await Employee.updateProfilePicture(req.user.id, req.file.filename);
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
    const oldDoc = await Employee.findCitizenshipDocById(req.user.id, col);
    if (oldDoc) deleteUpload('docs', oldDoc);

    await Employee.updateCitizenshipDoc(req.user.id, col, req.file.filename);
    res.json({ filename: req.file.filename });
  } catch (err) {
    deleteUpload('docs', req.file.filename);
    res.status(500).json({ error: err.message });
  }
};

// ── helpers ──────────────────────────────────────────────────────────────────

function deleteUpload(folder, filename) {
  const full = path.join(__dirname, '../../uploads', folder, filename);
  fs.unlink(full, () => {});
}

async function upsertBirthdayEvent(employeeId, dob) {
  const d     = new Date(dob);
  const year  = new Date().getFullYear();
  const mm    = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd    = String(d.getUTCDate()).padStart(2, '0');
  const date  = `${year}-${mm}-${dd}`;

  const emp   = await Employee.findNameById(employeeId);
  const title = `${emp.name}'s Birthday`;

  const existing = await CultureEvent.findBirthdayByEmployeeId(employeeId);

  if (existing) {
    await CultureEvent.updateDateAndTitle(existing.id, date, title);
  } else {
    await CultureEvent.createBirthday(employeeId, date, title, `Happy Birthday ${emp.name}! 🎉`);
  }
}
