const mongoose = require('mongoose');

const { Schema } = mongoose;

const expenseClaimSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    dateIncurred: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
    decidedAt: { type: Date, default: null },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

// The frontends have always sorted/displayed on `submittedAt`.
expenseClaimSchema.virtual('submittedAt').get(function () {
  return this.createdAt;
});

module.exports = mongoose.model('ExpenseClaim', expenseClaimSchema);
