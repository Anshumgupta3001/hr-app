const bcrypt = require('bcrypt');
const Company = require('../models/Company');
const Employee = require('../models/Employee');
const GlobalLeavePolicy = require('../models/GlobalLeavePolicy');
const CompanyLeavePolicy = require('../models/CompanyLeavePolicy');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveUsage = require('../models/LeaveUsage');
const Notification = require('../models/Notification');
const Praise = require('../models/Praise');
const Holiday = require('../models/Holiday');
const ExpenseClaim = require('../models/ExpenseClaim');
const Announcement = require('../models/Announcement');
const ReviewCycle = require('../models/ReviewCycle');
const Goal = require('../models/Goal');
const Review = require('../models/Review');
const ChecklistTask = require('../models/ChecklistTask');
const Asset = require('../models/Asset');
const ResignationRequest = require('../models/ResignationRequest');
const EmployeeDocument = require('../models/EmployeeDocument');
const CompanyLocation = require('../models/CompanyLocation');
const ShiftPolicy = require('../models/ShiftPolicy');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceRegularization = require('../models/AttendanceRegularization');
const AttendanceExemption = require('../models/AttendanceExemption');
const { deleteObject } = require('../services/s3Service');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const SALT_ROUNDS = 10;

const DEFAULT_HOLIDAYS = [
  { name: 'Republic Day', date: '2026-01-26' },
  { name: 'Independence Day', date: '2026-08-15' },
  { name: 'Gandhi Jayanti', date: '2026-10-02' },
];

function mapDepartments(departments) {
  return (departments || [])
    .filter((d) => d.name && d.name.trim())
    .map((d) => (d.id || d._id ? { _id: d.id || d._id, name: d.name.trim() } : { name: d.name.trim() }));
}

const createCompany = wrap(async (req, res) => {
  const { name, industry, departments, admin } = req.body || {};
  if (!name || !name.trim()) {
    throw httpError(400, 'Company name is required.');
  }
  if (!admin || !admin.name || !admin.email || !admin.password) {
    throw httpError(400, 'Admin name, email, and password are required.');
  }

  const normalizedEmail = admin.email.trim().toLowerCase();
  if (await Employee.findOne({ email: normalizedEmail })) {
    throw httpError(409, 'An account with this email already exists.');
  }

  const company = await Company.create({
    name: name.trim(),
    industry: (industry || '').trim(),
    createdBy: req.auth.employeeId,
    departments: mapDepartments(departments),
  });

  try {
    await Employee.create({
      companyId: company._id,
      name: admin.name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(admin.password, SALT_ROUNDS),
      role: 'admin',
      designation: (admin.designation || 'Company Admin').trim(),
    });
  } catch (err) {
    await Company.deleteOne({ _id: company._id });
    throw err;
  }

  const globalPolicy = await GlobalLeavePolicy.findOne();
  await CompanyLeavePolicy.create({
    companyId: company._id,
    leaveTypes: (globalPolicy ? globalPolicy.leaveTypes : []).map((t) => ({
      name: t.name,
      annualQuota: t.annualQuota,
    })),
  });

  await Holiday.insertMany(
    DEFAULT_HOLIDAYS.map((h) => ({ companyId: company._id, ...h }))
  );

  res.status(201).json(company);
});

const listCompanies = wrap(async (req, res) => {
  res.json(await Company.find().sort({ createdAt: 1 }));
});

const getCompany = wrap(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw httpError(404, 'Company not found.');
  if (req.auth.role !== 'superadmin' && !sameId(req.auth.companyId, company._id)) {
    throw httpError(403, 'You do not have permission to view this company.');
  }
  res.json(company);
});

const updateCompany = wrap(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw httpError(404, 'Company not found.');
  const isOwnCompanyAdmin =
    req.auth.role === 'admin' && sameId(req.auth.companyId, company._id);
  if (req.auth.role !== 'superadmin' && !isOwnCompanyAdmin) {
    throw httpError(403, 'You do not have permission to update this company.');
  }
  const updates = req.body || {};
  if (updates.name !== undefined) company.name = updates.name.trim();
  if (updates.industry !== undefined) company.industry = updates.industry.trim();
  if (updates.departments !== undefined) {
    company.departments = mapDepartments(updates.departments);
  }
  await company.save();
  res.json(company);
});

const updateDepartments = wrap(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw httpError(404, 'Company not found.');
  const isOwnCompanyAdmin =
    req.auth.role === 'admin' && sameId(req.auth.companyId, company._id);
  if (req.auth.role !== 'superadmin' && !isOwnCompanyAdmin) {
    throw httpError(403, 'You do not have permission to update this company.');
  }
  company.departments = mapDepartments((req.body || {}).departments);
  await company.save();
  res.json(company);
});

const deleteCompany = wrap(async (req, res) => {
  const companyId = req.params.id;
  const company = await Company.findById(companyId);
  if (!company) throw httpError(404, 'Company not found.');

  const employees = await Employee.find({ companyId }).select('_id');
  const employeeIds = employees.map((e) => e._id);

  const documents = await EmployeeDocument.find({ companyId }).select('s3Key');
  await Promise.all(
    documents.map((d) => deleteObject(d.s3Key).catch(() => {}))
  );

  await Promise.all([
    Employee.deleteMany({ companyId }),
    LeaveUsage.deleteMany({ employeeId: { $in: employeeIds } }),
    LeaveRequest.deleteMany({ companyId }),
    CompanyLeavePolicy.deleteMany({ companyId }),
    Notification.deleteMany({ companyId }),
    Holiday.deleteMany({ companyId }),
    Praise.deleteMany({ companyId }),
    ExpenseClaim.deleteMany({ companyId }),
    Announcement.deleteMany({ companyId }),
    ReviewCycle.deleteMany({ companyId }),
    Goal.deleteMany({ companyId }),
    Review.deleteMany({ companyId }),
    ChecklistTask.deleteMany({ companyId }),
    Asset.deleteMany({ companyId }),
    ResignationRequest.deleteMany({ companyId }),
    EmployeeDocument.deleteMany({ companyId }),
    CompanyLocation.deleteMany({ companyId }),
    ShiftPolicy.deleteMany({ companyId }),
    AttendanceRecord.deleteMany({ companyId }),
    AttendanceRegularization.deleteMany({ companyId }),
    AttendanceExemption.deleteMany({ companyId }),
  ]);

  await Company.deleteOne({ _id: companyId });
  res.json({ deleted: true });
});

module.exports = {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  updateDepartments,
  deleteCompany,
};
