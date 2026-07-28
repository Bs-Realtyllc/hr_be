exports.toCreateInput = (body) => ({
  employee_id: body.employee_id,
  project_id: body.project_id || null,
  work_date: body.work_date,
  hours: body.hours,
  reason: body.reason,
  approved_by_name: body.approved_by_name,
});

exports.toUpdateInput = (body) => ({
  project_id: body.project_id || null,
  work_date: body.work_date,
  hours: body.hours,
  reason: body.reason,
  approved_by_name: body.approved_by_name,
});

// Returns an error message string if the submission fails validation, otherwise null.
exports.validateCreate = ({ work_date, hours, reason, approved_by_name }) => {
  if (!work_date) return 'Work date is required';
  if (!hours || Number(hours) <= 0 || Number(hours) > 16) return 'Hours must be between 0 and 16';
  if (!reason || !reason.trim()) return 'A reason for the overtime is required';
  if (!approved_by_name || !approved_by_name.trim()) return 'Please specify who approved this overtime';
  return null;
};
