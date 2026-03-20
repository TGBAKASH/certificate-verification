const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  enrollmentId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
