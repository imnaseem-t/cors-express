// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const https = require("https");
const fs = require("fs");


const options = {
  key: fs.readFileSync("./ssl/server.key"),
  cert: fs.readFileSync("./ssl/server.cert"),
};

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// GET proxy endpoint
app.get('/get', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Forward all headers from the original request (except host)
    const headers = { ...req.headers };
    console.log(process.env.ISCRAPPER_KEY);
    if(url.indexOf('api.brightdata.com') > -1) {
      headers['Authorization'] = `Bearer ${process.env.BRIGHTDATA_API_KEY}`;
    } else if(url.indexOf('api.proapis.com') > -1 ) {
      headers['X-Api-Key'] = `${process.env.ISCRAPPER_KEY}`;
    }
    delete headers.host;
    delete headers.origin;
    delete headers.referer;

    const response = await axios.get(url, {
      headers,
      timeout: 30000, // 30 second timeout
      validateStatus: () => true // Accept all status codes
    });

    // Forward the response status and headers
    res.status(response.status);
    
    // Copy relevant headers from the target response
    const headersToForward = ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified'];
    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.set(header, response.headers[header]);
      }
    });

    // Send the response data
    res.send(response.data);
  } catch (error) {
    console.error('GET proxy error:', error.message);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
});

// POST proxy endpoint
app.post('/post', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Forward all headers from the original request (except host)
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    if(url.indexOf('api.brightdata.com') > -1) {
      headers['Authorization'] = `Bearer ${process.env.BRIGHTDATA_API_KEY}`;
    } else if(url.indexOf('api.proapis.com') > -1 ) {
      headers['X-Api-Key'] = `${process.env.ISCRAPPER_KEY}`;
    }

    const response = await axios.post(url, req.body, {
      headers,
      timeout: 30000, // 30 second timeout
      validateStatus: () => true // Accept all status codes
    });

    // Forward the response status and headers
    res.status(response.status);
    
    // Copy relevant headers from the target response
    const headersToForward = ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified'];
    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.set(header, response.headers[header]);
      }
    });

    // Send the response data
    res.send(response.data);
  } catch (error) {
    console.error('POST proxy error:', error.message);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CORS proxy server is running' });
});

// Start the server
/*
app.listen(PORT, () => {
  console.log(`🚀 CORS proxy server running on http://localhost:${PORT}`);
  console.log(`📡 GET proxy: http://localhost:${PORT}/get?url=<target_url>`);
  console.log(`📡 POST proxy: http://localhost:${PORT}/post?url=<target_url>`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
*/


https.createServer(options, app).listen(3002, "0.0.0.0", () => {
  console.log("HTTPS server running on port 3002");
  console.log(`🚀 CORS proxy server running on http://localhost:${PORT}`);
  console.log(`📡 GET proxy: http://localhost:${PORT}/get?url=<target_url>`);
  console.log(`📡 POST proxy: http://localhost:${PORT}/post?url=<target_url>`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
