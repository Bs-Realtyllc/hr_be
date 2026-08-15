const Policy = require('../models/Policy');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const policyAcknowledgementService = require('../services/policyAcknowledgementService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.submitAcknowledgement = asyncHandler(async (req, res) => {
  const policyId = req.params.id;
  if (!req.file) throw new AppError('No file uploaded', 400);

  const policy = await Policy.findById(policyId);
  if (!policy) throw new AppError('Policy not found', 404);

  await PolicyAcknowledgement.upsertSubmission({
    policyId,
    employeeId: req.user.id,
    signedFilePath: req.file.filename,
  });

  res.json({ success: true });
});

exports.myAcknowledgements = asyncHandler(async (req, res) => {
  const rows = await PolicyAcknowledgement.listForEmployee(req.user.id);
  res.json(rows);
});

exports.listForEmployeeAdmin = asyncHandler(async (req, res) => {
  const rows = await PolicyAcknowledgement.listForEmployee(req.params.id);
  res.json(rows);
});

exports.listSubmissions = asyncHandler(async (req, res) => {
  const rows = await PolicyAcknowledgement.listForPolicy(req.params.id);
  res.json(rows);
});

exports.reviewSubmission = asyncHandler(async (req, res) => {
  const { status, rejection_reason } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError("status must be 'approved' or 'rejected'", 400);
  }
  if (status === 'rejected' && !rejection_reason?.trim()) {
    throw new AppError('rejection_reason is required when rejecting', 400);
  }

  const ack = await PolicyAcknowledgement.findById(req.params.ackId);
  if (!ack) throw new AppError('Submission not found', 404);

  await PolicyAcknowledgement.review(ack.id, {
    status,
    rejectionReason: status === 'rejected' ? rejection_reason : null,
    reviewedBy: req.user.id,
  });

  res.json({ success: true });

  if (status === 'rejected') {
    policyAcknowledgementService.notifyRejection(ack, rejection_reason).catch(err =>
      console.error('[policy-ack] Failed to send rejection email:', err.message)
    );
  }
});
