const ExpenseClaim = require('../models/ExpenseClaim');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const createClaim = wrap(async (req, res) => {
  const { category, amount, dateIncurred, description } = req.body || {};
  if (!category || amount == null || !dateIncurred) {
    throw httpError(400, 'category, amount, and dateIncurred are required.');
  }
  const companyId = req.auth.companyId;
  if (!companyId) {
    throw httpError(400, 'Only company employees can submit expense claims.');
  }

  const claim = await ExpenseClaim.create({
    companyId,
    employeeId: req.auth.employeeId,
    category,
    amount: Number(amount),
    dateIncurred,
    description: (description || '').trim(),
  });

  const employee = await Employee.findById(req.auth.employeeId);
  await Notification.create({
    companyId,
    audience: 'admin',
    type: 'expense_submitted',
    message: `${employee ? employee.name : 'An employee'} submitted a ${category} expense claim for ₹${claim.amount}.`,
    relatedLeaveRequestId: null,
  });

  res.status(201).json(claim);
});

const listClaims = wrap(async (req, res) => {
  const { employeeId, companyId } = req.query;
  if (employeeId) {
    if (
      !sameId(employeeId, req.auth.employeeId) &&
      !['admin', 'hr', 'superadmin'].includes(req.auth.role)
    ) {
      throw httpError(403, 'You can only view your own expense claims.');
    }
    return res.json(await ExpenseClaim.find({ employeeId }).sort({ createdAt: -1 }));
  }
  if (!['admin', 'hr', 'superadmin'].includes(req.auth.role)) {
    return res.json(
      await ExpenseClaim.find({ employeeId: req.auth.employeeId }).sort({ createdAt: -1 })
    );
  }
  const scope = req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  res.json(await ExpenseClaim.find({ companyId: scope }).sort({ createdAt: -1 }));
});

async function decideClaim(req, res, decision) {
  const claim = await ExpenseClaim.findById(req.params.id);
  if (!claim) throw httpError(404, 'Expense claim not found.');
  if (
    req.auth.role !== 'superadmin' &&
    !(req.auth.role === 'admin' && sameId(req.auth.companyId, claim.companyId))
  ) {
    throw httpError(403, 'Only an admin can decide expense claims.');
  }
  if (claim.status !== 'pending') {
    return res.json(claim);
  }

  claim.status = decision;
  claim.decidedAt = new Date();
  claim.decidedBy = req.auth.employeeId;
  await claim.save();

  await Notification.create({
    companyId: claim.companyId,
    audience: 'employee',
    targetEmployeeId: claim.employeeId,
    type: 'expense_decided',
    message: `Your ${claim.category} expense claim for ₹${claim.amount} was ${decision}.`,
    relatedLeaveRequestId: null,
  });

  res.json(claim);
}

const approveClaim = wrap((req, res) => decideClaim(req, res, 'approved'));
const denyClaim = wrap((req, res) => decideClaim(req, res, 'denied'));

module.exports = { createClaim, listClaims, approveClaim, denyClaim };
