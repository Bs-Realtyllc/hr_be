const Holiday = require('../models/Holiday');
const holidayDto = require('../dtos/holidayDto');
const asyncHandler = require('../middleware/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const rows = year ? await Holiday.findByYear(year) : await Holiday.findAll();
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const id = await Holiday.create(holidayDto.toCreateInput(req.body));
  res.status(201).json({ id });
});

exports.remove = asyncHandler(async (req, res) => {
  await Holiday.remove(req.params.id);
  res.json({ success: true });
});
