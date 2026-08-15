const rateLimit = require('express-rate-limit');

// Applied to unauthenticated credential-guessing surfaces: login, forgot-password,
// reset-password. 10 attempts per 15 minutes per IP is generous enough for a real
// user who mistypes a password a few times, tight enough to blunt brute-force /
// credential-stuffing against the single-org email allowlist in authDto.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true, // adds RateLimit-* response headers
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

module.exports = { authLimiter };
