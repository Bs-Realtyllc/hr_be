exports.toCreateInput = (body) => ({
  employee_id: body.employee_id,
  leave_type: body.leave_type,
  start_date: body.start_date,
  end_date: body.end_date,
  reason: body.reason,
});

exports.toUpdateInput = (body) => ({
  leave_type: body.leave_type,
  start_date: body.start_date,
  end_date: body.end_date,
  reason: body.reason,
});
