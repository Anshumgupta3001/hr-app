const mongoose = require('mongoose');

const { Schema } = mongoose;

const shiftPolicySchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
    expectedWorkHours: { type: Number, default: 8 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShiftPolicy', shiftPolicySchema);
