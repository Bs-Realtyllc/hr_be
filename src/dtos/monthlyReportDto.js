exports.toCreateInput = (body, file) => {
  const { employee_id, title, month, year, notes } = body;
  if (!employee_id || !title || !month || !year) {
    const err = new Error('employee_id, title, month and year are required');
    err.status = 400;
    throw err;
  }
  return {
    employee_id,
    title,
    month,
    year,
    file_name: file.originalname,
    file_path: file.path,
    file_size: file.size,
    notes: notes || null,
  };
};
