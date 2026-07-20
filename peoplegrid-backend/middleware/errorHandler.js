function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const status = err.statusCode || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: err.message || 'Something went wrong.' });
}

module.exports = errorHandler;
