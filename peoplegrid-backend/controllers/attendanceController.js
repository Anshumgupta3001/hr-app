const CompanyLocation = require('../models/CompanyLocation');
const ShiftPolicy = require('../models/ShiftPolicy');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceRegularization = require('../models/AttendanceRegularization');
const AttendanceExemption = require('../models/AttendanceExemption');
const Employee = require('../models/Employee');
const Holiday = require('../models/Holiday');
const LeaveRequest = require('../models/LeaveRequest');
const { haversineDistanceMeters } = require('../utils/haversine');
const { wrap, httpError, sameId } = require('../utils/controllerHelpers');

function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWeekendDate(dateStr) {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// A record with a clock-in but no clock-out reads as "incomplete" once its
// day has passed — while the day is still in progress it keeps whatever
// status was last stored (set to "incomplete" at clock-in as a placeholder).
function deriveStatus(record, todayStr) {
  if (record.clockInTime && !record.clockOutTime && record.date < todayStr) {
    return 'incomplete';
  }
  return record.status;
}

async function getOrCreateShiftPolicy(companyId) {
  let policy = await ShiftPolicy.findOne({ companyId });
  if (!policy) {
    policy = await ShiftPolicy.create({ companyId });
  }
  return policy;
}

async function nearestLocationMatch(companyId, latitude, longitude) {
  const locations = await CompanyLocation.find({ companyId });
  if (locations.length === 0) {
    throw httpError(400, 'No company locations configured. Contact your admin.');
  }
  let nearest = null;
  for (const loc of locations) {
    const distance = haversineDistanceMeters(
      Number(latitude),
      Number(longitude),
      loc.latitude,
      loc.longitude
    );
    if (nearest === null || distance < nearest.distance) {
      nearest = { distance, location: loc };
    }
    if (distance <= loc.radiusMeters) {
      return { matched: loc, distanceMeters: Math.round(distance) };
    }
  }
  throw httpError(
    400,
    `You're ${Math.round(nearest.distance)}m from the nearest office — clock-in requires being within ${nearest.location.radiusMeters}m.`
  );
}

// --- Locations ---

const addLocation = wrap(async (req, res) => {
  const { name, latitude, longitude, radiusMeters } = req.body || {};
  if (!name || latitude == null || longitude == null) {
    throw httpError(400, 'name, latitude, and longitude are required.');
  }
  const companyId = req.auth.companyId;
  if (!companyId) throw httpError(400, 'Only company admins can add locations.');

  const location = await CompanyLocation.create({
    companyId,
    name: name.trim(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    radiusMeters: radiusMeters != null ? Number(radiusMeters) : 500,
  });
  res.status(201).json(location);
});

const removeLocation = wrap(async (req, res) => {
  const location = await CompanyLocation.findById(req.params.id);
  if (!location) throw httpError(404, 'Location not found.');
  if (!sameId(location.companyId, req.auth.companyId)) {
    throw httpError(403, 'You do not have permission to remove this location.');
  }
  await CompanyLocation.deleteOne({ _id: location._id });
  res.json({ ok: true });
});

const listLocations = wrap(async (req, res) => {
  const companyId = req.auth.companyId;
  if (!companyId) return res.json([]);
  res.json(await CompanyLocation.find({ companyId }).sort({ createdAt: 1 }));
});

// --- Shift policy ---

const getShiftPolicy = wrap(async (req, res) => {
  const companyId = req.auth.companyId;
  if (!companyId) return res.json(null);
  res.json(await getOrCreateShiftPolicy(companyId));
});

const updateShiftPolicy = wrap(async (req, res) => {
  const companyId = req.auth.companyId;
  if (!companyId) throw httpError(400, 'Only company admins can update the shift policy.');
  const policy = await getOrCreateShiftPolicy(companyId);
  const { expectedWorkHours } = req.body || {};

  if (expectedWorkHours != null) policy.expectedWorkHours = Number(expectedWorkHours);

  await policy.save();
  res.json(policy);
});

// --- Clock in / out ---

const clockIn = wrap(async (req, res) => {
  const { latitude, longitude } = req.body || {};
  if (latitude == null || longitude == null) {
    throw httpError(400, 'latitude and longitude are required.');
  }
  const companyId = req.auth.companyId;
  const employeeId = req.auth.employeeId;
  if (!companyId) throw httpError(400, 'Only company employees can clock in.');

  const date = todayDateString();
  let record = await AttendanceRecord.findOne({ employeeId, date });
  if (record && record.clockInTime) {
    throw httpError(400, 'You have already clocked in today.');
  }

  const exemption = await AttendanceExemption.findOne({ employeeId, date });

  let matchedLocationId = null;
  let distanceMeters = null;
  if (!exemption) {
    const { matched, distanceMeters: dist } = await nearestLocationMatch(
      companyId,
      latitude,
      longitude
    );
    matchedLocationId = matched._id;
    distanceMeters = dist;
  }

  const now = new Date();
  const clockInLocation = { latitude: Number(latitude), longitude: Number(longitude) };

  if (record) {
    record.clockInTime = now;
    record.clockInLocation = clockInLocation;
    record.clockInDistanceMeters = distanceMeters;
    record.matchedLocationId = matchedLocationId;
    record.status = 'incomplete';
    await record.save();
  } else {
    record = await AttendanceRecord.create({
      companyId,
      employeeId,
      date,
      clockInTime: now,
      clockInLocation,
      clockInDistanceMeters: distanceMeters,
      matchedLocationId,
      status: 'incomplete',
    });
  }

  res.status(201).json(record);
});

const clockOut = wrap(async (req, res) => {
  const { latitude, longitude } = req.body || {};
  if (latitude == null || longitude == null) {
    throw httpError(400, 'latitude and longitude are required.');
  }
  const companyId = req.auth.companyId;
  const employeeId = req.auth.employeeId;
  if (!companyId) throw httpError(400, 'Only company employees can clock out.');

  const policy = await getOrCreateShiftPolicy(companyId);
  const date = todayDateString();

  const record = await AttendanceRecord.findOne({
    employeeId,
    clockInTime: { $ne: null },
    clockOutTime: null,
  }).sort({ date: -1 });

  if (!record) {
    throw httpError(400, 'You must clock in before you can clock out.');
  }
  if (record.date !== date) {
    record.status = 'incomplete';
    await record.save();
    throw httpError(
      400,
      "That clock-in was for a previous day and can no longer be clocked out — it's been marked incomplete. Request a correction if needed."
    );
  }

  const exemption = await AttendanceExemption.findOne({ employeeId, date });

  let distanceMeters = null;
  if (!exemption) {
    const { distanceMeters: dist } = await nearestLocationMatch(companyId, latitude, longitude);
    distanceMeters = dist;
  }

  const now = new Date();
  record.clockOutTime = now;
  record.clockOutLocation = { latitude: Number(latitude), longitude: Number(longitude) };
  record.clockOutDistanceMeters = distanceMeters;
  record.totalHours = (now - record.clockInTime) / 3600000;
  record.status = record.totalHours >= policy.expectedWorkHours ? 'present' : 'early_leave';
  await record.save();

  res.json(record);
});

async function computeMissingWorkingDates(companyId, employeeId, startDate, endDate) {
  const holidays = await Holiday.find({ companyId, date: { $gte: startDate, $lte: endDate } });
  const holidaySet = new Set(holidays.map((h) => h.date));

  const leaves = await LeaveRequest.find({
    employeeId,
    status: 'approved',
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });
  const leaveDateSet = new Set();
  for (const leave of leaves) {
    const cursor = new Date(`${leave.startDate}T00:00:00`);
    const end = new Date(`${leave.endDate}T00:00:00`);
    while (cursor <= end) {
      const ds = cursor.toISOString().slice(0, 10);
      if (ds >= startDate && ds <= endDate) leaveDateSet.add(ds);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const records = await AttendanceRecord.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate },
  });
  const recordedDates = new Set(records.map((r) => r.date));

  const missing = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) {
    const ds = cursor.toISOString().slice(0, 10);
    if (
      !isWeekendDate(ds) &&
      !holidaySet.has(ds) &&
      !leaveDateSet.has(ds) &&
      !recordedDates.has(ds)
    ) {
      missing.push(ds);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return missing;
}

// --- Reading attendance ---

const listMine = wrap(async (req, res) => {
  const employeeId = req.auth.employeeId;
  const companyId = req.auth.companyId;
  const today = todayDateString();
  const records = await AttendanceRecord.find({ employeeId }).sort({ date: -1 });

  let computedAbsent = [];
  if (companyId) {
    const monthStart = `${today.slice(0, 7)}-01`;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (yesterdayStr >= monthStart) {
      const missingDates = await computeMissingWorkingDates(
        companyId,
        employeeId,
        monthStart,
        yesterdayStr
      );
      computedAbsent = missingDates.map((date) => ({
        id: `absent-${employeeId}-${date}`,
        companyId,
        employeeId,
        date,
        clockInTime: null,
        clockOutTime: null,
        totalHours: null,
        status: 'absent',
        computed: true,
      }));
    }
  }

  const merged = [
    ...records.map((r) => ({ ...r.toJSON(), status: deriveStatus(r, today) })),
    ...computedAbsent,
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(merged);
});

const teamForDate = wrap(async (req, res) => {
  const { date } = req.query;
  if (!date) throw httpError(400, 'date is required.');
  const companyId = req.auth.companyId;
  const today = todayDateString();

  const employees = await Employee.find({ companyId, employmentStatus: { $ne: 'exited' } });
  const records = await AttendanceRecord.find({ companyId, date });
  const recordByEmployee = new Map(records.map((r) => [r.employeeId.toString(), r]));

  const holiday = await Holiday.findOne({ companyId, date });
  const leaves = await LeaveRequest.find({
    companyId,
    status: 'approved',
    startDate: { $lte: date },
    endDate: { $gte: date },
  });
  const onLeave = new Set(leaves.map((l) => l.employeeId.toString()));

  const result = employees
    .map((emp) => {
      const key = emp._id.toString();
      const existing = recordByEmployee.get(key);
      if (existing) return { ...existing.toJSON(), status: deriveStatus(existing, today) };
      if (holiday || onLeave.has(key)) return null;
      return {
        id: `absent-${key}-${date}`,
        companyId,
        employeeId: emp._id,
        date,
        clockInTime: null,
        clockOutTime: null,
        totalHours: null,
        status: 'absent',
        computed: true,
      };
    })
    .filter(Boolean);

  res.json(result);
});

const getSummary = wrap(async (req, res) => {
  const { employeeId: queryEmployeeId, month } = req.query;
  if (!month) throw httpError(400, 'month is required (YYYY-MM).');

  const isStaff = ['admin', 'hr', 'superadmin'].includes(req.auth.role);
  let employeeId = req.auth.employeeId;
  if (queryEmployeeId) {
    if (!isStaff && !sameId(queryEmployeeId, req.auth.employeeId)) {
      throw httpError(403, 'You can only view your own attendance summary.');
    }
    employeeId = queryEmployeeId;
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) throw httpError(404, 'Employee not found.');
  if (req.auth.role !== 'superadmin' && !sameId(req.auth.companyId, employee.companyId)) {
    throw httpError(403, 'You do not have permission to view this attendance summary.');
  }
  const companyId = employee.companyId;

  const [year, monthNum] = month.split('-').map(Number);
  const totalCalendarDays = daysInMonth(year, monthNum);
  const todayStr = todayDateString();
  const isCurrentMonth = todayStr.startsWith(month);
  const lastDayToCount = isCurrentMonth ? Number(todayStr.slice(8, 10)) : totalCalendarDays;

  const holidays = await Holiday.find({
    companyId,
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
  });
  const holidaySet = new Set(holidays.map((h) => h.date));

  const leaves = await LeaveRequest.find({
    employeeId,
    status: 'approved',
    startDate: { $lte: `${month}-31` },
    endDate: { $gte: `${month}-01` },
  });
  const leaveDateSet = new Set();
  for (const leave of leaves) {
    const cursor = new Date(`${leave.startDate}T00:00:00`);
    const end = new Date(`${leave.endDate}T00:00:00`);
    while (cursor <= end) {
      const ds = cursor.toISOString().slice(0, 10);
      if (ds.startsWith(month)) leaveDateSet.add(ds);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const records = await AttendanceRecord.find({
    employeeId,
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
  });
  const recordByDate = new Map(records.map((r) => [r.date, r]));

  let weekendDays = 0;
  let holidayDays = 0;
  let leaveDays = 0;
  let workingDays = 0;
  let presentDays = 0;
  let earlyLeaveDays = 0;
  let incompleteDays = 0;
  let absentDays = 0;
  let totalHoursWorked = 0;
  const pattern = [];

  for (let day = 1; day <= totalCalendarDays; day += 1) {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    const weekend = isWeekendDate(dateStr);
    const isHoliday = holidaySet.has(dateStr);
    const isLeave = leaveDateSet.has(dateStr);

    if (weekend) {
      weekendDays += 1;
      continue;
    }
    if (isHoliday) {
      holidayDays += 1;
      continue;
    }
    if (isLeave) {
      leaveDays += 1;
      continue;
    }

    workingDays += 1;
    const record = recordByDate.get(dateStr);
    if (record) {
      const status = deriveStatus(record, todayStr);
      totalHoursWorked += record.totalHours || 0;
      if (status === 'present') presentDays += 1;
      else if (status === 'early_leave') earlyLeaveDays += 1;
      else if (status === 'incomplete') incompleteDays += 1;
      pattern.push({ date: dateStr, status });
    } else if (day <= lastDayToCount) {
      absentDays += 1;
      pattern.push({ date: dateStr, status: 'absent' });
    } else {
      pattern.push({ date: dateStr, status: 'upcoming' });
    }
  }

  const attendancePercentage =
    workingDays > 0
      ? Math.round(((workingDays - absentDays) / workingDays) * 1000) / 10
      : 0;

  res.json({
    employeeId,
    month,
    totalCalendarDays,
    weekendDays,
    holidayDays,
    leaveDays,
    workingDays,
    presentDays,
    earlyLeaveDays,
    incompleteDays,
    absentDays,
    totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
    attendancePercentage,
    pattern,
  });
});

const currentlyIn = wrap(async (req, res) => {
  const companyId = req.auth.companyId;
  const date = todayDateString();
  const records = await AttendanceRecord.find({
    companyId,
    date,
    clockInTime: { $ne: null },
    clockOutTime: null,
  }).sort({ clockInTime: -1 });
  res.json(records);
});

// --- Regularizations ---

const createRegularization = wrap(async (req, res) => {
  const { date, requestedClockInTime, requestedClockOutTime, reason } = req.body || {};
  if (!date || !reason) throw httpError(400, 'date and reason are required.');
  const companyId = req.auth.companyId;
  if (!companyId) throw httpError(400, 'Only company employees can request regularization.');

  const regularization = await AttendanceRegularization.create({
    companyId,
    employeeId: req.auth.employeeId,
    date,
    requestedClockInTime: requestedClockInTime ? new Date(requestedClockInTime) : null,
    requestedClockOutTime: requestedClockOutTime ? new Date(requestedClockOutTime) : null,
    reason: reason.trim(),
  });

  res.status(201).json(regularization);
});

const listRegularizations = wrap(async (req, res) => {
  const isStaff = ['admin', 'hr', 'superadmin'].includes(req.auth.role);
  if (!isStaff) {
    return res.json(
      await AttendanceRegularization.find({ employeeId: req.auth.employeeId }).sort({
        submittedAt: -1,
      })
    );
  }
  const companyId = req.auth.role === 'superadmin' ? req.query.companyId : req.auth.companyId;
  res.json(await AttendanceRegularization.find({ companyId }).sort({ submittedAt: -1 }));
});

async function decideRegularization(req, res, decision) {
  const regularization = await AttendanceRegularization.findById(req.params.id);
  if (!regularization) throw httpError(404, 'Regularization request not found.');
  if (req.auth.role !== 'admin' || !sameId(regularization.companyId, req.auth.companyId)) {
    throw httpError(403, 'Only an admin can decide regularization requests.');
  }
  if (regularization.status !== 'pending') {
    return res.json(regularization);
  }

  regularization.status = decision;
  regularization.decidedAt = new Date();
  regularization.decidedBy = req.auth.employeeId;
  await regularization.save();

  if (decision === 'approved') {
    const policy = await getOrCreateShiftPolicy(regularization.companyId);
    let record = await AttendanceRecord.findOne({
      employeeId: regularization.employeeId,
      date: regularization.date,
    });
    if (!record) {
      record = new AttendanceRecord({
        companyId: regularization.companyId,
        employeeId: regularization.employeeId,
        date: regularization.date,
      });
    }
    if (regularization.requestedClockInTime) {
      record.clockInTime = regularization.requestedClockInTime;
    }
    if (regularization.requestedClockOutTime) {
      record.clockOutTime = regularization.requestedClockOutTime;
    }
    if (record.clockInTime && record.clockOutTime) {
      record.totalHours = (record.clockOutTime - record.clockInTime) / 3600000;
      record.status = record.totalHours >= policy.expectedWorkHours ? 'present' : 'early_leave';
    } else {
      record.status = 'incomplete';
    }
    await record.save();
  }

  res.json(regularization);
}

const approveRegularization = wrap((req, res) => decideRegularization(req, res, 'approved'));
const denyRegularization = wrap((req, res) => decideRegularization(req, res, 'denied'));

// --- Exemptions ---

const createExemption = wrap(async (req, res) => {
  const { employeeId, date, reason } = req.body || {};
  if (!employeeId || !date) throw httpError(400, 'employeeId and date are required.');
  const companyId = req.auth.companyId;

  const exemption = await AttendanceExemption.create({
    companyId,
    employeeId,
    date,
    reason: (reason || '').trim(),
    createdBy: req.auth.employeeId,
  });
  res.status(201).json(exemption);
});

const removeExemption = wrap(async (req, res) => {
  const exemption = await AttendanceExemption.findById(req.params.id);
  if (!exemption) throw httpError(404, 'Exemption not found.');
  if (!sameId(exemption.companyId, req.auth.companyId)) {
    throw httpError(403, 'You do not have permission to remove this exemption.');
  }
  await AttendanceExemption.deleteOne({ _id: exemption._id });
  res.json({ ok: true });
});

const listExemptions = wrap(async (req, res) => {
  const companyId = req.auth.companyId;
  res.json(await AttendanceExemption.find({ companyId }).sort({ date: -1 }));
});

module.exports = {
  addLocation,
  removeLocation,
  listLocations,
  getShiftPolicy,
  updateShiftPolicy,
  clockIn,
  clockOut,
  listMine,
  teamForDate,
  getSummary,
  currentlyIn,
  createRegularization,
  listRegularizations,
  approveRegularization,
  denyRegularization,
  createExemption,
  removeExemption,
  listExemptions,
};
