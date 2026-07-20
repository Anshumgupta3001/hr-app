const mongoose = require('mongoose');

const { Schema } = mongoose;

const leaveUsageSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveTypeId: { type: Schema.Types.ObjectId, required: true },
    usedDays: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

leaveUsageSchema.index({ employeeId: 1, leaveTypeId: 1 }, { unique: true });

module.exports = mongoose.model('LeaveUsage', leaveUsageSchema);
