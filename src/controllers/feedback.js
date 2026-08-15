const Feedback = require('../models/Feedback');
const feedbackDto = require('../dtos/feedbackDto');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const scope = req.query.scope || 'public';
  const privileged = ['admin', 'lead'].includes(req.user?.role);

  let employeeId = req.query.employee_id;
  if (scope === 'received' || scope === 'sent') {
    employeeId = privileged && employeeId ? employeeId : req.user.id;
  }

  const rows = await Feedback.findFeed({ scope, employeeId, type });
  res.json(rows);
});

exports.summary = asyncHandler(async (req, res) => {
  const rows = await Feedback.summaryReceivedByEmployee();
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  if (!req.body.message?.trim()) {
    throw new AppError('Message is required', 400);
  }
  if (Number(req.body.to_employee_id) === req.user.id) {
    throw new AppError('You cannot send feedback to yourself', 400);
  }
  const data = feedbackDto.toCreateInput(req.body, req.user.id);
  const id = await Feedback.create(data);
  res.status(201).json({ id });
});

exports.remove = asyncHandler(async (req, res) => {
  const note = await Feedback.findById(req.params.id);
  if (!note) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(req.user?.role);
  if (!privileged && note.from_employee_id !== req.user.id) {
    throw new AppError('You can only delete your own feedback notes', 403);
  }
  await Feedback.remove(req.params.id);
  res.json({ success: true });
});
