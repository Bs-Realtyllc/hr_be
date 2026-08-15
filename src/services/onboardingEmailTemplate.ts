export function buildApprovalEmailSubject(): string {
  return "You're approved — welcome to the team!";
}

export function buildApprovalEmailHtml(name: string, companyEmail: string, tempPassword: string, loginUrl: string): string {
  const firstName = name.split(' ')[0] || 'there';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 8px; padding: 40px 48px; max-width: 560px; margin: auto; box-shadow: 0 2px 8px rgba(0,0,0,.08); color: #222; font-size: 14px; line-height: 1.7; }
    p { margin: 0 0 16px; }
    .credentials { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px 20px; margin-bottom: 16px; }
    .credentials p { margin: 0 0 4px; }
    .credentials strong { font-family: 'Courier New', Courier, monospace; }
    .notice { color: #92400e; }
    .signature { margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <p>Hi ${firstName},</p>
    <p>Congratulations — your application has been reviewed and approved. We're excited to have you on the team!</p>
    <div class="credentials">
      <p>Company email: <strong>${companyEmail}</strong></p>
      <p>Temporary password: <strong>${tempPassword}</strong></p>
    </div>
    <p class="notice">This password is temporary — please change it as soon as you log in.</p>
    <p>Log in here: <a href="${loginUrl}">${loginUrl}</a></p>
    <div class="signature">
      <p>Welcome aboard,<br/>The HR Team</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildRejectionEmailSubject(): string {
  return 'Update on your application';
}

export function buildRejectionEmailHtml(name: string): string {
  const firstName = name.split(' ')[0] || 'there';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 8px; padding: 40px 48px; max-width: 560px; margin: auto; box-shadow: 0 2px 8px rgba(0,0,0,.08); color: #222; font-size: 14px; line-height: 1.7; }
    p { margin: 0 0 16px; }
    .signature { margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <p>Hi ${firstName},</p>
    <p>Thank you for taking the time to apply and for your interest in joining us.</p>
    <p>After careful review, we won't be moving forward with your application at this time. This decision doesn't reflect on your skills or potential — we simply had limited openings to fill.</p>
    <p>We'd encourage you to apply again in the future, as new opportunities open up regularly.</p>
    <div class="signature">
      <p>Warm regards,<br/>The HR Team</p>
    </div>
  </div>
</body>
</html>`;
}
