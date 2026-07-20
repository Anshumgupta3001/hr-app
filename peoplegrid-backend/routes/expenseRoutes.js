const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', expenseController.listClaims);
router.post('/', expenseController.createClaim);
router.post(
  '/:id/approve',
  roleMiddleware('admin', 'superadmin'),
  expenseController.approveClaim
);
router.post(
  '/:id/deny',
  roleMiddleware('admin', 'superadmin'),
  expenseController.denyClaim
);

module.exports = router;
