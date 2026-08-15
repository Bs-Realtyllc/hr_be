export function buildLeaveEmailSubject(): string {
  return 'Leave Request';
}

export function buildLeaveEmailHtml(leave: any, start: string, end: string, isSingleDay: boolean): string {
  const datePhrase = isSingleDay ? start : `${start} to ${end}`;

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
    <p>Dear Team Lead,</p>
    <p>I would like to request leave on ${datePhrase} due to ${leave.reason || 'personal reasons'}.</p>
    <p>I will ensure my tasks are managed accordingly and will be reachable for any urgent matters.</p>
    <p>Kindly let me know if this works.</p>
    <p>Thank you for your understanding.</p>
    <div class="signature">
      <p>Best regards,<br/>
      ${leave.employee_name}<br/>
      ${leave.designation}${leave.department ? `, ${leave.department}` : ''}</p>
    </div>
  </div>
</body>
</html>`;
}
