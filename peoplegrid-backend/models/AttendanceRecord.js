const mongoose = require('mongoose');

const { Schema } = mongoose;

const geoPointSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const attendanceRecordSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    clockInTime: { type: Date, default: null },
    clockInLocation: { type: geoPointSchema, default: null },
    clockInDistanceMeters: { type: Number, default: null },
    clockOutTime: { type: Date, default: null },
    clockOutLocation: { type: geoPointSchema, default: null },
    clockOutDistanceMeters: { type: Number, default: null },
    matchedLocationId: { type: Schema.Types.ObjectId, ref: 'CompanyLocation', default: null },
    totalHours: { type: Number, default: null },
    status: {
      type: String,
      enum: ['present', 'early_leave', 'incomplete', 'absent'],
      default: 'incomplete',
    },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
