const Student = require('../models/Student');
const Certificate = require('../models/Certificate');
const admin = require('../config/firebase');

exports.registerStudent = async (req, res) => {
  try {
    const { idToken, name, email, enrollmentId } = req.body;

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    if (decodedToken.email !== email) {
       return res.status(400).json({ error: "Email mismatch with Firebase token" });
    }

    // Create the student in MongoDB
    const newStudent = new Student({
      firebaseUid,
      name,
      email,
      enrollmentId
    });

    await newStudent.save();

    res.status(201).json({ message: "Student registered successfully in DB", student: newStudent });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Student with this email or enrollment ID already exists in DB" });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed or Invalid Firebase Token" });
  }
};

exports.getStudentDashboard = async (req, res) => {
  try {
    // Expecting the token in the Authorization header: `Bearer <token>`
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if the student exists in our MongoDB
    const student = await Student.findOne({ firebaseUid: decodedToken.uid });
    if (!student) {
      return res.status(404).json({ error: "Student record not found in database" });
    }

    // Fetch all certificates linked to this student's email
    const certificates = await Certificate.find({ studentEmail: student.email }).sort({ issueDate: -1 });

    res.status(200).json({
      student: { name: student.name, email: student.email, enrollmentId: student.enrollmentId },
      certificates
    });
  } catch (error) {
    console.error("Dashboard DB fetch error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
