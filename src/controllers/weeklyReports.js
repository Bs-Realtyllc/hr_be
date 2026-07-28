const path = require('path');
const fs   = require('fs');
const WeeklyReport = require('../models/WeeklyReport');
const weeklyReportDto = require('../dtos/weeklyReportDto');

exports.list = async (req, res) => {
  try {
    const { week_start_date, year } = req.query;
    const privileged = ['admin', 'lead'].includes(req.user?.role);

    // Employees see only their own submissions
    const employeeId = privileged ? null : req.user.id;

    const rows = await WeeklyReport.findWithEmployeeNames({ employeeId, weekStartDate: week_start_date, year });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submit = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  let data;
  try {
    data = weeklyReportDto.toCreateInput(req.body, req.file);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    return res.status(err.status || 400).json({ error: err.message });
  }

  // Rename the file to `<EmployeeName>_<timestamp>.<ext>` within its week folder.
  const safeName = (req.user?.name || 'employee').trim().replace(/[^a-zA-Z0-9]+/g, '_');
  const ext = path.extname(req.file.originalname).toLowerCase();
  const finalFileName = `${safeName}_${Date.now()}${ext}`;
  const finalPath = path.join(path.dirname(req.file.path), finalFileName);

  try {
    fs.renameSync(req.file.path, finalPath);
    data.file_name = finalFileName;
    data.file_path = finalPath;
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: `Failed to store file: ${err.message}` });
  }

  try {
    const id = await WeeklyReport.create(data);
    res.status(201).json({ id });
  } catch (err) {
    fs.unlink(finalPath, () => {});
    res.status(500).json({ error: err.message });
  }
};

exports.download = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });

    // Employees can only download their own reports
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && report.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.download(path.resolve(report.file_path), report.file_name);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });

    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && report.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reports' });
    }

    fs.unlink(report.file_path, () => {});
    await WeeklyReport.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
