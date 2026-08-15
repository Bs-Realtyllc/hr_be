const fs = require('fs');
const path = require('path');
const Employee = require('../models/Employee');
const profileDto = require('../dtos/profileDto');
const cultureEventService = require('../services/cultureEventService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.getProfile = asyncHandler(async (req, res) => {
  const emp = await Employee.findProfileById(req.user.id);
  if (!emp) throw new AppError('Employee not found', 404);
  res.json(emp);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = profileDto.toUpdateInput(req.body);
  if (!Object.keys(updates).length) throw new AppError('Nothing to update', 400);

  await Employee.update(req.user.id, updates);

  if (req.body.dob) await cultureEventService.upsertBirthdayEvent(req.user.id, req.body.dob);

  res.json({ success: true });
});

exports.acceptLeavePolicy = asyncHandler(async (req, res) => {
  await Employee.acceptLeavePolicy(req.user.id);
  res.json({ success: true });
});

exports.uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  try {
    // Delete old photo if present
    const oldPicture = await Employee.findProfilePictureById(req.user.id);
    if (oldPicture) deleteUpload('profile', oldPicture);

    await Employee.updateProfilePicture(req.user.id, req.file.filename);
    res.json({ filename: req.file.filename });
  } catch (err) {
    deleteUpload('profile', req.file.filename);
    throw err;
  }
});

exports.uploadCitizenship = asyncHandler(async (req, res) => {
  const { side } = req.params; // 'front' | 'back'
  if (!['front', 'back'].includes(side)) throw new AppError('Invalid side', 400);
  if (!req.file) throw new AppError('No file uploaded', 400);

  const col = side === 'front' ? 'citizenship_front' : 'citizenship_back';
  try {
    const oldDoc = await Employee.findCitizenshipDocById(req.user.id, col);
    if (oldDoc) deleteUpload('docs', oldDoc);

    await Employee.updateCitizenshipDoc(req.user.id, col, req.file.filename);
    res.json({ filename: req.file.filename });
  } catch (err) {
    deleteUpload('docs', req.file.filename);
    throw err;
  }
});

// ── helpers ──────────────────────────────────────────────────────────────────

function deleteUpload(folder, filename) {
  const full = path.join(__dirname, '../../uploads', folder, filename);
  fs.unlink(full, () => {});
}
