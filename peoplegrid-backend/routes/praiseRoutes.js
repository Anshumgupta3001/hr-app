const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const praiseController = require('../controllers/praiseController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', praiseController.listPraises);
router.post('/', praiseController.createPraise);

module.exports = router;
