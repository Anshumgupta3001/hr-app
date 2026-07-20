const mongoose = require('mongoose');

const { Schema } = mongoose;

const leaveTypeSchema = new Schema({
  name: { type: String, required: true, trim: true },
  annualQuota: { type: Number, required: true, min: 0 },
});

const companyLeavePolicySchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
    },
    leaveTypes: { type: [leaveTypeSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyLeavePolicy', companyLeavePolicySchema);
