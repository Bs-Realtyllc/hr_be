const Server = require('../models/Server');
const serverDto = require('../dtos/serverDto');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const { project_id, show_sensitive } = req.query;
  const rows = await Server.findAll(project_id);
  const sanitized = serverDto.toResponseList(rows, show_sensitive === 'true');
  res.json(sanitized);
});

exports.create = asyncHandler(async (req, res) => {
  const data = serverDto.toCreateInput(req.body);
  const id = await Server.create(data);
  res.status(201).json({ id });
});

exports.update = asyncHandler(async (req, res) => {
  const updates = serverDto.toUpdateInput(req.body);
  if (!Object.keys(updates).length) throw new AppError('Nothing to update', 400);
  await Server.update(req.params.id, updates);
  res.json({ success: true });
});

exports.remove = asyncHandler(async (req, res) => {
  await Server.remove(req.params.id);
  res.json({ success: true });
});
