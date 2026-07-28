exports.toCreateInput = (body, createdBy) => ({
  employee_id: body.employee_id,
  title: body.title,
  description: body.description || null,
  category: body.category || 'individual',
  metric_unit: body.metric_unit || '%',
  target_value: body.target_value ?? 100,
  current_value: body.current_value ?? 0,
  weight: body.weight ?? 3,
  status: body.status || 'not_started',
  start_date: body.start_date || null,
  due_date: body.due_date || null,
  created_by: createdBy,
});

exports.toUpdateInput = (body) => ({
  title: body.title,
  description: body.description || null,
  category: body.category || 'individual',
  metric_unit: body.metric_unit || '%',
  target_value: body.target_value ?? 100,
  weight: body.weight ?? 3,
  start_date: body.start_date || null,
  due_date: body.due_date || null,
});

exports.toProgressInput = (body) => ({
  current_value: body.current_value ?? 0,
  status: body.status || 'in_progress',
});
