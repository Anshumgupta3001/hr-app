const Holiday = require('../models/Holiday');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const listHolidays = wrap(async (req, res) => {
  const { companyId } = req.query;
  const scope = req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  if (!scope) throw httpError(400, 'companyId is required.');
  if (req.auth.role !== 'superadmin' && !sameId(scope, req.auth.companyId)) {
    throw httpError(403, 'You can only view holidays for your own company.');
  }
  res.json(await Holiday.find({ companyId: scope }).sort({ date: 1 }));
});

function assertCanManage(req, companyId) {
  if (req.auth.role === 'superadmin') return;
  if (req.auth.role !== 'admin' || !sameId(req.auth.companyId, companyId)) {
    throw httpError(403, 'Only an admin can manage holidays.');
  }
}

const createHoliday = wrap(async (req, res) => {
  const { companyId, name, date } = req.body || {};
  if (!name || !name.trim() || !date) {
    throw httpError(400, 'name and date are required.');
  }
  const scope = req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  assertCanManage(req, scope);
  res.status(201).json(
    await Holiday.create({ companyId: scope, name: name.trim(), date })
  );
});

const deleteHoliday = wrap(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) throw httpError(404, 'Holiday not found.');
  assertCanManage(req, holiday.companyId);
  await Holiday.deleteOne({ _id: holiday._id });
  res.json({ deleted: true });
});

module.exports = { listHolidays, createHoliday, deleteHoliday };
