const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const leaveController = require('../controllers/leaveController');

// /api/leave-policy
const leavePolicyRouter = express.Router();
leavePolicyRouter.use(authMiddleware);
leavePolicyRouter.get('/global', roleMiddleware('superadmin'), leaveController.getGlobalPolicy);
leavePolicyRouter.patch('/global', roleMiddleware('superadmin'), leaveController.updateGlobalPolicy);
leavePolicyRouter.get('/company/:companyId', leaveController.getCompanyPolicy);
leavePolicyRouter.patch(
  '/company/:companyId',
  roleMiddleware('admin', 'superadmin'),
  leaveController.updateCompanyPolicy
);

// /api/leave-requests
const leaveRequestRouter = express.Router();
leaveRequestRouter.use(authMiddleware);
leaveRequestRouter.get('/', leaveController.listRequests);
leaveRequestRouter.get('/:id', leaveController.getRequest);
leaveRequestRouter.post('/', leaveController.createRequest);
leaveRequestRouter.post(
  '/:id/approve',
  roleMiddleware('admin', 'superadmin'),
  leaveController.approveRequest
);
leaveRequestRouter.post(
  '/:id/deny',
  roleMiddleware('admin', 'superadmin'),
  leaveController.denyRequest
);

// /api/leave-usage (read-only)
const leaveUsageRouter = express.Router();
leaveUsageRouter.use(authMiddleware);
leaveUsageRouter.get('/', leaveController.listUsage);

module.exports = { leavePolicyRouter, leaveRequestRouter, leaveUsageRouter };
