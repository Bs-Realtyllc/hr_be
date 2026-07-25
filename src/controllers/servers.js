const Server = require('../models/Server');
const serverDto = require('../dtos/serverDto');

exports.list = async (req, res) => {
  try {
    const { project_id, show_sensitive } = req.query;
    const rows = await Server.findAll(project_id);
    const sanitized = serverDto.toResponseList(rows, show_sensitive === 'true');
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = serverDto.toCreateInput(req.body);
    const id = await Server.create(data);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const updates = serverDto.toUpdateInput(req.body);
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
  try {
    await Server.update(req.params.id, updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Server.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
