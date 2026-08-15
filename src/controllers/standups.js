const Standup = require('../models/Standup');
const Employee = require('../models/Employee');
const standupDto = require('../dtos/standupDto');
const asyncHandler = require('../middleware/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { date, start_date, end_date, employee_id } = req.query;
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const filterEmployeeId = privileged ? employee_id : req.user.id;

  const rows = await Standup.findWithNames({
    employeeId: filterEmployeeId,
    date,
    startDate: start_date,
    endDate: end_date,
  });
  res.json(rows);
});

exports.today = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const filterEmployeeId = privileged ? undefined : req.user.id;

  const rows = await Standup.findToday(today, filterEmployeeId);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const data = standupDto.toCreateInput(req.body);
  const id = await Standup.upsert(data);

  // Fire-and-forget: mirror the standup to the Discord channel via the bot
  const botUrl   = process.env.DISCORD_BOT_URL;
  const botToken = process.env.DISCORD_INTERNAL_TOKEN;
  if (botUrl && botToken) {
    const employee = await Employee.findNameById(data.employee_id);
    fetch(`${botUrl}/internal/standup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Token': botToken },
      body: JSON.stringify({
        employeeName: employee?.name || `Employee #${data.employee_id}`,
        yesterday: data.yesterday,
        today: data.today,
        blockers: data.blockers,
      }),
    }).catch(err => console.error('[discord-bot] HR → Discord sync failed:', err.message));
  }

  res.status(201).json({ id });
});
