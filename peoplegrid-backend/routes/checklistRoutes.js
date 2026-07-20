const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const checklistController = require('../controllers/checklistController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'hr', 'superadmin'));

router.get('/', checklistController.listTasks);
router.post('/', checklistController.createTask);
router.patch('/:id', checklistController.updateTask);
router.delete('/:id', checklistController.deleteTask);

module.exports = router;
