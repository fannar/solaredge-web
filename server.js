'use strict';

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from /public
app.use(express.static(path.join(__dirname, 'public')));

const SOURCE_URL = process.env.SOLAREDGE_URL || 'http://0.0.0.0:8080/api/v1/solaredge';

app.get('/api', async (req, res) => {
  try {
    const upstreamRes = await axios.get(SOURCE_URL, { timeout: 10000 });
    res.status(upstreamRes.status).json(upstreamRes.data);
  } catch (error) {
    const status = (error.response && error.response.status) ? error.response.status : 502;
    res.status(status).json({ success: false, error: 'Failed to fetch upstream', detail: error.message });
  }
});

// Serve index.html (placed before legacy inline route)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


