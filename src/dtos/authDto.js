const ALLOWED_DOMAINS = ['bsrealtyllc.com', 'gitgi.com'];

function badRequest(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

exports.toLoginInput = (body) => {
  const { email, password } = body;
  if (!email || !password) throw badRequest('Email and password required');

  const domain = email.split('@')[1]?.toLowerCase();
  if (!ALLOWED_DOMAINS.includes(domain)) {
    throw badRequest('Access restricted to organization members only. Please use your company email.', 403);
  }
  return { email, password };
};

exports.toChangePasswordInput = (body) => {
  const { current_password, new_password } = body;
  if (!new_password || new_password.length < 6) {
    throw badRequest('New password must be at least 6 characters');
  }
  return { current_password, new_password };
};

exports.toForgotPasswordInput = (body) => {
  const { email } = body;
  if (!email) throw badRequest('Email required');
  return { email };
};

exports.toResetPasswordInput = (body) => {
  const { token, new_password } = body;
  if (!token || !new_password || new_password.length < 6) {
    throw badRequest('Token and new password (min 6 characters) are required');
  }
  return { token, new_password };
};

// Strip password_hash before this reaches the JWT payload or the response body.
exports.toLoginResponse = (employee) => {
  const { password_hash, ...user } = employee;
  return user;
};
