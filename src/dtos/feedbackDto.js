exports.toCreateInput = (body, fromEmployeeId) => ({
  from_employee_id: fromEmployeeId,
  to_employee_id: body.to_employee_id,
  feedback_type: body.feedback_type || 'praise',
  visibility: body.visibility || 'public',
  message: body.message,
  project_id: body.project_id || null,
});
