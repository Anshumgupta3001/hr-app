const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const resignationController = require('../controllers/resignationController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', resignationController.listResignations);
router.post('/', resignationController.createResignation);
router.post(
  '/:id/acknowledge',
  roleMiddleware('admin', 'superadmin'),
  resignationController.acknowledgeResignation
);

module.exports = router;
