const mongoose = require('mongoose');

const { Schema } = mongoose;

const praiseSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    fromEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    toEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    message: { type: String, required: true, maxlength: 200 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Praise', praiseSchema);
