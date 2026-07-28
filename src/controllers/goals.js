const Goal = require('../models/Goal');
const goalDto = require('../dtos/goalDto');

exports.list = async (req, res) => {
  try {
    const { employee_id, status, category } = req.query;
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    const filterEmployeeId = privileged ? employee_id : req.user.id;
    const rows = await Goal.findWithNames({ employeeId: filterEmployeeId, status, category });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.summary = async (req, res) => {
  try {
    const rows = await Goal.summaryByEmployee();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    const employeeId = privileged ? (req.body.employee_id || req.user.id) : req.user.id;

    if (!privileged && Number(req.body.employee_id) !== req.user.id && req.body.employee_id) {
      return res.status(403).json({ error: 'You can only create goals for yourself' });
    }

    const data = goalDto.toCreateInput({ ...req.body, employee_id: employeeId }, req.user.id);
    const id = await Goal.create(data);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Not found' });

    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && goal.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await Goal.update(req.params.id, goalDto.toUpdateInput(req.body));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Not found' });

    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && goal.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await Goal.updateProgress(req.params.id, goalDto.toProgressInput(req.body));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Not found' });

    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && goal.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await Goal.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
