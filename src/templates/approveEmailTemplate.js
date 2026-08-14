/**
 * Approval email template.
 * Usage:
 *   const { subject, html, text } = buildApprovalEmail({
 *     name: 'Jane Doe',
 *     companyEmail: 'jane@gitgi.com',
 *     loginUrl: 'https://portal.gitgi.com/login',
 *   });
 */
/**
 * Approval email template — OTP / temporary password login flow.
 * Usage:
 *   const { subject, html, text } = buildApprovalEmail({
 *     name: 'Jane Doe',
 *     companyEmail: 'jane@gitgi.com',
 *     loginUrl: 'https://portal.gitgi.com/login',
 *     pass: 'X7k9-QeT2',
 *   });
 */
function buildApprovalEmail({ name, companyEmail, loginUrl, pass }) {
  const firstName = name?.split(" ")[0] || "there";

  const subject = "You're approved — welcome to Gitgi!";

  const text = `
Hi ${firstName},

Congratulations — your application has been approved and you're officially part of the team! We're excited to have you on board.

Your company email has been created: ${companyEmail}

To log in for the first time, use this one-time password: ${pass}

Log in here: ${loginUrl}

This is a temporary password — for security, please change it as soon as you log in.

Welcome aboard,
The Gitgi HR Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e4e4e7;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a; padding:32px 40px;">
              <p style="margin:0; font-size:13px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:#f59e0b;">
                Gitgi HR
              </p>
              <h1 style="margin:8px 0 0; font-size:22px; font-weight:600; color:#ffffff;">
                You're approved 🎉
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#334155;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#334155;">
                Congratulations — your application has been reviewed and <strong>approved</strong>.
                We're excited to have you on the team!
              </p>

              <!-- Credentials box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">
                      Your company email
                    </p>
                    <p style="margin:0 0 16px; font-size:16px; font-weight:600; color:#0f172a;">
                      ${companyEmail}
                    </p>
                    <p style="margin:0 0 4px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">
                      One-time password
                    </p>
                    <p style="margin:0; font-size:16px; font-weight:600; color:#0f172a; font-family: 'Courier New', Courier, monospace; letter-spacing:0.03em;">
                      ${pass}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Warning notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb; border:1px solid #fde68a; border-radius:6px; margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0; font-size:13px; line-height:1.5; color:#92400e;">
                      This password is temporary. For your security, please change it immediately after your first login.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px; background-color:#0f172a;">
                    <a href="${loginUrl}"
                       style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                      Log in to your account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0; font-size:13px; line-height:1.6; color:#94a3b8;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${loginUrl}" style="color:#f59e0b; word-break:break-all;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; border-top:1px solid #f1f5f9;">
              <p style="margin:0; font-size:13px; color:#94a3b8;">
                Welcome aboard,<br />
                The Gitgi HR Team
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

module.exports = { buildApprovalEmail };