const Goal = require('../models/Goal');
const goalDto = require('../dtos/goalDto');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const { employee_id, status, category } = req.query;
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const filterEmployeeId = privileged ? employee_id : req.user.id;
  const rows = await Goal.findWithNames({ employeeId: filterEmployeeId, status, category });
  res.json(rows);
});

exports.summary = asyncHandler(async (req, res) => {
  const rows = await Goal.summaryByEmployee();
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const employeeId = privileged ? (req.body.employee_id || req.user.id) : req.user.id;

  if (!privileged && Number(req.body.employee_id) !== req.user.id && req.body.employee_id) {
    throw new AppError('You can only create goals for yourself', 403);
  }

  const data = goalDto.toCreateInput({ ...req.body, employee_id: employeeId }, req.user.id);
  const id = await Goal.create(data);
  res.status(201).json({ id });
});

exports.update = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);
  if (!goal) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(req.user?.role);
  if (!privileged && goal.employee_id !== req.user.id) {
    throw new AppError('Insufficient permissions', 403);
  }

  await Goal.update(req.params.id, goalDto.toUpdateInput(req.body));
  res.json({ success: true });
});

exports.updateProgress = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);
  if (!goal) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(req.user?.role);
  if (!privileged && goal.employee_id !== req.user.id) {
    throw new AppError('Insufficient permissions', 403);
  }

  await Goal.updateProgress(req.params.id, goalDto.toProgressInput(req.body));
  res.json({ success: true });
});

exports.remove = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);
  if (!goal) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(req.user?.role);
  if (!privileged && goal.employee_id !== req.user.id) {
    throw new AppError('Insufficient permissions', 403);
  }

  await Goal.remove(req.params.id);
  res.json({ success: true });
});
