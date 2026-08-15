const fs = require('fs');
const path = require('path');
const Policy = require('../models/Policy');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.listPolicies = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const policies = await Policy.listActive(category);
  res.json(policies);
});

exports.uploadPolicy = asyncHandler(async (req, res) => {
  const { type, title, category } = req.body;
  if (!type || !title) throw new AppError('type and title are required', 400);
  if (!req.file) throw new AppError('No file uploaded', 400);

  try {
    const previous = await Policy.findActiveByType(type);
    const version = previous ? previous.version + 1 : 1;

    await Policy.deactivateByType(type);
    const id = await Policy.create({
      type,
      title,
      filePath: req.file.filename,
      version,
      uploadedBy: req.user.id,
      category: category || 'policy',
    });

    res.json({ id, version, filename: req.file.filename });
  } catch (err) {
    deleteUpload(req.file.filename);
    throw err;
  }
});

exports.deletePolicy = asyncHandler(async (req, res) => {
  const policy = await Policy.findById(req.params.id);
  if (!policy) throw new AppError('Policy not found', 404);

  await Policy.remove(policy.id);
  deleteUpload(policy.file_path);
  res.json({ success: true });
});

exports.setPinned = asyncHandler(async (req, res) => {
  const { pinned } = req.body;
  const policy = await Policy.findById(req.params.id);
  if (!policy) throw new AppError('Policy not found', 404);

  await Policy.setPinned(policy.id, !!pinned);
  res.json({ success: true });
});

function deleteUpload(filename) {
  const full = path.join(__dirname, '../../uploads/policies', filename);
  fs.unlink(full, () => {});
}
