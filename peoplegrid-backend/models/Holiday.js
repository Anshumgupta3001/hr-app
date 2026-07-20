const mongoose = require('mongoose');

const { Schema } = mongoose;

const holidaySchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Holiday', holidaySchema);
