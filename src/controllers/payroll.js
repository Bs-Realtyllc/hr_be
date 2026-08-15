const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const EmployeeTax = require('../models/EmployeeTax');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const payrollDto = require('../dtos/payrollDto');
const payrollService = require('../services/payrollService');
const asyncHandler = require('../middleware/asyncHandler');

const getPayroll = asyncHandler(async (req, res) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const rows = await Employee.findPayrollColumns(privileged ? null : req.user.id);
  res.json(rows);
});

const updateSalary = asyncHandler(async (req, res) => {
  const { salary, pay_frequency } = payrollDto.toUpdateSalaryInput(req.body);
  await Employee.updateSalary(req.params.id, salary, pay_frequency);
  res.json({ message: 'Salary updated' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const validationError = payrollDto.validatePasswordReset(password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const hash = await bcrypt.hash(password, 10);
  await Employee.updatePasswordHash(req.params.id, hash);
  res.json({ message: 'Password reset successfully' });
});

const getTaxes = asyncHandler(async (req, res) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const rows = await EmployeeTax.findAllWithProfile(privileged ? null : req.user.id);
  res.json(rows.map(payrollService.withTaxEstimate));
});

const updateTaxProfile = asyncHandler(async (req, res) => {
  const data = payrollDto.toTaxProfileInput(req.body);
  await EmployeeTax.upsertProfile(req.params.id, data);
  res.json({ message: 'Tax profile updated' });
});

const getAdjustments = asyncHandler(async (req, res) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const { employee_id, year, month } = req.query;
  const rows = await PayrollAdjustment.findAll({
    employeeId: privileged ? (employee_id || null) : req.user.id,
    year: year ? Number(year) : null,
    month: month ? Number(month) : null,
  });
  res.json(rows);
});

const getSummary = asyncHandler(async (req, res) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const summary = await payrollService.buildSummary(privileged, req.user.id);
  res.json(summary);
});

const runYearEndBonus = asyncHandler(async (req, res) => {
  const year = Number(req.body.year) || new Date().getFullYear();
  const result = await payrollService.runYearEndBonus(year);
  res.json(result);
});

const getFinancialReport = asyncHandler(async (req, res) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const filterEmployeeId = privileged ? (req.query.employee_id || null) : req.user.id;
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;

  const report = await payrollService.buildFinancialReport(filterEmployeeId, year, month);
  res.json({ year, month, report });
});

module.exports = {
  getPayroll, updateSalary, resetPassword, getTaxes, updateTaxProfile,
  getAdjustments, getSummary, runYearEndBonus, getFinancialReport,
};
