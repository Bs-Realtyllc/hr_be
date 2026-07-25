const ServiceCredential = require('../models/ServiceCredential');
const serviceCredentialDto = require('../dtos/serviceCredentialDto');

exports.get = async (req, res) => {
  try {
    // Never return passwords to the client
    const rows = await ServiceCredential.findByEmployeeId(req.params.employeeId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.save = async (req, res) => {
  try {
    const data = serviceCredentialDto.toSaveInput(req.body);
    await ServiceCredential.upsert(req.params.employeeId, data);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
