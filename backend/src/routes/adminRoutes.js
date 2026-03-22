const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/admins', adminController.getAdmins);
router.post('/admins', adminController.addAdmin);
router.delete('/admins/:wallet', adminController.removeAdmin);
router.get('/dashboard-stats', adminController.getDashboardStats);

module.exports = router;
