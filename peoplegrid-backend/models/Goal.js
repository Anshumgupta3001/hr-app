const mongoose = require('mongoose');

const { Schema } = mongoose;

const goalSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'ReviewCycle', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
