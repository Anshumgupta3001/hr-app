const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const companyController = require('../controllers/companyController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('superadmin'), companyController.listCompanies);
router.post('/', roleMiddleware('superadmin'), companyController.createCompany);
// Members of the company may read it; admins may update their own company's
// name/industry/departments (Company Settings) — enforced in the controller.
router.get('/:id', companyController.getCompany);
router.patch('/:id', companyController.updateCompany);
router.patch('/:id/departments', companyController.updateDepartments);
router.delete('/:id', roleMiddleware('superadmin'), companyController.deleteCompany);

module.exports = router;
