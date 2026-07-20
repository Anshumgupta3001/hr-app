const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'ReviewCycle', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    selfRating: { type: Number, default: null },
    selfComments: { type: String, default: '' },
    managerRating: { type: Number, default: null },
    managerComments: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending_self', 'pending_manager', 'completed'],
      default: 'pending_self',
    },
  },
  { timestamps: true }
);

reviewSchema.index({ cycleId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
