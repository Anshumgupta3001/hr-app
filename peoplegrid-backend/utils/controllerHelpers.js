// Wraps async route handlers so rejections reach the error middleware.
function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function sameId(a, b) {
  if (a == null || b == null) return false;
  return a.toString() === b.toString();
}

module.exports = { wrap, httpError, sameId };
