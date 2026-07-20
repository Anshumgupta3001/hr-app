const Praise = require('../models/Praise');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const createPraise = wrap(async (req, res) => {
  const { toEmployeeId, message } = req.body || {};
  if (!toEmployeeId || !message || !message.trim()) {
    throw httpError(400, 'toEmployeeId and message are required.');
  }
  if (sameId(toEmployeeId, req.auth.employeeId)) {
    throw httpError(400, 'You cannot praise yourself.');
  }

  const target = await Employee.findById(toEmployeeId);
  if (!target || !sameId(target.companyId, req.auth.companyId)) {
    throw httpError(400, 'You can only praise people in your own company.');
  }

  const praise = await Praise.create({
    companyId: req.auth.companyId,
    fromEmployeeId: req.auth.employeeId,
    toEmployeeId,
    message: message.trim().slice(0, 200),
  });

  const fromEmployee = await Employee.findById(req.auth.employeeId);
  await Notification.create({
    companyId: req.auth.companyId,
    audience: 'employee',
    targetEmployeeId: toEmployeeId,
    type: 'praise_received',
    message: `${fromEmployee ? fromEmployee.name : 'Someone'} praised you: "${praise.message}"`,
    relatedLeaveRequestId: null,
  });

  res.status(201).json(praise);
});

const listPraises = wrap(async (req, res) => {
  const { companyId } = req.query;
  const scope = req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  if (!scope) throw httpError(400, 'companyId is required.');
  if (req.auth.role !== 'superadmin' && !sameId(scope, req.auth.companyId)) {
    throw httpError(403, 'You can only view praise in your own company.');
  }
  res.json(await Praise.find({ companyId: scope }).sort({ createdAt: -1 }));
});

module.exports = { createPraise, listPraises };
