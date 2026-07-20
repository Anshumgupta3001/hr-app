function roleMiddleware(...allowedRoles) {
  const allowed = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.auth || !allowed.includes(req.auth.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this.' });
    }
    next();
  };
}

module.exports = roleMiddleware;
