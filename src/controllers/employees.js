const Employee = require('../models/Employee');
const employeeDto = require('../dtos/employeeDto');

exports.list = async (req, res) => {
  try {
    const employees = await Employee.findAllActive();
    res.json(employeeDto.toResponseList(employees));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Not found' });
    res.json(employeeDto.toResponse(employee));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = employeeDto.toCreateInput(req.body);
    const id = await Employee.create(data);

    // Seed default leave balances for current year
    const year = new Date().getFullYear();
    await Employee.seedLeaveBalances(id, year);

    res.status(201).json({ id });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = employeeDto.toUpdateInput(req.body);
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
    await Employee.update(req.params.id, updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Employee.deactivate(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.payrollSummary = async (req, res) => {
  try {
    const emp = await Employee.findPayrollBaseById(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Not found' });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Count Mon–Fri working days in current month
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0 && day !== 6) workingDays++;
    }

    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd   = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const leaveRanges = await Employee.findApprovedLeaveRangesForEmployee(req.params.id, monthStart, monthEnd);

    let leaveDays = 0;
    for (const lr of leaveRanges) {
      const s = new Date(Math.max(new Date(lr.start_date), new Date(monthStart)));
      const e = new Date(Math.min(new Date(lr.end_date),   new Date(monthEnd)));
      for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) leaveDays++;
      }
    }

    const presentDays = workingDays - leaveDays;
    const dailyRate   = emp.salary ? emp.salary / workingDays : 0;

    res.json({
      ...emp,
      working_days_this_month: workingDays,
      leave_days_this_month:   leaveDays,
      present_days:            presentDays,
      daily_rate:              Math.round(dailyRate),
      expected_pay:            Math.round(dailyRate * presentDays),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
