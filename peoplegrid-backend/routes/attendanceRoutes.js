const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

router.use(authMiddleware);

// Locations
router.get('/locations', attendanceController.listLocations);
router.post('/locations', roleMiddleware('admin'), attendanceController.addLocation);
router.delete('/locations/:id', roleMiddleware('admin'), attendanceController.removeLocation);

// Shift policy
router.get('/shift-policy', attendanceController.getShiftPolicy);
router.put('/shift-policy', roleMiddleware('admin'), attendanceController.updateShiftPolicy);

// Clock in / out
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);

// Reading attendance
router.get('/me', attendanceController.listMine);
router.get('/team', roleMiddleware('admin', 'hr'), attendanceController.teamForDate);
router.get('/summary', attendanceController.getSummary);
router.get('/currently-in', roleMiddleware('admin', 'hr'), attendanceController.currentlyIn);

// Regularizations
router.post('/regularizations', attendanceController.createRegularization);
router.get('/regularizations', attendanceController.listRegularizations);
router.post(
  '/regularizations/:id/approve',
  roleMiddleware('admin'),
  attendanceController.approveRegularization
);
router.post(
  '/regularizations/:id/deny',
  roleMiddleware('admin'),
  attendanceController.denyRegularization
);

// Exemptions
router.post('/exemptions', roleMiddleware('admin'), attendanceController.createExemption);
router.delete('/exemptions/:id', roleMiddleware('admin'), attendanceController.removeExemption);
router.get('/exemptions', roleMiddleware('admin'), attendanceController.listExemptions);

module.exports = router;
