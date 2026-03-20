const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route to register a student in MongoDB after Firebase auth
router.post('/register', authController.registerStudent);

// Protected route to fetch the student's dashboard (certificates)
router.get('/dashboard', authController.getStudentDashboard);

module.exports = router;
