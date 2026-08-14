/**
 * Disapproval email template.
 * Usage:
 *   const { subject, html, text } = buildDisapprovalEmail({
 *     name: 'Jane Doe',
 *   });
 */
function buildDisapprovalEmail({ name }) {
  const firstName = name?.split(" ")[0] || "there";

  const subject = "Update on your application — Gitgi";

  const text = `
Hi ${firstName},

Thank you for taking the time to apply and for your interest in joining Gitgi.

After careful review, we won't be moving forward with your application at this time. This decision wasn't easy, and it doesn't reflect on your skills or potential — we simply had limited openings to fill.

We'd encourage you to apply again in the future, as new opportunities open up regularly.

Thank you again for your interest, and we wish you the best in your search.

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
              <p style="margin:0; font-size:13px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:#94a3b8;">
                Gitgi HR
              </p>
              <h1 style="margin:8px 0 0; font-size:22px; font-weight:600; color:#ffffff;">
                Application update
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#334155;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#334155;">
                Thank you for taking the time to apply and for your interest in joining Gitgi.
              </p>
              <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#334155;">
                After careful review, we won't be moving forward with your application at this time.
                This decision wasn't easy, and it doesn't reflect on your skills or potential — we
                simply had limited openings to fill.
              </p>
              <p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#334155;">
                We'd encourage you to apply again in the future, as new opportunities open up regularly.
              </p>

              <p style="margin:0; font-size:15px; line-height:1.6; color:#334155;">
                Thank you again for your interest, and we wish you the best in your search.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; border-top:1px solid #f1f5f9;">
              <p style="margin:0; font-size:13px; color:#94a3b8;">
                Warm regards,<br />
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

module.exports = { buildDisapprovalEmail };