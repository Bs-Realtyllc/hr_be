const nodemailer = require('nodemailer');
const Policy = require('../models/Policy');
const Employee = require('../models/Employee');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');

exports.submitAcknowledgement = async (req, res) => {
  const policyId = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const policy = await Policy.findById(policyId);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    await PolicyAcknowledgement.upsertSubmission({
      policyId,
      employeeId: req.user.id,
      signedFilePath: req.file.filename,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.myAcknowledgements = async (req, res) => {
  try {
    const rows = await PolicyAcknowledgement.listForEmployee(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listForEmployeeAdmin = async (req, res) => {
  try {
    const rows = await PolicyAcknowledgement.listForEmployee(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listSubmissions = async (req, res) => {
  try {
    const rows = await PolicyAcknowledgement.listForPolicy(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reviewSubmission = async (req, res) => {
  const { status, rejection_reason } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
  }
  if (status === 'rejected' && !rejection_reason?.trim()) {
    return res.status(400).json({ error: 'rejection_reason is required when rejecting' });
  }

  try {
    const ack = await PolicyAcknowledgement.findById(req.params.ackId);
    if (!ack) return res.status(404).json({ error: 'Submission not found' });

    await PolicyAcknowledgement.review(ack.id, {
      status,
      rejectionReason: status === 'rejected' ? rejection_reason : null,
      reviewedBy: req.user.id,
    });

    res.json({ success: true });

    if (status === 'rejected') {
      notifyRejection(ack, rejection_reason).catch(err =>
        console.error('[policy-ack] Failed to send rejection email:', err.message)
      );
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function notifyRejection(ack, reason) {
  if (!process.env.MAIL_HOST) {
    console.info('[policy-ack] MAIL_HOST not set — skipping rejection email');
    return;
  }

  const [employee, policy] = await Promise.all([
    Employee.findById(ack.employee_id),
    Policy.findById(ack.policy_id),
  ]);
  if (!employee?.email || !policy) return;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: employee.email,
    subject: `Your signed document was rejected — ${policy.title}`,
    html: `
      <p>Hi ${employee.name},</p>
      <p>Your signed copy of <strong>${policy.title}</strong> was rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please review the document and upload a corrected signed copy.</p>
      <p><a href="${process.env.FRONTEND_URL}/documents">Go to Documents & Signature</a></p>
      <p style="color:#888;font-size:12px">HR Platform</p>
    `,
  });
}
