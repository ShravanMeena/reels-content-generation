const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL // Make sure this matches the .env and Google Cloud Console
);

// Endpoint to initiate OAuth 2.0 flow
router.get('/', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/youtube.upload'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    redirect_uri: process.env.REDIRECT_URL // Explicitly set the redirect_uri here
  });
  res.redirect(url);
});

// Endpoint to handle OAuth 2.0 callback
router.get('/oauth2callback', (req, res) => {
  const code = req.query.code;
  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      return res.status(400).send('Error retrieving access token');
    }
    oauth2Client.setCredentials(tokens);
    // Save the tokens to use for uploading videos
    fs.writeFileSync('tokens.json', JSON.stringify(tokens));
    res.send('Authentication successful! You can close this window.');
  });
});

module.exports = router;
