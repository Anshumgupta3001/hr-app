const Asset = require('../models/Asset');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

function assertManage(req, companyId) {
  if (req.auth.role === 'superadmin') return;
  if (
    !['admin', 'hr'].includes(req.auth.role) ||
    !sameId(req.auth.companyId, companyId)
  ) {
    throw httpError(403, 'Only admin or HR can manage assets.');
  }
}

const listAssets = wrap(async (req, res) => {
  const { companyId, employeeId } = req.query;

  if (employeeId) {
    // Everyone may read their own assigned assets; admin/hr may read anyone's.
    if (
      !sameId(employeeId, req.auth.employeeId) &&
      !['admin', 'hr', 'superadmin'].includes(req.auth.role)
    ) {
      throw httpError(403, 'You can only view your own assets.');
    }
    return res.json(
      await Asset.find({ assignedToEmployeeId: employeeId, status: 'assigned' })
    );
  }

  const scope = req.auth.role === 'superadmin' ? companyId : req.auth.companyId;
  if (!scope) throw httpError(400, 'companyId is required.');
  if (req.auth.role !== 'superadmin') {
    assertManage(req, scope);
  }
  res.json(await Asset.find({ companyId: scope }));
});

const createAsset = wrap(async (req, res) => {
  const { assetType, name, serialNumber } = req.body || {};
  if (!assetType || !name || !name.trim()) {
    throw httpError(400, 'assetType and name are required.');
  }
  const companyId =
    req.auth.role === 'superadmin' ? (req.body || {}).companyId : req.auth.companyId;
  assertManage(req, companyId);
  res.status(201).json(
    await Asset.create({
      companyId,
      assetType,
      name: name.trim(),
      serialNumber: (serialNumber || '').trim(),
    })
  );
});

const assignAsset = wrap(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) throw httpError(404, 'Asset not found.');
  assertManage(req, asset.companyId);
  const { employeeId } = req.body || {};
  if (!employeeId) throw httpError(400, 'employeeId is required.');
  if (asset.status === 'available') {
    asset.assignedToEmployeeId = employeeId;
    asset.assignedAt = new Date();
    asset.returnedAt = null;
    asset.status = 'assigned';
    await asset.save();
  }
  res.json(asset);
});

const returnAsset = wrap(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) throw httpError(404, 'Asset not found.');
  assertManage(req, asset.companyId);
  if (asset.status === 'assigned') {
    asset.returnedAt = new Date();
    asset.assignedToEmployeeId = null;
    asset.assignedAt = null;
    asset.status = 'available';
    await asset.save();
  }
  res.json(asset);
});

const deleteAsset = wrap(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) throw httpError(404, 'Asset not found.');
  assertManage(req, asset.companyId);
  await Asset.deleteOne({ _id: asset._id });
  res.json({ deleted: true });
});

module.exports = { listAssets, createAsset, assignAsset, returnAsset, deleteAsset };
