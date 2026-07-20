const LeaveRequest = require('../models/LeaveRequest');
const LeaveUsage = require('../models/LeaveUsage');
const GlobalLeavePolicy = require('../models/GlobalLeavePolicy');
const CompanyLeavePolicy = require('../models/CompanyLeavePolicy');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

function sanitizeLeaveTypes(leaveTypes) {
  return (leaveTypes || [])
    .filter((t) => t.name && t.name.trim())
    .map((t) => {
      const mapped = {
        name: t.name.trim(),
        annualQuota: Math.max(0, Number(t.annualQuota) || 0),
      };
      // Preserve existing subdocument ids so stored requests/usage keep
      // pointing at the same leave type.
      if (t.id || t._id) mapped._id = t.id || t._id;
      return mapped;
    });
}

async function getOrCloneCompanyPolicy(companyId) {
  let policy = await CompanyLeavePolicy.findOne({ companyId });
  if (!policy) {
    const global = await GlobalLeavePolicy.findOne();
    policy = await CompanyLeavePolicy.create({
      companyId,
      leaveTypes: (global ? global.leaveTypes : []).map((t) => ({
        name: t.name,
        annualQuota: t.annualQuota,
      })),
    });
  }
  return policy;
}

async function leaveTypeName(companyId, leaveTypeId) {
  const policy = await CompanyLeavePolicy.findOne({ companyId });
  const type = policy && policy.leaveTypes.id(leaveTypeId);
  return type ? type.name : 'Leave';
}

// --- Leave policies ---

const getGlobalPolicy = wrap(async (req, res) => {
  res.json(await GlobalLeavePolicy.findOne());
});

const updateGlobalPolicy = wrap(async (req, res) => {
  const policy = await GlobalLeavePolicy.findOne();
  policy.leaveTypes = sanitizeLeaveTypes((req.body || {}).leaveTypes);
  await policy.save();
  res.json(policy);
});

const getCompanyPolicy = wrap(async (req, res) => {
  const { companyId } = req.params;
  if (req.auth.role !== 'superadmin' && !sameId(req.auth.companyId, companyId)) {
    throw httpError(403, 'You can only view your own company leave policy.');
  }
  res.json(await getOrCloneCompanyPolicy(companyId));
});

const updateCompanyPolicy = wrap(async (req, res) => {
  const { companyId } = req.params;
  const isOwnCompanyAdmin =
    req.auth.role === 'admin' && sameId(req.auth.companyId, companyId);
  if (req.auth.role !== 'superadmin' && !isOwnCompanyAdmin) {
    throw httpError(403, 'You do not have permission to update this leave policy.');
  }
  const policy = await getOrCloneCompanyPolicy(companyId);
  policy.leaveTypes = sanitizeLeaveTypes((req.body || {}).leaveTypes);
  await policy.save();
  res.json(policy);
});

// --- Leave requests ---

const createRequest = wrap(async (req, res) => {
  const { leaveTypeId, startDate, endDate, totalDays, reason } = req.body || {};
  if (!leaveTypeId || !startDate || !endDate || !totalDays) {
    throw httpError(400, 'leaveTypeId, startDate, endDate, and totalDays are required.');
  }
  const companyId = req.auth.companyId;
  if (!companyId) {
    throw httpError(400, 'Only company employees can request leave.');
  }

  const request = await LeaveRequest.create({
    companyId,
    employeeId: req.auth.employeeId,
    leaveTypeId,
    startDate,
    endDate,
    totalDays,
    reason: (reason || '').trim(),
  });

  const employee = await Employee.findById(req.auth.employeeId);
  const typeName = await leaveTypeName(companyId, leaveTypeId);
  await Notification.create({
    companyId,
    audience: 'admin',
    type: 'leave_requested',
    message: `${employee ? employee.name : 'An employee'} requested ${typeName} for ${totalDays} day(s).`,
    relatedLeaveRequestId: request._id,
  });

  res.status(201).json(request);
});

const listRequests = wrap(async (req, res) => {
  const { employeeId, companyId } = req.query;
  if (employeeId) {
    if (
      !sameId(employeeId, req.auth.employeeId) &&
      !['admin', 'hr', 'superadmin'].includes(req.auth.role)
    ) {
      throw httpError(403, 'You can only view your own leave requests.');
    }
    return res.json(
      await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 })
    );
  }
  if (!['admin', 'hr', 'superadmin'].includes(req.auth.role)) {
    return res.json(
      await LeaveRequest.find({ employeeId: req.auth.employeeId }).sort({ createdAt: -1 })
    );
  }
  const scope =
    req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  res.json(await LeaveRequest.find({ companyId: scope }).sort({ createdAt: -1 }));
});

const getRequest = wrap(async (req, res) => {
  const request = await LeaveRequest.findById(req.params.id);
  if (!request) throw httpError(404, 'Leave request not found.');
  const isOwn = sameId(request.employeeId, req.auth.employeeId);
  const isCompanyStaff =
    ['admin', 'hr'].includes(req.auth.role) &&
    sameId(req.auth.companyId, request.companyId);
  if (req.auth.role !== 'superadmin' && !isOwn && !isCompanyStaff) {
    throw httpError(403, 'You do not have permission to view this request.');
  }
  res.json(request);
});

async function decideRequest(req, res, decision) {
  const request = await LeaveRequest.findById(req.params.id);
  if (!request) throw httpError(404, 'Leave request not found.');
  if (
    req.auth.role !== 'superadmin' &&
    !(req.auth.role === 'admin' && sameId(req.auth.companyId, request.companyId))
  ) {
    throw httpError(403, 'Only an admin can decide leave requests.');
  }
  if (request.status !== 'pending') {
    return res.json(request);
  }

  request.status = decision;
  request.decidedAt = new Date();
  request.decidedBy = req.auth.employeeId;
  await request.save();

  if (decision === 'approved') {
    await LeaveUsage.findOneAndUpdate(
      { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId },
      { $inc: { usedDays: request.totalDays } },
      { upsert: true, new: true }
    );
  }

  const typeName = await leaveTypeName(request.companyId, request.leaveTypeId);
  await Notification.create({
    companyId: request.companyId,
    audience: 'employee',
    targetEmployeeId: request.employeeId,
    type: decision === 'approved' ? 'leave_approved' : 'leave_denied',
    message: `Your ${typeName} request (${request.startDate} to ${request.endDate}) was ${decision}.`,
    relatedLeaveRequestId: request._id,
  });

  res.json(request);
}

const approveRequest = wrap((req, res) => decideRequest(req, res, 'approved'));
const denyRequest = wrap((req, res) => decideRequest(req, res, 'denied'));

// --- Leave usage (read-only; balances derive client-side as before) ---

const listUsage = wrap(async (req, res) => {
  const { employeeId } = req.query;
  const targetEmployeeId = employeeId || req.auth.employeeId;
  if (
    !sameId(targetEmployeeId, req.auth.employeeId) &&
    !['admin', 'hr', 'superadmin'].includes(req.auth.role)
  ) {
    throw httpError(403, 'You can only view your own leave usage.');
  }
  res.json(await LeaveUsage.find({ employeeId: targetEmployeeId }));
});

module.exports = {
  getGlobalPolicy,
  updateGlobalPolicy,
  getCompanyPolicy,
  updateCompanyPolicy,
  createRequest,
  listRequests,
  getRequest,
  approveRequest,
  denyRequest,
  listUsage,
};
