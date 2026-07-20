const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const performanceController = require('../controllers/performanceController');

// /api/review-cycles — admin manages, company members read (their screens
// need the active cycle to show goals/reviews).
const cycleRouter = express.Router();
cycleRouter.use(authMiddleware);
cycleRouter.get('/', performanceController.listCycles);
cycleRouter.post('/', roleMiddleware('admin', 'superadmin'), performanceController.createCycle);
cycleRouter.patch('/:id', roleMiddleware('admin', 'superadmin'), performanceController.updateCycle);

// /api/goals — employees manage their own.
const goalRouter = express.Router();
goalRouter.use(authMiddleware);
goalRouter.get('/', performanceController.listGoals);
goalRouter.post('/', performanceController.createGoal);
goalRouter.patch('/:id', performanceController.updateGoal);

// /api/reviews — self-review by the employee, manager-review by their manager.
const reviewRouter = express.Router();
reviewRouter.use(authMiddleware);
reviewRouter.get('/', performanceController.listReviews);
reviewRouter.post('/get-or-create', performanceController.getOrCreateReview);
reviewRouter.patch('/:id/self', performanceController.submitSelfReview);
reviewRouter.patch('/:id/manager', performanceController.submitManagerReview);

module.exports = { cycleRouter, goalRouter, reviewRouter };
