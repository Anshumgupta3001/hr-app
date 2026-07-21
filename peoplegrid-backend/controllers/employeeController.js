const bcrypt = require('bcrypt');
const Employee = require('../models/Employee');
const ChecklistTask = require('../models/ChecklistTask');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const SALT_ROUNDS = 10;
const PASSWORD_PLACEHOLDER = '********';

const DEFAULT_ONBOARDING = [
  'Collect ID documents',
  'Issue laptop',
  'Add to company communication tools',
  'Complete policy orientation',
];

const DEFAULT_OFFBOARDING = [
  'Collect laptop and ID card',
  'Revoke system access',
  'Conduct exit interview',
  'Process final settlement',
];

async function seedChecklist(companyId, employeeId, type, titles) {
  const existing = await ChecklistTask.findOne({ employeeId, type });
  if (existing) return;
  await ChecklistTask.insertMany(
    titles.map((title) => ({ companyId, employeeId, type, title }))
  );
}

function assertCanManage(req, employee) {
  if (req.auth.role === 'superadmin') return;
  if (
    !['admin', 'hr'].includes(req.auth.role) ||
    !sameId(req.auth.companyId, employee.companyId)
  ) {
    throw httpError(403, 'You do not have permission to manage this employee.');
  }
}

// Only an admin (or superadmin) may grant admin access — hr cannot promote.
function assertCanGrantAdmin(req) {
  if (!['admin', 'superadmin'].includes(req.auth.role)) {
    throw httpError(403, 'Only an admin can grant admin access.');
  }
}

async function countAdmins(companyId, excludeEmployeeId = null) {
  const filter = { companyId, role: 'admin' };
  if (excludeEmployeeId) filter._id = { $ne: excludeEmployeeId };
  return Employee.countDocuments(filter);
}

async function assertNotLastAdmin(companyId, excludeEmployeeId) {
  const remaining = await countAdmins(companyId, excludeEmployeeId);
  if (remaining === 0) {
    throw httpError(400, 'A company must have at least one admin.');
  }
}

const listEmployees = wrap(async (req, res) => {
  const { companyId } = req.query;
  if (req.auth.role === 'superadmin') {
    const filter = companyId ? { companyId, role: { $ne: 'superadmin' } } : {};
    return res.json(await Employee.find(filter).sort({ createdAt: 1 }));
  }
  if (companyId && !sameId(companyId, req.auth.companyId)) {
    throw httpError(403, 'You can only view employees of your own company.');
  }
  res.json(
    await Employee.find({
      companyId: req.auth.companyId,
      role: { $ne: 'superadmin' },
    }).sort({ createdAt: 1 })
  );
});

const getEmployee = wrap(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw httpError(404, 'Employee not found.');
  const isSelf = sameId(req.auth.employeeId, employee._id);
  const isSameCompany = sameId(req.auth.companyId, employee.companyId);
  if (req.auth.role !== 'superadmin' && !isSelf && !isSameCompany) {
    throw httpError(403, 'You do not have permission to view this employee.');
  }
  res.json(employee);
});

const createEmployee = wrap(async (req, res) => {
  const {
    companyId,
    name,
    email,
    password,
    role,
    departmentId = null,
    designation = '',
    managerId = null,
    probationEndDate = null,
    profile = {},
  } = req.body || {};

  if (!name || !email || !password || !role) {
    throw httpError(400, 'Name, email, password, and role are required.');
  }
  if (role === 'admin') {
    assertCanGrantAdmin(req);
  }

  const targetCompanyId =
    req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  if (!targetCompanyId) {
    throw httpError(400, 'companyId is required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await Employee.findOne({ email: normalizedEmail })) {
    throw httpError(409, 'An account with this email already exists.');
  }

  const PROFILE_KEYS = [
    'dateOfBirth',
    'dateOfJoining',
    'previousCompanyName',
    'totalExperienceYears',
    'previousRoleNotes',
    'bankDetails',
    'aadharNumber',
    'panNumber',
    'passportNumber',
  ];
  const profileFields = {};
  for (const key of PROFILE_KEYS) {
    if (profile[key] !== undefined) profileFields[key] = profile[key];
  }

  const employee = await Employee.create({
    companyId: targetCompanyId,
    name: name.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, SALT_ROUNDS),
    role,
    departmentId: departmentId || null,
    designation: (designation || '').trim(),
    managerId: managerId || null,
    probationEndDate: probationEndDate || null,
    ...profileFields,
  });

  await seedChecklist(targetCompanyId, employee._id, 'onboarding', DEFAULT_ONBOARDING);

  res.status(201).json(employee);
});

const updateEmployee = wrap(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw httpError(404, 'Employee not found.');

  const isSelf = sameId(req.auth.employeeId, employee._id);
  if (!isSelf) {
    assertCanManage(req, employee);
  }

  const updates = { ...(req.body || {}) };

  // These are management-only fields; a self-update can never touch them.
  if (isSelf && !['admin', 'hr', 'superadmin'].includes(req.auth.role)) {
    delete updates.role;
    delete updates.companyId;
    delete updates.employmentStatus;
    delete updates.managerId;
    delete updates.status;
  }
  delete updates._id;
  delete updates.id;

  if (updates.role !== undefined && updates.role !== employee.role) {
    if (updates.role === 'admin') {
      assertCanGrantAdmin(req);
    } else if (employee.role === 'admin') {
      await assertNotLastAdmin(employee.companyId, employee._id);
    }
  }

  if (updates.email) {
    const normalizedEmail = updates.email.trim().toLowerCase();
    const existing = await Employee.findOne({ email: normalizedEmail });
    if (existing && !sameId(existing._id, employee._id)) {
      throw httpError(409, 'An account with this email already exists.');
    }
    updates.email = normalizedEmail;
  }

  if (!updates.password || updates.password === PASSWORD_PLACEHOLDER) {
    delete updates.password;
  } else {
    updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
  }

  Object.assign(employee, updates);
  await employee.save();
  res.json(employee);
});

const deleteEmployee = wrap(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw httpError(404, 'Employee not found.');
  assertCanManage(req, employee);
  if (employee.role === 'admin') {
    await assertNotLastAdmin(employee.companyId, employee._id);
  }
  await Employee.deleteOne({ _id: employee._id });
  res.json({ deleted: true });
});

const markExited = wrap(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw httpError(404, 'Employee not found.');
  if (
    req.auth.role !== 'superadmin' &&
    !(req.auth.role === 'admin' && sameId(req.auth.companyId, employee.companyId))
  ) {
    throw httpError(403, 'Only an admin can mark an employee as exited.');
  }
  employee.employmentStatus = 'exited';
  await employee.save();
  await seedChecklist(employee.companyId, employee._id, 'offboarding', DEFAULT_OFFBOARDING);
  res.json(employee);
});

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  markExited,
};
