const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const employeeController = require('../controllers/employeeController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployee);
router.post(
  '/',
  roleMiddleware('admin', 'hr', 'superadmin'),
  employeeController.createEmployee
);
// Self-updates (My Profile) are allowed; management-only fields are guarded
// inside the controller.
router.patch('/:id', employeeController.updateEmployee);
router.delete(
  '/:id',
  roleMiddleware('admin', 'hr', 'superadmin'),
  employeeController.deleteEmployee
);
router.post(
  '/:id/mark-exited',
  roleMiddleware('admin', 'superadmin'),
  employeeController.markExited
);

module.exports = router;
