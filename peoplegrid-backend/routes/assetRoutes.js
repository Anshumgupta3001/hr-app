const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const assetController = require('../controllers/assetController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', assetController.listAssets);
router.post(
  '/',
  roleMiddleware('admin', 'hr', 'superadmin'),
  assetController.createAsset
);
router.post(
  '/:id/assign',
  roleMiddleware('admin', 'hr', 'superadmin'),
  assetController.assignAsset
);
router.post(
  '/:id/return',
  roleMiddleware('admin', 'hr', 'superadmin'),
  assetController.returnAsset
);
router.delete(
  '/:id',
  roleMiddleware('admin', 'hr', 'superadmin'),
  assetController.deleteAsset
);

module.exports = router;
