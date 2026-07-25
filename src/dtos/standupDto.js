exports.toCreateInput = (body) => ({
  employee_id: body.employee_id,
  yesterday: body.yesterday,
  today: body.today,
  blockers: body.blockers,
  standup_date: body.standup_date,
});
