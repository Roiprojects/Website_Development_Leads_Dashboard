const express = require('express');
const app = express();

try {
  const backendApp = require('../backend/src/index').default || require('../backend/src/index');
  app.use(backendApp);
} catch (error) {
  // If backend crashes, mount a fallback route that returns the raw error
  app.use((req, res) => {
    res.status(200).json({ 
      crashed: true, 
      name: error.name, 
      message: error.message, 
      stack: error.stack 
    });
  });
}

module.exports = app;
