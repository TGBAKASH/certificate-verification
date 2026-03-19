require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const certRoutes = require('./routes/certRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', certRoutes);

// Serve Next.js frontend statically
app.use(express.static(path.join(__dirname, '../../frontend/out')));

// Catch-all route to serve React app
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API Route Not Found' });
  }
  res.sendFile(path.join(__dirname, '../../frontend/out/index.html'));
});
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certificate_verification', {
  // options not needed in Mongoose 6+
}).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => console.error('Error connecting to MongoDB:', err));
