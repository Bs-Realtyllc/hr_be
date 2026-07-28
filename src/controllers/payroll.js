const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const EmployeeTax = require('../models/EmployeeTax');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const LeaveRequest = require('../models/LeaveRequest');
const payrollDto = require('../dtos/payrollDto');
const { estimateAnnualTax, toAnnualSalary } = require('../pkg/taxCalculator');
const { toMonthlySalary, calculateYearEndLeaveBonus } = require('../pkg/payrollCalculator');

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

// Shared by getTaxes and getFinancialReport so both report the same tax number for an employee.
function withTaxEstimate(r) {
  const annualSalary = toAnnualSalary(r.salary, r.pay_frequency);
  const exemptions = Number(r.exemptions) || 0;
  const additionalWithholding = Number(r.additional_withholding) || 0;
  const filingStatus = r.filing_status || 'single';
  const taxableIncome = Math.max(annualSalary - exemptions, 0);
  const estimatedAnnualTax = estimateAnnualTax(taxableIncome, filingStatus) + additionalWithholding;

  return {
    ...r,
    exemptions,
    additional_withholding: additionalWithholding,
    filing_status: filingStatus,
    tax_regime: r.tax_regime || 'new',
    country: r.country || 'Nepal',
    annual_salary: Math.round(annualSalary),
    taxable_income: Math.round(taxableIncome),
    estimated_annual_tax: estimatedAnnualTax,
    estimated_monthly_tax: Math.round(estimatedAnnualTax / 12),
    effective_rate: annualSalary > 0 ? Number(((estimatedAnnualTax / annualSalary) * 100).toFixed(1)) : 0,
  };
}

async function getTaxes(req, res) {
  try {
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    const rows = await EmployeeTax.findAllWithProfile(privileged ? null : req.user.id);
    res.json(rows.map(withTaxEstimate));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateTaxProfile(req, res) {
  try {
    const data = payrollDto.toTaxProfileInput(req.body);
    await EmployeeTax.upsertProfile(req.params.id, data);
    res.json({ message: 'Tax profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getAdjustments(req, res) {
  try {
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    const { employee_id, year, month } = req.query;
    const rows = await PayrollAdjustment.findAll({
      employeeId: privileged ? (employee_id || null) : req.user.id,
      year: year ? Number(year) : null,
      month: month ? Number(month) : null,
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Base salary + this month's overtime pay / leave deductions + this year's leave bonus, per employee.
async function getSummary(req, res) {
  try {
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [rows, totals] = await Promise.all([
      Employee.findPayrollColumns(privileged ? null : req.user.id),
      PayrollAdjustment.summaryForPeriod(year, month),
    ]);
    const totalsByEmployee = Object.fromEntries(totals.map((t) => [t.employee_id, t]));

    const summary = rows.map((r) => {
      const baseMonthly = toMonthlySalary(r.salary, r.pay_frequency);
      const t = totalsByEmployee[r.id] || { overtime_pay: 0, leave_deduction: 0, leave_bonus: 0 };
      const overtimePay = Number(t.overtime_pay);
      const leaveDeduction = Number(t.leave_deduction);
      const leaveBonus = Number(t.leave_bonus);

      return {
        id: r.id,
        name: r.name,
        designation: r.designation,
        department: r.department,
        role: r.role,
        base_monthly: Math.round(baseMonthly),
        overtime_pay: Math.round(overtimePay),
        leave_deduction: Math.round(leaveDeduction),
        leave_bonus: Math.round(leaveBonus),
        net_pay: Math.round(baseMonthly + overtimePay + leaveDeduction + leaveBonus),
      };
    });

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Admin-triggered, idempotent per (employee, year): pays out unused leave balance at the
// employee's daily rate for every active employee who hasn't already been paid for that year.
async function runYearEndBonus(req, res) {
  try {
    const year = Number(req.body.year) || new Date().getFullYear();
    const employees = await Employee.findPayrollColumns(null);

    let processed = 0;
    let totalBonus = 0;
    const details = [];

    for (const emp of employees) {
      if (!emp.salary) continue;
      if (await PayrollAdjustment.existsBonusForYear(emp.id, year)) continue;

      const balances = await LeaveRequest.findBalances(emp.id, year);
      const remainingDays = balances.reduce((sum, b) => sum + Math.max(Number(b.remaining) || 0, 0), 0);
      if (remainingDays <= 0) continue;

      const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
      const { dailyRate, amount } = calculateYearEndLeaveBonus(monthlySalary, remainingDays);
      if (amount <= 0) continue;

      await PayrollAdjustment.create({
        employee_id: emp.id,
        type: 'leave_bonus',
        title: `Year-End Leave Bonus — ${remainingDays} unused day(s) (${year})`,
        amount,
        year,
        month: null,
        reference_type: null,
        reference_id: null,
        notes: `Daily rate Rs. ${dailyRate} × ${remainingDays} unused day(s)`,
      });

      processed += 1;
      totalBonus += amount;
      details.push({ employee_id: emp.id, name: emp.name, remaining_days: remainingDays, amount });
    }

    res.json({ year, processed, total_bonus: Math.round(totalBonus), details });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// One row per employee: base salary, this month's overtime/deduction/bonus, estimated tax,
// and the final total payable amount — base + overtime - deduction + bonus - tax.
async function getFinancialReport(req, res) {
  try {
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    const filterEmployeeId = privileged ? (req.query.employee_id || null) : req.user.id;
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;

    const [taxRows, totals] = await Promise.all([
      EmployeeTax.findAllWithProfile(filterEmployeeId),
      PayrollAdjustment.summaryForPeriod(year, month),
    ]);
    const totalsByEmployee = Object.fromEntries(totals.map((t) => [t.employee_id, t]));

    // Year-end leave bonus is a one-time annual payout (not tied to a specific month) and is
    // intentionally excluded from this month's total payable — see the Overtime & Adjustments
    // tab on the Payroll page for bonus payouts.
    const report = taxRows.map((raw) => {
      const r = withTaxEstimate(raw);
      const t = totalsByEmployee[r.id] || { overtime_pay: 0, leave_deduction: 0 };

      const baseSalary = toMonthlySalary(r.salary, r.pay_frequency);
      const overtimePay = Number(t.overtime_pay);
      const deductedAmount = Math.abs(Number(t.leave_deduction));
      const taxAmount = r.estimated_monthly_tax;
      const totalPayable = baseSalary + overtimePay - deductedAmount - taxAmount;

      return {
        id: r.id,
        name: r.name,
        designation: r.designation,
        department: r.department,
        role: r.role,
        base_salary: Math.round(baseSalary),
        overtime_pay: Math.round(overtimePay),
        deducted_amount: Math.round(deductedAmount),
        tax_amount: Math.round(taxAmount),
        total_payable: Math.round(totalPayable),
      };
    });

    res.json({ year, month, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getPayroll, updateSalary, resetPassword, getTaxes, updateTaxProfile,
  getAdjustments, getSummary, runYearEndBonus, getFinancialReport,
};
