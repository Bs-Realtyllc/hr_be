const LeaveRequest = require('../models/LeaveRequest');
const leaveDto = require('../dtos/leaveDto');
const leaveService = require('../services/leaveService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const { employee_id, status } = req.query;
  const privileged = ['admin', 'lead'].includes(req.user?.role);

  const filterEmployeeId = privileged ? employee_id : req.user.id;
  const rows = await LeaveRequest.findWithNames({ employeeId: filterEmployeeId, status });
  res.json(rows);
});

exports.balances = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const rows = await LeaveRequest.findBalances(req.params.employeeId, year);
  res.json(rows);
});

exports.report = asyncHandler(async (req, res) => {
  const report = await leaveService.buildLeaveReport();
  res.json(report);
});

exports.outToday = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const rows = await LeaveRequest.findOutToday(today);
  res.json(rows);
});

exports.outThisWeek = asyncHandler(async (req, res) => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 6);
  const rows = await LeaveRequest.findOutInRange(monday.toISOString().split('T')[0], friday.toISOString().split('T')[0]);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const { to, cc, bcc } = req.body;
  const data = leaveDto.toCreateInput(req.body);
  const leave_id = await LeaveRequest.create(data);
  res.status(201).json({ id: leave_id });
  if (to) leaveService.sendEmailAsync(leave_id, data.employee_id, to, cc, bcc);
});

exports.approve = asyncHandler(async (req, res) => {
  await leaveService.approve(req.params.id, req.user);
  res.json({ success: true });
});

exports.reject = asyncHandler(async (req, res) => {
  await leaveService.reject(req.params.id, req.user);
  res.json({ success: true });
});

exports.update = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new AppError('Not found', 404);

  if (leave.employee_id !== req.user.id) {
    throw new AppError('You can only edit your own leave requests', 403);
  }
  if (leave.status !== 'pending') {
    throw new AppError('Only pending leave requests can be edited', 400);
  }

  await LeaveRequest.update(req.params.id, leaveDto.toUpdateInput(req.body));
  res.json({ success: true });
});

exports.cancel = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new AppError('Not found', 404);

  if (leave.employee_id !== req.user.id) {
    throw new AppError('You can only cancel your own leave requests', 403);
  }
  if (leave.status !== 'pending') {
    throw new AppError('Only pending leave requests can be cancelled', 400);
  }

  await LeaveRequest.remove(req.params.id);
  res.json({ success: true });
});
