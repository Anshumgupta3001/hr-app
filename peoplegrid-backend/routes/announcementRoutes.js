const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const announcementController = require('../controllers/announcementController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', announcementController.listAnnouncements);
router.post('/', roleMiddleware('admin'), announcementController.createAnnouncement);

module.exports = router;
