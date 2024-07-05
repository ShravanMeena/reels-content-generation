const fs = require("fs");
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

// Middleware to check authentication
const checkAuth = async (req, res, next) => {
  try {
    const tokens = JSON.parse(fs.readFileSync("tokens.json"));
    oauth2Client.setCredentials(tokens);

    // Verify token
    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);
    if (tokenInfo) {
      next(); // Token is valid, proceed to the next middleware/route handler
    } else {
      res.redirect("/auth"); // Redirect to the auth flow if token is not valid
    }
  } catch (error) {
    res.redirect("/auth"); // Redirect to the auth flow if token is not available or an error occurs
  }
};

module.exports = checkAuth;
