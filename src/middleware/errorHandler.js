// Centralized error handler — the single place that turns a thrown error into
// an HTTP response. Must be registered last, after all routes (see index.js).
//
// Handles two cases:
//   1. Known/expected errors (DTOs, services) that already set `err.status` —
//      e.g. `err.status = 400; throw err`. Sent to the client as-is.
//   2. MySQL duplicate-key errors (err.code === 'ER_DUP_ENTRY') — mapped to a
//      400 with a generic message, matching what a couple of controllers
//      (e.g. performance.js) already special-cased individually.
//   3. Anything else — an unexpected/programmer error. Logged in full server-side,
//      client gets a generic 500 so internals (stack traces, SQL, etc.) never leak.
//
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'That record already exists' });
  }

  console.error(err);
  res.status(500).json({ error: 'Server error' });
};
