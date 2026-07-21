const mongoose = require('mongoose');

const { Schema } = mongoose;

const attendanceExemptionSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    reason: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceExemption', attendanceExemptionSchema);
