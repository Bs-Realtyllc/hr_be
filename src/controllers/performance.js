const PerformanceReview = require('../models/PerformanceReview');
const performanceDto = require('../dtos/performanceDto');

exports.list = async (req, res) => {
  try {
    const { employee_id, status } = req.query;
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    const filterEmployeeId = privileged ? employee_id : req.user.id;
    const rows = await PerformanceReview.findWithNames({ employeeId: filterEmployeeId, status });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.trend = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && Number(employeeId) !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const rows = await PerformanceReview.ratingTrendByEmployee(employeeId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  try {
    const data = performanceDto.toCreateInput(req.body, req.user.id);
    const id = await PerformanceReview.create(data);
    res.status(201).json({ id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A review for this period already exists for this employee' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Not found' });
    if (review.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft reviews can be edited' });
    }
    await PerformanceReview.update(req.params.id, performanceDto.toUpdateInput(req.body));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submit = async (req, res) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Not found' });
    if (review.status !== 'draft') {
      return res.status(400).json({ error: 'Review has already been submitted' });
    }
    await PerformanceReview.submit(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acknowledge = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Not found' });
    if (review.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the reviewed employee can acknowledge this review' });
    }
    if (review.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted reviews can be acknowledged' });
    }
    await PerformanceReview.acknowledge(req.params.id, req.body.employee_comments || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Not found' });
    if (review.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft reviews can be deleted' });
    }
    await PerformanceReview.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
