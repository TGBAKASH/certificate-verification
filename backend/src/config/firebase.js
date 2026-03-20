const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

try {
  let credential;
  
  // 1. Try environment variables first (for Render/Production)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Render might escape newlines, so we replace them
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } 
  // 2. Fallback to local file
  else {
    const keyPath = path.join(__dirname, '../../serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      const serviceAccount = require(keyPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
      throw new Error("No Firebase credentials found in environment or serviceAccountKey.json");
    }
  }

  admin.initializeApp({ credential });
  console.log("Firebase Admin Initialized Successfully");
} catch (error) {
  console.error("Firebase Admin Error:", error.message);
}

module.exports = admin;
