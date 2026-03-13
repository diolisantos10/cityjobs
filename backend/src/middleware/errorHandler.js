const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error({ message: err.message, stack: err.stack, url: req.url });

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      message: status === 500 ? 'Internal server error' : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
