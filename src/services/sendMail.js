const nodemailer = require("nodemailer");
const { buildApprovalEmail } = require("../templates/approveEmailTemplate");
const { buildDisapprovalEmail } = require("../templates/disapproveEmailTemplate");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
// const to = "gitginepal@gmail.com";
exports.sendMail = async ({ mail_to, name, decision, pass }) => {
  if (!mail_to) return { error: "No mail address to send to" };

  try {
    let subject, html, text;

    if (decision === "approve") {
      ({ subject, html, text } = buildApprovalEmail({
        name,
        companyEmail: mail_to,
        loginUrl: process.env.FRONTEND_URL || "http://localhost:6001/login",
        pass: pass
      }));
    } else {
      ({ subject, html, text } = buildDisapprovalEmail({
        name
      }));
    }

    const info = await transporter.sendMail({
      from: `"HR Team" <${process.env.MAIL_USER}>`,
      to: mail_to,
      subject,
      text,
      html,
    });

    return { info };
  } catch (err) {
    console.error("Error sending email:", err);
    return { error: err.message || String(err) };
  }
};
