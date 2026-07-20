const mongoose = require('mongoose');

const { Schema } = mongoose;

const departmentSchema = new Schema({
  name: { type: String, required: true, trim: true },
});

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    industry: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    departments: { type: [departmentSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
