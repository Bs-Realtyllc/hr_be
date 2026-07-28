const Holiday = require('../models/Holiday');
const holidayDto = require('../dtos/holidayDto');

exports.list = async (req, res) => {
  try {
    const { year } = req.query;
    const rows = year ? await Holiday.findByYear(year) : await Holiday.findAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const id = await Holiday.create(holidayDto.toCreateInput(req.body));
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Holiday.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
