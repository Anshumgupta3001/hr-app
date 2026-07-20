const bcrypt = require('bcrypt');
const Employee = require('../models/Employee');
const generateToken = require('../utils/generateToken');
const { wrap, httpError } = require('../utils/controllerHelpers');

const SALT_ROUNDS = 10;

const login = wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw httpError(400, 'Email and password are required.');
  }
  const employee = await Employee.findOne({ email: email.trim().toLowerCase() });
  if (!employee || !(await bcrypt.compare(password, employee.password))) {
    throw httpError(401, 'Invalid email or password.');
  }
  if (employee.employmentStatus === 'exited') {
    throw httpError(403, 'This account is no longer active.');
  }
  res.json({ token: generateToken(employee), employee });
});

const changePassword = wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    throw httpError(400, 'Current and new password are required.');
  }
  const employee = await Employee.findById(req.auth.employeeId);
  if (!employee) {
    throw httpError(404, 'Employee not found.');
  }
  if (!(await bcrypt.compare(currentPassword, employee.password))) {
    throw httpError(400, 'Current password is incorrect.');
  }
  employee.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await employee.save();
  res.json({ employee });
});

const me = wrap(async (req, res) => {
  const employee = await Employee.findById(req.auth.employeeId);
  if (!employee || employee.employmentStatus === 'exited') {
    throw httpError(401, 'Session is no longer valid.');
  }
  res.json({ employee });
});

module.exports = { login, changePassword, me };
