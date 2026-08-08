const path = require('path');
const fs   = require('fs');
const MonthlyReport = require('../models/MonthlyReport');
const monthlyReportDto = require('../dtos/monthlyReportDto');

exports.list = async (req, res) => {
  try {
    const { month, year, fromYear, fromMonth, toYear, toMonth } = req.query;
    const privileged = ['admin', 'lead'].includes(req.user?.role);

    // Employees see only their own submissions
    const employeeId = privileged ? null : req.user.id;

    const rows = await MonthlyReport.findWithEmployeeNames({
      employeeId, month, year, fromYear, fromMonth, toYear, toMonth,
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submit = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  let data;
  try {
    data = monthlyReportDto.toCreateInput(req.body, req.file);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    return res.status(err.status || 400).json({ error: err.message });
  }

  try {
    const id = await MonthlyReport.create(data);
    res.status(201).json({ id });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
};

exports.download = async (req, res) => {
  try {
    const report = await MonthlyReport.findById(req.params.id);
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
    const report = await MonthlyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });

    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && report.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reports' });
    }

    fs.unlink(report.file_path, () => {});
    await MonthlyReport.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
