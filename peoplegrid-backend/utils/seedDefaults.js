const bcrypt = require('bcrypt');
const Employee = require('../models/Employee');
const GlobalLeavePolicy = require('../models/GlobalLeavePolicy');

const SALT_ROUNDS = 10;

async function seedDefaults() {
  const superAdmin = await Employee.findOne({ role: 'superadmin' });
  if (!superAdmin) {
    await Employee.create({
      companyId: null,
      name: 'Anshum',
      email: 'anshum@twisty.design',
      password: await bcrypt.hash('Omsairam@3001', SALT_ROUNDS),
      role: 'superadmin',
      designation: 'Super Admin',
    });
    console.log('Seeded Super Admin account.');
  }

  const globalPolicy = await GlobalLeavePolicy.findOne();
  if (!globalPolicy) {
    await GlobalLeavePolicy.create({
      leaveTypes: [
        { name: 'Sick Leave', annualQuota: 12 },
        { name: 'Casual Leave', annualQuota: 12 },
        { name: 'Earned Leave', annualQuota: 15 },
      ],
    });
    console.log('Seeded global leave policy.');
  }
}

module.exports = seedDefaults;
