// Standard shape for an error that should be sent to the client as-is (status +
// message), as opposed to an unexpected exception that should be logged and
// masked behind a generic 500. DTOs/services already throw plain Errors with a
// `.status` property set — this just gives that convention a name and a
// convenient constructor. `err instanceof AppError` is NOT required anywhere;
// the error middleware treats any thrown error with a numeric `.status` the
// same way, so existing `err.status = 400; throw err` code keeps working
// unchanged.
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

module.exports = AppError;
