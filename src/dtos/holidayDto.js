exports.toCreateInput = (body) => ({
  name: body.name,
  holiday_date: body.holiday_date,
  year: body.year || new Date(body.holiday_date).getFullYear(),
  message: body.message,
});
