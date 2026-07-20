const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    audience: { type: String, enum: ['admin', 'employee'], required: true },
    targetEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    type: { type: String, required: true },
    message: { type: String, required: true },
    relatedLeaveRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveRequest',
      default: null,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
