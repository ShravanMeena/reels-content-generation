const express = require("express");
const cors = require("cors");
const path = require("path");
const checkAuth = require("./middlewares/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Protected route that requires authentication
app.get("/protected", checkAuth, (req, res) => {
  res.send("You are authenticated and can access this route.");
});

app.use("/output", express.static(path.join(__dirname, "output"))); // Serve static files from the 'output' directory

// Routes
app.use("/auth", authRoutes);

app.use("/video", videoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
