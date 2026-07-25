const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const payrollDto = require('../dtos/payrollDto');

async function getPayroll(req, res) {
  try {
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    const rows = await Employee.findPayrollColumns(privileged ? null : req.user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateSalary(req, res) {
  try {
    const { salary, pay_frequency } = payrollDto.toUpdateSalaryInput(req.body);
    await Employee.updateSalary(req.params.id, salary, pay_frequency);
    res.json({ message: 'Salary updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    const validationError = payrollDto.validatePasswordReset(password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const hash = await bcrypt.hash(password, 10);
    await Employee.updatePasswordHash(req.params.id, hash);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getPayroll, updateSalary, resetPassword };
