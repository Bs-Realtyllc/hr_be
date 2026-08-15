const PerformanceReview = require('../models/PerformanceReview');
const performanceDto = require('../dtos/performanceDto');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const { employee_id, status } = req.query;
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const filterEmployeeId = privileged ? employee_id : req.user.id;
  const rows = await PerformanceReview.findWithNames({ employeeId: filterEmployeeId, status });
  res.json(rows);
});

exports.trend = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId;
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  if (!privileged && Number(employeeId) !== req.user.id) {
    throw new AppError('Insufficient permissions', 403);
  }
  const rows = await PerformanceReview.ratingTrendByEmployee(employeeId);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  try {
    const data = performanceDto.toCreateInput(req.body, req.user.id);
    const id = await PerformanceReview.create(data);
    res.status(201).json({ id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('A review for this period already exists for this employee', 400);
    }
    throw err;
  }
});

exports.update = asyncHandler(async (req, res) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  const review = await PerformanceReview.findById(req.params.id);
  if (!review) throw new AppError('Not found', 404);
  if (review.status !== 'draft') {
    throw new AppError('Only draft reviews can be edited', 400);
  }
  await PerformanceReview.update(req.params.id, performanceDto.toUpdateInput(req.body));
  res.json({ success: true });
});

exports.submit = asyncHandler(async (req, res) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  const review = await PerformanceReview.findById(req.params.id);
  if (!review) throw new AppError('Not found', 404);
  if (review.status !== 'draft') {
    throw new AppError('Review has already been submitted', 400);
  }
  await PerformanceReview.submit(req.params.id);
  res.json({ success: true });
});

exports.acknowledge = asyncHandler(async (req, res) => {
  const review = await PerformanceReview.findById(req.params.id);
  if (!review) throw new AppError('Not found', 404);
  if (review.employee_id !== req.user.id) {
    throw new AppError('Only the reviewed employee can acknowledge this review', 403);
  }
  if (review.status !== 'submitted') {
    throw new AppError('Only submitted reviews can be acknowledged', 400);
  }
  await PerformanceReview.acknowledge(req.params.id, req.body.employee_comments || null);
  res.json({ success: true });
});

exports.remove = asyncHandler(async (req, res) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  const review = await PerformanceReview.findById(req.params.id);
  if (!review) throw new AppError('Not found', 404);
  if (review.status !== 'draft') {
    throw new AppError('Only draft reviews can be deleted', 400);
  }
  await PerformanceReview.remove(req.params.id);
  res.json({ success: true });
});
