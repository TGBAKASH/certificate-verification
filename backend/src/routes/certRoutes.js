const express = require('express');
const router = express.Router();
const certController = require('../controllers/certController');
const multer = require('multer');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Routes
router.post('/upload', upload.single('document'), certController.uploadAndHash);
router.post('/issue-certificate', certController.issueCertificate);
router.get('/certificate/:id', certController.getCertificate);
router.post('/verify', upload.single('document'), certController.verifyCertificate);

module.exports = router;
