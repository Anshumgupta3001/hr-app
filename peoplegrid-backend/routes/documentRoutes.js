const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.use(authMiddleware);

// Presigned-URL actions (Part 14, unchanged)
router.post('/upload-url', documentController.uploadUrl);
router.get('/download-url', documentController.downloadUrl);
router.delete('/', documentController.deleteByKey);

// Metadata CRUD (now persisted in Mongo)
router.get('/', documentController.listDocuments);
router.post('/', documentController.createDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
