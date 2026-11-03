const {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require("../helper/customErrors");

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;
  let message = "Internal server error";

  if (error instanceof UnauthorizedError) {
    statusCode = 401;
    message = error.message;
  } else if (error instanceof ForbiddenError) {
    statusCode = 403;
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    message = error.message;
  } else if (error instanceof ValidationError) {
    statusCode = 422;
    message = error.message;
  }

  if (statusCode === 500) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: "unhandled_request_error",
      requestId: req.id || req.headers["x-request-id"] || null,
      errorType: error?.name || "Error",
    }));
  }

  return res.status(statusCode).json({
    errors: {
      body: [message],
    },
  });
};

module.exports = errorHandler;
