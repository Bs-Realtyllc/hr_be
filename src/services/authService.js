const nodemailer = require('nodemailer');

exports.sendResetEmail = async (name, to, resetLink) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: 'HR Platform — Password Reset',
    html: `
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the link below to set a new password.
         This link expires in <strong>1 hour</strong>.</p>
      <p><a href="${resetLink}" style="color:#4f46e5;font-weight:bold">Reset My Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#888;font-size:12px">HR Platform</p>
    `,
  });
};
