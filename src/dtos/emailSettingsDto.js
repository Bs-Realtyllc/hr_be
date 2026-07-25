function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

exports.toSaveInput = (body) => {
  const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, default_to, default_cc, default_bcc } = body;
  if (!smtp_host || !smtp_user) throw badRequest('smtp_host and smtp_user are required');

  return {
    smtp_host,
    smtp_port: smtp_port || 587,
    smtp_user,
    smtp_pass: smtp_pass || '',
    smtp_from: smtp_from || smtp_user,
    default_to: default_to || '',
    default_cc: default_cc || '',
    default_bcc: default_bcc || '',
  };
};
