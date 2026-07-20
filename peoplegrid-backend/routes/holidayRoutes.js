const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const holidayController = require('../controllers/holidayController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', holidayController.listHolidays);
router.post('/', roleMiddleware('admin', 'superadmin'), holidayController.createHoliday);
router.delete('/:id', roleMiddleware('admin', 'superadmin'), holidayController.deleteHoliday);

module.exports = router;
