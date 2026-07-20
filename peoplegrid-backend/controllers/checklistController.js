const ChecklistTask = require('../models/ChecklistTask');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

function assertScope(req, companyId) {
  if (req.auth.role === 'superadmin') return;
  if (!sameId(req.auth.companyId, companyId)) {
    throw httpError(403, 'You can only manage checklists in your own company.');
  }
}

const listTasks = wrap(async (req, res) => {
  const { employeeId } = req.query;
  if (!employeeId) throw httpError(400, 'employeeId is required.');
  const tasks = await ChecklistTask.find({ employeeId }).sort({ createdAt: 1 });
  if (tasks.length > 0) assertScope(req, tasks[0].companyId);
  res.json(tasks);
});

const createTask = wrap(async (req, res) => {
  const { employeeId, type, title } = req.body || {};
  if (!employeeId || !type || !title || !title.trim()) {
    throw httpError(400, 'employeeId, type, and title are required.');
  }
  const companyId =
    req.auth.role === 'superadmin' ? (req.body || {}).companyId : req.auth.companyId;
  res.status(201).json(
    await ChecklistTask.create({
      companyId,
      employeeId,
      type,
      title: title.trim(),
    })
  );
});

const updateTask = wrap(async (req, res) => {
  const task = await ChecklistTask.findById(req.params.id);
  if (!task) throw httpError(404, 'Task not found.');
  assertScope(req, task.companyId);

  const updates = req.body || {};
  if (updates.toggle === true) {
    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
  } else if (updates.isCompleted !== undefined) {
    task.isCompleted = !!updates.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
  }
  if (updates.title !== undefined) task.title = updates.title.trim();
  await task.save();
  res.json(task);
});

const deleteTask = wrap(async (req, res) => {
  const task = await ChecklistTask.findById(req.params.id);
  if (!task) throw httpError(404, 'Task not found.');
  assertScope(req, task.companyId);
  await ChecklistTask.deleteOne({ _id: task._id });
  res.json({ deleted: true });
});

module.exports = { listTasks, createTask, updateTask, deleteTask };
