const Notification = require('../models/Notification');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const listNotifications = wrap(async (req, res) => {
  const { audience, companyId } = req.query;

  if (audience === 'admin') {
    const scope =
      req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
    if (req.auth.role !== 'superadmin' && req.auth.role !== 'admin') {
      throw httpError(403, 'Only admins can view admin notifications.');
    }
    if (!scope) {
      throw httpError(400, 'companyId is required.');
    }
    return res.json(
      await Notification.find({ companyId: scope, audience: 'admin' }).sort({
        createdAt: -1,
      })
    );
  }

  res.json(
    await Notification.find({
      audience: 'employee',
      targetEmployeeId: req.auth.employeeId,
    }).sort({ createdAt: -1 })
  );
});

const markRead = wrap(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw httpError(404, 'Notification not found.');

  const isRecipient =
    notification.audience === 'employee' &&
    sameId(notification.targetEmployeeId, req.auth.employeeId);
  const isCompanyAdmin =
    notification.audience === 'admin' &&
    (req.auth.role === 'superadmin' ||
      (req.auth.role === 'admin' && sameId(req.auth.companyId, notification.companyId)));

  if (!isRecipient && !isCompanyAdmin) {
    throw httpError(403, 'You do not have permission to update this notification.');
  }

  notification.isRead = true;
  await notification.save();
  res.json(notification);
});

module.exports = { listNotifications, markRead };
