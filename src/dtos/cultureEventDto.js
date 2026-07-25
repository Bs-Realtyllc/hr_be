exports.toCreateInput = (body) => ({
  title: body.title,
  event_type: body.event_type,
  employee_id: body.employee_id,
  event_date: body.event_date,
  description: body.description,
});
