const CultureEvent = require('../models/CultureEvent');
const cultureEventDto = require('../dtos/cultureEventDto');

exports.upcoming = async (req, res) => {
  try {
    const rows = await CultureEvent.findUpcoming();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const rows = await CultureEvent.findRecent();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const id = await CultureEvent.create(cultureEventDto.toCreateInput(req.body));
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
