const { v4: uuidv4 } = require('uuid');
const EmployeeDocument = require('../models/EmployeeDocument');
const { getUploadUrl, getDownloadUrl, deleteObject } = require('../services/s3Service');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const SINGLE_SLOT_TYPES = ['profilePhoto', 'aadhar', 'pan', 'passport', 'bankProof'];

// --- Presigned URL actions (Part 14, unchanged behavior) ---

const uploadUrl = wrap(async (req, res) => {
  const { companyId, employeeId, documentType, fileName, fileType } = req.body || {};

  if (!companyId || !employeeId || !documentType || !fileName || !fileType) {
    throw httpError(
      400,
      'companyId, employeeId, documentType, fileName, and fileType are all required.'
    );
  }
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    throw httpError(400, 'fileType must be one of image/jpeg, image/png, or application/pdf.');
  }

  const key = `companies/${companyId}/employees/${employeeId}/${documentType}/${uuidv4()}-${fileName}`;
  const url = await getUploadUrl(key, fileType);
  res.json({ uploadUrl: url, key });
});

const downloadUrl = wrap(async (req, res) => {
  const { key } = req.query;
  if (!key) throw httpError(400, 'key query parameter is required.');
  res.json({ downloadUrl: await getDownloadUrl(key) });
});

const deleteByKey = wrap(async (req, res) => {
  const { key } = req.query;
  if (!key) throw httpError(400, 'key query parameter is required.');
  await deleteObject(key);
  res.json({ deleted: true });
});

// --- Metadata CRUD (Part 17: was frontend local storage, now Mongo) ---

const createDocument = wrap(async (req, res) => {
  const { documentType, label, fileName, mimeType, fileSize, s3Key } = req.body || {};
  if (!documentType || !fileName || !mimeType || !s3Key) {
    throw httpError(400, 'documentType, fileName, mimeType, and s3Key are required.');
  }

  // Employees manage their own documents; admin/hr views are read-only.
  const employeeId = req.auth.employeeId;
  const companyId = req.auth.companyId;
  if (!companyId) {
    throw httpError(400, 'Only company employees can save documents.');
  }

  if (SINGLE_SLOT_TYPES.includes(documentType)) {
    const existing = await EmployeeDocument.findOne({ employeeId, documentType });
    if (existing) {
      await deleteObject(existing.s3Key).catch(() => {});
      await EmployeeDocument.deleteOne({ _id: existing._id });
    }
  }

  const record = await EmployeeDocument.create({
    companyId,
    employeeId,
    documentType,
    label: documentType === 'other' ? (label || '').trim() : '',
    fileName,
    mimeType,
    fileSize: fileSize || 0,
    s3Key,
  });

  res.status(201).json(record);
});

const listDocuments = wrap(async (req, res) => {
  const { employeeId } = req.query;
  const targetEmployeeId = employeeId || req.auth.employeeId;
  if (
    !sameId(targetEmployeeId, req.auth.employeeId) &&
    !['admin', 'hr', 'superadmin'].includes(req.auth.role)
  ) {
    throw httpError(403, 'You can only view your own documents.');
  }
  res.json(await EmployeeDocument.find({ employeeId: targetEmployeeId }));
});

const deleteDocument = wrap(async (req, res) => {
  const record = await EmployeeDocument.findById(req.params.id);
  if (!record) throw httpError(404, 'Document not found.');
  if (!sameId(record.employeeId, req.auth.employeeId)) {
    throw httpError(403, 'You can only remove your own documents.');
  }
  await deleteObject(record.s3Key).catch(() => {});
  await EmployeeDocument.deleteOne({ _id: record._id });
  res.json({ deleted: true });
});

module.exports = {
  uploadUrl,
  downloadUrl,
  deleteByKey,
  createDocument,
  listDocuments,
  deleteDocument,
};
