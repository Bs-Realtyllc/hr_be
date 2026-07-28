const Feedback = require('../models/Feedback');
const feedbackDto = require('../dtos/feedbackDto');

exports.list = async (req, res) => {
  try {
    const { type } = req.query;
    const scope = req.query.scope || 'public';
    const privileged = ['admin', 'lead'].includes(req.user?.role);

    let employeeId = req.query.employee_id;
    if (scope === 'received' || scope === 'sent') {
      employeeId = privileged && employeeId ? employeeId : req.user.id;
    }

    const rows = await Feedback.findFeed({ scope, employeeId, type });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.summary = async (req, res) => {
  try {
    const rows = await Feedback.summaryReceivedByEmployee();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (Number(req.body.to_employee_id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot send feedback to yourself' });
    }
    const data = feedbackDto.toCreateInput(req.body, req.user.id);
    const id = await Feedback.create(data);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const note = await Feedback.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });

    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && note.from_employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own feedback notes' });
    }
    await Feedback.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
