const mongoose = require('mongoose');

const { Schema } = mongoose;

const companyLocationSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, default: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyLocation', companyLocationSchema);
