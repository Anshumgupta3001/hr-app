const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', notificationController.listNotifications);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
