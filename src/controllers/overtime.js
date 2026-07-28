const OvertimeRequest = require('../models/OvertimeRequest');
const Employee = require('../models/Employee');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const overtimeDto = require('../dtos/overtimeDto');
const { toMonthlySalary, calculateOvertimePay } = require('../pkg/payrollCalculator');

exports.list = async (req, res) => {
  try {
    const { employee_id, status } = req.query;
    const privileged = ['admin', 'lead'].includes(req.user?.role);

    const filterEmployeeId = privileged ? employee_id : req.user.id;
    const rows = await OvertimeRequest.findWithNames({ employeeId: filterEmployeeId, status });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = overtimeDto.toCreateInput(req.body);
    const validationError = overtimeDto.validateCreate(data);
    if (validationError) return res.status(400).json({ error: validationError });

    const id = await OvertimeRequest.create(data);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approve = async (req, res) => {
  const role = req.user?.role;
  if (role === 'employee') return res.status(403).json({ error: 'Insufficient permissions' });

  try {
    const ot = await OvertimeRequest.findWithEmployeeById(req.params.id);
    if (!ot) return res.status(404).json({ error: 'Not found' });

    if (role === 'lead' && ot.employee_id === req.user.id) {
      return res.status(403).json({ error: 'Team leads cannot approve their own overtime requests' });
    }
    if (ot.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending overtime requests can be reviewed' });
    }

    const emp = await Employee.findPayrollBaseById(ot.employee_id);
    if (!emp?.salary) {
      return res.status(400).json({ error: "This employee's salary isn't configured yet — set it under Payroll first" });
    }

    const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
    const { hourlyRate, overtimeHourlyRate, amount } = calculateOvertimePay(monthlySalary, ot.hours);

    await OvertimeRequest.approve(req.params.id, req.user.id, { hourlyRate, overtimeRate: overtimeHourlyRate, amount });

    const workDate = new Date(ot.work_date);
    const projectLabel = ot.project_name || 'General duties';
    await PayrollAdjustment.create({
      employee_id: ot.employee_id,
      type: 'overtime_pay',
      title: `Overtime Pay — ${Number(ot.hours)}h @ 150% rate (${projectLabel})`,
      amount,
      year: workDate.getFullYear(),
      month: workDate.getMonth() + 1,
      reference_type: 'overtime_request',
      reference_id: ot.id,
      notes: `Hourly rate Rs. ${hourlyRate} × 1.5 = Rs. ${overtimeHourlyRate}/hr`,
    });

    res.json({ success: true, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reject = async (req, res) => {
  const role = req.user?.role;
  if (role === 'employee') return res.status(403).json({ error: 'Insufficient permissions' });

  try {
    const ot = await OvertimeRequest.findById(req.params.id);
    if (!ot) return res.status(404).json({ error: 'Not found' });

    if (role === 'lead' && ot.employee_id === req.user.id) {
      return res.status(403).json({ error: 'Team leads cannot reject their own overtime requests' });
    }
    if (ot.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending overtime requests can be reviewed' });
    }

    await OvertimeRequest.reject(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const ot = await OvertimeRequest.findById(req.params.id);
    if (!ot) return res.status(404).json({ error: 'Not found' });

    if (ot.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own overtime requests' });
    }
    if (ot.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending overtime requests can be edited' });
    }

    const data = overtimeDto.toUpdateInput(req.body);
    const validationError = overtimeDto.validateCreate(data);
    if (validationError) return res.status(400).json({ error: validationError });

    await OvertimeRequest.update(req.params.id, data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const ot = await OvertimeRequest.findById(req.params.id);
    if (!ot) return res.status(404).json({ error: 'Not found' });

    if (ot.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own overtime requests' });
    }
    if (ot.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending overtime requests can be cancelled' });
    }

    await OvertimeRequest.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
