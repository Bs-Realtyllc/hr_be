const Employee = require('../models/Employee');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const employeeDto = require('../dtos/employeeDto');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const employees = await Employee.findAllActive();
  res.json(employeeDto.toResponseList(employees));
});

exports.get = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new AppError('Not found', 404);
  res.json(employeeDto.toResponse(employee));
});

exports.create = asyncHandler(async (req, res) => {
  const data = employeeDto.toCreateInput(req.body);
  const id = await Employee.create(data);

  // Seed default leave balances for current year
  const year = new Date().getFullYear();
  await Employee.seedLeaveBalances(id, year);

  res.status(201).json({ id });
});

exports.update = asyncHandler(async (req, res) => {
  const updates = employeeDto.toUpdateInput(req.body);
  if (!Object.keys(updates).length) throw new AppError('Nothing to update', 400);
  await Employee.update(req.params.id, updates);
  res.json({ success: true });
});

exports.remove = asyncHandler(async (req, res) => {
  await Employee.deactivate(req.params.id);
  res.json({ success: true });
});

exports.payrollSummary = asyncHandler(async (req, res) => {
  const emp = await Employee.findPayrollBaseById(req.params.id);
  if (!emp) throw new AppError('Not found', 404);

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
  const expectedPay = dailyRate * presentDays;

  // Overtime pay / leave deductions booked for this month, plus any year-end leave
  // bonus already paid out for this year — each carries its own display title.
  const adjustments = await PayrollAdjustment.findForEmployeePeriod(req.params.id, year, month + 1);
  const overtimePay     = adjustments.filter(a => a.type === 'overtime_pay').reduce((s, a) => s + Number(a.amount), 0);
  const leaveDeduction  = adjustments.filter(a => a.type === 'leave_deduction').reduce((s, a) => s + Number(a.amount), 0);
  const leaveBonus      = adjustments.filter(a => a.type === 'leave_bonus').reduce((s, a) => s + Number(a.amount), 0);

  res.json({
    ...emp,
    working_days_this_month: workingDays,
    leave_days_this_month:   leaveDays,
    present_days:            presentDays,
    daily_rate:              Math.round(dailyRate),
    expected_pay:            Math.round(expectedPay),
    overtime_pay:            Math.round(overtimePay),
    leave_deduction:         Math.round(leaveDeduction),
    leave_bonus:             Math.round(leaveBonus),
    net_pay:                 Math.round(expectedPay + overtimePay + leaveDeduction + leaveBonus),
    adjustments: adjustments.map(a => ({ title: a.title, type: a.type, amount: Number(a.amount) })),
  });
});
