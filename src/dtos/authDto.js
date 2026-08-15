const { z } = require('zod');

const ALLOWED_DOMAINS = ['bsrealtyllc.com', 'gitgi.com'];

function badRequest(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseOrThrow(schema, data, message) {
  const result = schema.safeParse(data);
  if (!result.success) throw badRequest(message || result.error.issues[0].message);
  return result.data;
}

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

exports.toLoginInput = (body) => {
  const { email, password } = parseOrThrow(loginSchema, body, 'Email and password required');

  const domain = email.split('@')[1]?.toLowerCase();
  if (!ALLOWED_DOMAINS.includes(domain)) {
    throw badRequest('Access restricted to organization members only. Please use your company email.', 403);
  }
  return { email, password };
};

const changePasswordSchema = z.object({
  current_password: z.string().optional(),
  new_password: z.string().min(6),
});

exports.toChangePasswordInput = (body) => {
  const { current_password, new_password } = parseOrThrow(
    changePasswordSchema, body, 'New password must be at least 6 characters'
  );
  return { current_password, new_password };
};

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1),
});

exports.toForgotPasswordInput = (body) => {
  const { email } = parseOrThrow(forgotPasswordSchema, body, 'Email required');
  return { email };
};

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(6),
});

exports.toResetPasswordInput = (body) => {
  const { token, new_password } = parseOrThrow(
    resetPasswordSchema, body, 'Token and new password (min 6 characters) are required'
  );
  return { token, new_password };
};

// Strip password_hash before this reaches the JWT payload or the response body.
exports.toLoginResponse = (employee) => {
  const { password_hash, ...user } = employee;
  return user;
};
