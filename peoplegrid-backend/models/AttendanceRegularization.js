const mongoose = require('mongoose');

const { Schema } = mongoose;

const attendanceRegularizationSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    requestedClockInTime: { type: Date, default: null },
    requestedClockOutTime: { type: Date, default: null },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
    submittedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date, default: null },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceRegularization', attendanceRegularizationSchema);
