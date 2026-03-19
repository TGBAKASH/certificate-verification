const express = require('express');
const path = require('path');
const http = require('http');

const app = express();

app.use((req, res, next) => {
  console.log("Original URL:", req.url, "Path:", req.path);
  if (req.method === 'GET' && req.path.length > 1 && req.path.endsWith('/')) {
    req.url = req.url.slice(0, req.path.length - 1) + req.url.slice(req.path.length);
    console.log("Rewritten URL:", req.url);
  }
  next();
});

app.use(express.static(path.join(__dirname, '../frontend/out'), { 
  extensions: ['html'],
  redirect: false
}));

app.use((req, res) => {
  res.status(404).send('404 NOT FOUND: ' + req.url);
});

const server = app.listen(5005, () => {
  console.log('Listening on 5005');
  http.get('http://localhost:5005/admin/dashboard/', (res) => {
    console.log('Status code for /admin/dashboard/:', res.statusCode);
    res.resume();
    http.get('http://localhost:5005/admin/dashboard', (res2) => {
      console.log('Status code for /admin/dashboard:', res2.statusCode);
      res2.resume();
      server.close();
      process.exit(0);
    });
  });
});
