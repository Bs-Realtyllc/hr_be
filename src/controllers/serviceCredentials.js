const ServiceCredential = require('../models/ServiceCredential');
const serviceCredentialDto = require('../dtos/serviceCredentialDto');
const asyncHandler = require('../middleware/asyncHandler');

exports.get = asyncHandler(async (req, res) => {
  // Never return passwords to the client
  const rows = await ServiceCredential.findByEmployeeId(req.params.employeeId);
  res.json(rows);
});

exports.save = asyncHandler(async (req, res) => {
  const data = serviceCredentialDto.toSaveInput(req.body);
  await ServiceCredential.upsert(req.params.employeeId, data);
  res.json({ success: true });
});
