const CultureEvent = require('../models/CultureEvent');
const cultureEventDto = require('../dtos/cultureEventDto');
const asyncHandler = require('../middleware/asyncHandler');

exports.upcoming = asyncHandler(async (req, res) => {
  const rows = await CultureEvent.findUpcoming();
  res.json(rows);
});

exports.list = asyncHandler(async (req, res) => {
  const rows = await CultureEvent.findRecent();
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const id = await CultureEvent.create(cultureEventDto.toCreateInput(req.body));
  res.status(201).json({ id });
});
