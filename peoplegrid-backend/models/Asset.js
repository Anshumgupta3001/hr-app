const mongoose = require('mongoose');

const { Schema } = mongoose;

const assetSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    assetType: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    serialNumber: { type: String, default: '' },
    assignedToEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    assignedAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    status: { type: String, enum: ['available', 'assigned'], default: 'available' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Asset', assetSchema);
