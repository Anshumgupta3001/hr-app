const ReviewCycle = require('../models/ReviewCycle');
const Goal = require('../models/Goal');
const Review = require('../models/Review');
const Employee = require('../models/Employee');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

// --- Review cycles ---

const createCycle = wrap(async (req, res) => {
  const { name, startDate, endDate } = req.body || {};
  if (!name || !name.trim() || !startDate || !endDate) {
    throw httpError(400, 'name, startDate, and endDate are required.');
  }
  res.status(201).json(
    await ReviewCycle.create({
      companyId: req.auth.companyId,
      name: name.trim(),
      startDate,
      endDate,
    })
  );
});

const listCycles = wrap(async (req, res) => {
  const { companyId } = req.query;
  const scope = req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  if (!scope) throw httpError(400, 'companyId is required.');
  if (req.auth.role !== 'superadmin' && !sameId(scope, req.auth.companyId)) {
    throw httpError(403, 'You can only view review cycles in your own company.');
  }
  res.json(await ReviewCycle.find({ companyId: scope }).sort({ startDate: -1 }));
});

const updateCycle = wrap(async (req, res) => {
  const cycle = await ReviewCycle.findById(req.params.id);
  if (!cycle) throw httpError(404, 'Review cycle not found.');
  if (
    req.auth.role !== 'superadmin' &&
    !(req.auth.role === 'admin' && sameId(req.auth.companyId, cycle.companyId))
  ) {
    throw httpError(403, 'Only an admin can manage review cycles.');
  }
  const { status } = req.body || {};
  if (status) cycle.status = status;
  await cycle.save();
  res.json(cycle);
});

// --- Goals ---

const createGoal = wrap(async (req, res) => {
  const { cycleId, title, description } = req.body || {};
  if (!cycleId || !title || !title.trim()) {
    throw httpError(400, 'cycleId and title are required.');
  }
  res.status(201).json(
    await Goal.create({
      companyId: req.auth.companyId,
      employeeId: req.auth.employeeId,
      cycleId,
      title: title.trim(),
      description: (description || '').trim(),
    })
  );
});

const updateGoal = wrap(async (req, res) => {
  const goal = await Goal.findById(req.params.id);
  if (!goal) throw httpError(404, 'Goal not found.');
  if (!sameId(goal.employeeId, req.auth.employeeId)) {
    throw httpError(403, 'You can only update your own goals.');
  }
  const updates = req.body || {};
  if (updates.title !== undefined) goal.title = updates.title.trim();
  if (updates.description !== undefined) goal.description = updates.description.trim();
  if (updates.status !== undefined) goal.status = updates.status;
  await goal.save();
  res.json(goal);
});

async function canViewEmployeeRecords(auth, employeeId) {
  if (sameId(employeeId, auth.employeeId)) return true;
  if (['admin', 'hr', 'superadmin'].includes(auth.role)) return true;
  const target = await Employee.findById(employeeId).select('managerId');
  return !!target && sameId(target.managerId, auth.employeeId);
}

const listGoals = wrap(async (req, res) => {
  const { employeeId, cycleId } = req.query;
  const targetEmployeeId = employeeId || req.auth.employeeId;
  if (!(await canViewEmployeeRecords(req.auth, targetEmployeeId))) {
    throw httpError(403, 'You can only view your own or your reports’ goals.');
  }
  const filter = { employeeId: targetEmployeeId };
  if (cycleId) filter.cycleId = cycleId;
  res.json(await Goal.find(filter));
});

// --- Reviews ---

const getOrCreateReview = wrap(async (req, res) => {
  const { cycleId, employeeId } = req.body || {};
  if (!cycleId || !employeeId) {
    throw httpError(400, 'cycleId and employeeId are required.');
  }
  if (!(await canViewEmployeeRecords(req.auth, employeeId))) {
    throw httpError(403, 'You do not have permission to view this review.');
  }

  let review = await Review.findOne({ cycleId, employeeId });
  if (!review) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw httpError(404, 'Employee not found.');
    review = await Review.create({
      companyId: employee.companyId,
      cycleId,
      employeeId,
      managerId: employee.managerId || null,
    });
  }
  res.json(review);
});

const listReviews = wrap(async (req, res) => {
  const { cycleId } = req.query;
  if (!['admin', 'hr', 'superadmin'].includes(req.auth.role)) {
    throw httpError(403, 'You do not have permission to list reviews.');
  }
  const filter = {};
  if (req.auth.role !== 'superadmin') filter.companyId = req.auth.companyId;
  if (cycleId) filter.cycleId = cycleId;
  res.json(await Review.find(filter));
});

const submitSelfReview = wrap(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, 'Review not found.');
  if (!sameId(review.employeeId, req.auth.employeeId)) {
    throw httpError(403, 'You can only submit your own self-review.');
  }
  if (review.status !== 'pending_self') {
    return res.json(review);
  }
  const { selfRating, selfComments } = req.body || {};
  review.selfRating = Number(selfRating);
  review.selfComments = (selfComments || '').trim();
  review.status = review.managerId ? 'pending_manager' : 'completed';
  await review.save();
  res.json(review);
});

const submitManagerReview = wrap(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, 'Review not found.');
  if (!sameId(review.managerId, req.auth.employeeId)) {
    throw httpError(403, 'Only this employee’s manager can submit the manager review.');
  }
  if (review.status !== 'pending_manager') {
    return res.json(review);
  }
  const { managerRating, managerComments } = req.body || {};
  review.managerRating = Number(managerRating);
  review.managerComments = (managerComments || '').trim();
  review.status = 'completed';
  await review.save();
  res.json(review);
});

module.exports = {
  createCycle,
  listCycles,
  updateCycle,
  createGoal,
  updateGoal,
  listGoals,
  getOrCreateReview,
  listReviews,
  submitSelfReview,
  submitManagerReview,
};
