const mongoose = require('mongoose');

const { Schema } = mongoose;

const resignationRequestSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    proposedLastWorkingDay: { type: String, required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'acknowledged'], default: 'pending' },
    acknowledgedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// The frontends have always sorted/displayed on `submittedAt`.
resignationRequestSchema.virtual('submittedAt').get(function () {
  return this.createdAt;
});

module.exports = mongoose.model('ResignationRequest', resignationRequestSchema);
