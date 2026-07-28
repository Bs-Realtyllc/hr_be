const { getWeekStartDate } = require('../pkg/weekUtil');

exports.toCreateInput = (body, file) => {
  const { employee_id, title, notes } = body;
  if (!employee_id || !title) {
    const err = new Error('employee_id and title are required');
    err.status = 400;
    throw err;
  }
  return {
    employee_id,
    title,
    week_start_date: getWeekStartDate(),
    file_name: file.originalname,
    file_path: file.path,
    file_size: file.size,
    notes: notes || null,
  };
};
