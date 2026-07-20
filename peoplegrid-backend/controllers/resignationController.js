const ResignationRequest = require('../models/ResignationRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const createResignation = wrap(async (req, res) => {
  const { proposedLastWorkingDay, reason } = req.body || {};
  if (!proposedLastWorkingDay) {
    throw httpError(400, 'proposedLastWorkingDay is required.');
  }
  const companyId = req.auth.companyId;
  if (!companyId) {
    throw httpError(400, 'Only company employees can submit a resignation.');
  }

  const resignation = await ResignationRequest.create({
    companyId,
    employeeId: req.auth.employeeId,
    proposedLastWorkingDay,
    reason: (reason || '').trim(),
  });

  const employee = await Employee.findById(req.auth.employeeId);
  await Notification.create({
    companyId,
    audience: 'admin',
    type: 'resignation_submitted',
    message: `${employee ? employee.name : 'An employee'} submitted their resignation (last working day ${proposedLastWorkingDay}).`,
    relatedLeaveRequestId: null,
  });

  res.status(201).json(resignation);
});

const listResignations = wrap(async (req, res) => {
  const { employeeId, companyId } = req.query;
  if (employeeId) {
    if (
      !sameId(employeeId, req.auth.employeeId) &&
      !['admin', 'hr', 'superadmin'].includes(req.auth.role)
    ) {
      throw httpError(403, 'You can only view your own resignation.');
    }
    return res.json(
      await ResignationRequest.find({ employeeId }).sort({ createdAt: -1 })
    );
  }
  if (!['admin', 'hr', 'superadmin'].includes(req.auth.role)) {
    return res.json(
      await ResignationRequest.find({ employeeId: req.auth.employeeId }).sort({
        createdAt: -1,
      })
    );
  }
  const scope = req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  res.json(await ResignationRequest.find({ companyId: scope }).sort({ createdAt: -1 }));
});

const acknowledgeResignation = wrap(async (req, res) => {
  const resignation = await ResignationRequest.findById(req.params.id);
  if (!resignation) throw httpError(404, 'Resignation not found.');
  if (
    req.auth.role !== 'superadmin' &&
    !(req.auth.role === 'admin' && sameId(req.auth.companyId, resignation.companyId))
  ) {
    throw httpError(403, 'Only an admin can acknowledge resignations.');
  }
  if (resignation.status !== 'pending') {
    return res.json(resignation);
  }

  resignation.status = 'acknowledged';
  resignation.acknowledgedAt = new Date();
  await resignation.save();

  await Employee.updateOne(
    { _id: resignation.employeeId },
    { employmentStatus: 'on_notice' }
  );
  await Notification.create({
    companyId: resignation.companyId,
    audience: 'employee',
    targetEmployeeId: resignation.employeeId,
    type: 'resignation_acknowledged',
    message: 'Your resignation has been acknowledged by your admin.',
    relatedLeaveRequestId: null,
  });

  res.json(resignation);
});

module.exports = { createResignation, listResignations, acknowledgeResignation };
