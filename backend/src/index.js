require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const certRoutes = require('./routes/certRoutes');
const authRoutes = require('./routes/authRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', certRoutes);
app.use('/api/auth', authRoutes);

const fs = require('fs');

// Explicitly serve Next.js HTML files to bypass express.static directory conflicts
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    let reqPath = req.path;
    if (reqPath.length > 1 && reqPath.endsWith('/')) {
      reqPath = reqPath.slice(0, -1);
    }
    
    const htmlPath = path.join(__dirname, '../../frontend/out', reqPath + '.html');
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }
  }
  next();
});

// Serve Next.js frontend static assets
app.use(express.static(path.join(__dirname, '../../frontend/out')));

// Catch-all route to serve 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API Route Not Found' });
  }
  res.status(404).sendFile(path.join(__dirname, '../../frontend/out/404.html'));
});
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certificate_verification', {
  // options not needed in Mongoose 6+
}).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => console.error('Error connecting to MongoDB:', err));
