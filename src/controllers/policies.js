const fs = require('fs');
const path = require('path');
const Policy = require('../models/Policy');

exports.listPolicies = async (req, res) => {
  try {
    const { category } = req.query;
    const policies = await Policy.listActive(category);
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadPolicy = async (req, res) => {
  const { type, title, category } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'type and title are required' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

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
    res.status(500).json({ error: err.message });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    await Policy.remove(policy.id);
    deleteUpload(policy.file_path);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setPinned = async (req, res) => {
  const { pinned } = req.body;
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    await Policy.setPinned(policy.id, !!pinned);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function deleteUpload(filename) {
  const full = path.join(__dirname, '../../uploads/policies', filename);
  fs.unlink(full, () => {});
}
