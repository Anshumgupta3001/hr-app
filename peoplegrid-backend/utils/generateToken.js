const jwt = require('jsonwebtoken');

function generateToken(employee) {
  return jwt.sign(
    {
      employeeId: employee._id.toString(),
      role: employee.role,
      companyId: employee.companyId ? employee.companyId.toString() : null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = generateToken;
