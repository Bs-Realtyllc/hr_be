const OvertimeRequest = require('../models/OvertimeRequest');
const overtimeDto = require('../dtos/overtimeDto');
const overtimeService = require('../services/overtimeService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const { employee_id, status } = req.query;
  const privileged = ['admin', 'lead'].includes(req.user?.role);

  const filterEmployeeId = privileged ? employee_id : req.user.id;
  const rows = await OvertimeRequest.findWithNames({ employeeId: filterEmployeeId, status });
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const data = overtimeDto.toCreateInput(req.body);
  const validationError = overtimeDto.validateCreate(data);
  if (validationError) throw new AppError(validationError, 400);

  const id = await OvertimeRequest.create(data);
  res.status(201).json({ id });
});

exports.approve = asyncHandler(async (req, res) => {
  const { amount } = await overtimeService.approve(req.params.id, req.user);
  res.json({ success: true, amount });
});

exports.reject = asyncHandler(async (req, res) => {
  await overtimeService.reject(req.params.id, req.user);
  res.json({ success: true });
});

exports.update = asyncHandler(async (req, res) => {
  const ot = await OvertimeRequest.findById(req.params.id);
  if (!ot) throw new AppError('Not found', 404);

  if (ot.employee_id !== req.user.id) {
    throw new AppError('You can only edit your own overtime requests', 403);
  }
  if (ot.status !== 'pending') {
    throw new AppError('Only pending overtime requests can be edited', 400);
  }

  const data = overtimeDto.toUpdateInput(req.body);
  const validationError = overtimeDto.validateUpdate(data);
  if (validationError) throw new AppError(validationError, 400);

  await OvertimeRequest.update(req.params.id, data);
  res.json({ success: true });
});

exports.cancel = asyncHandler(async (req, res) => {
  const ot = await OvertimeRequest.findById(req.params.id);
  if (!ot) throw new AppError('Not found', 404);

  if (ot.employee_id !== req.user.id) {
    throw new AppError('You can only cancel your own overtime requests', 403);
  }
  if (ot.status !== 'pending') {
    throw new AppError('Only pending overtime requests can be cancelled', 400);
  }

  await OvertimeRequest.remove(req.params.id);
  res.json({ success: true });
});
