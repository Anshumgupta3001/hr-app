const mongoose = require('mongoose');

const { Schema } = mongoose;

const employeeDocumentSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    documentType: { type: String, required: true },
    label: { type: String, default: '' },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    s3Key: { type: String, required: true },
  },
  { timestamps: true }
);

// Server-side records are always S3-backed; the client-only local fallback
// (Part 16) never reaches this collection. These virtuals keep the shared
// screen components' `storageType` / `uploadedAt` checks working.
employeeDocumentSchema.virtual('storageType').get(function () {
  return 's3';
});
employeeDocumentSchema.virtual('uploadedAt').get(function () {
  return this.createdAt;
});

module.exports = mongoose.model('EmployeeDocument', employeeDocumentSchema);
