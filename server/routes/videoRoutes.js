const express = require("express");
const { uploadVideo, generateVideo } = require("../controllers/videoController");

const router = express.Router();

router.post('/upload', uploadVideo);
router.post('/generate', generateVideo);

module.exports = router;
