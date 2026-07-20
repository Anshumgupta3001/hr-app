const mongoose = require('mongoose');

const { Schema } = mongoose;

const employeeSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'hr', 'manager', 'employee'],
      required: true,
    },
    departmentId: { type: Schema.Types.ObjectId, default: null },
    designation: { type: String, default: '' },
    status: { type: String, default: 'active' },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    probationEndDate: { type: String, default: null },
    employmentStatus: {
      type: String,
      enum: ['active', 'on_notice', 'exited'],
      default: 'active',
    },
    dateOfBirth: { type: String, default: null },
    dateOfJoining: { type: String, default: null },
    previousCompanyName: { type: String, default: '' },
    totalExperienceYears: { type: Number, default: null },
    previousRoleNotes: { type: String, default: '' },
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
    },
    aadharNumber: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    passportNumber: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        // Never expose the bcrypt hash. The constant placeholder keeps the
        // edit form's "password present" expectation satisfied; the service
        // layer strips it back out before any update call.
        ret.password = '********';
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Employee', employeeSchema);
