const Announcement = require('../models/Announcement');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const createAnnouncement = wrap(async (req, res) => {
  const { title, message } = req.body || {};
  if (!title || !title.trim() || !message || !message.trim()) {
    throw httpError(400, 'title and message are required.');
  }
  if (req.auth.role !== 'admin') {
    throw httpError(403, 'Only an admin can post announcements.');
  }

  const announcement = await Announcement.create({
    companyId: req.auth.companyId,
    postedBy: req.auth.employeeId,
    title: title.trim(),
    message: message.trim(),
  });

  const employees = await Employee.find({
    companyId: req.auth.companyId,
    role: { $ne: 'superadmin' },
  }).select('_id');

  await Notification.insertMany(
    employees
      .filter((e) => !sameId(e._id, req.auth.employeeId))
      .map((e) => ({
        companyId: req.auth.companyId,
        audience: 'employee',
        targetEmployeeId: e._id,
        type: 'announcement_posted',
        message: `New announcement: ${announcement.title}`,
        relatedLeaveRequestId: null,
      }))
  );

  res.status(201).json(announcement);
});

const listAnnouncements = wrap(async (req, res) => {
  const { companyId } = req.query;
  const scope = req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  if (!scope) throw httpError(400, 'companyId is required.');
  if (req.auth.role !== 'superadmin' && !sameId(scope, req.auth.companyId)) {
    throw httpError(403, 'You can only view announcements in your own company.');
  }
  res.json(await Announcement.find({ companyId: scope }).sort({ createdAt: -1 }));
});

module.exports = { createAnnouncement, listAnnouncements };
