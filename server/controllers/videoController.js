const path = require("path");
const fs = require("fs");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const { google } = require("googleapis");

const generateText = require("../helpers/generateText");
const generateImages = require("../helpers/generateImages");
const createAudioFileFromText = require("../helpers/createAudioFile");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

exports.uploadVideo = async (req, res) => {
  const tokens = JSON.parse(fs.readFileSync('tokens.json'));
  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const videoPath = req.body.videoPath; // Get video path from request body

  console.log(req.body);
  youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: req.body.title,
        description: req.body.description,
        tags: req.body.tags?.slice,
        categoryId: '22', // Category ID for 'People & Blogs'
      },
      status: {
        privacyStatus: 'private', // Set to private for testing
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  }, (err, data) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.send('Video uploaded successfully');
  });
};

// exports.generateVideo = async (req, res) => {
//   try {

//     const text = await generateText();
//     const { title, description, tags, story } = text;

//     const audioPath = await createAudioFileFromText(story);

//     ffmpeg.ffprobe(audioPath, async (err, metadata) => {
//       if (err) {
//         console.error("Error getting audio duration:", err);
//         return res.status(500).send("Error generating video");
//       }

//       const audioDuration = metadata.format.duration;
//       const imageDuration = 5; // Each image will be displayed for 5 seconds
//       const numImages = Math.ceil(audioDuration / imageDuration);

//       const images = await generateImages(story, numImages);

//       const imagePaths = [];

//       for (let i = 0; i < images.length; i++) {
//         const imagePath = path.join(__dirname, "../images", `image${i + 1}.png`);
//         const response = await axios.get(images[i], {
//           responseType: "arraybuffer",
//         });
//         fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));
//         imagePaths.push(imagePath);
//       }

//       const outputDir = path.join(__dirname, "../output");
//       if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir);
//       }

//       const outputVideoPath = path.join(outputDir, "video.mp4");

//       const inputFilePath = path.join(outputDir, "input.txt");
//       let inputFileContent = "";

//       for (let i = 0; i < Math.ceil(audioDuration / imageDuration); i++) {
//         imagePaths.forEach((imagePath) => {
//           inputFileContent += `file '${imagePath}'\nduration ${imageDuration}\n`;
//         });
//       }

//       fs.writeFileSync(inputFilePath, inputFileContent);

//       ffmpeg()
//         .input(inputFilePath)
//         .inputFormat("concat")
//         .inputOption("-safe 0")
//         .input(audioPath)
//         .videoCodec("libx264")
//         .audioCodec("aac")
//         .outputOptions(["-pix_fmt yuv420p", `-t ${audioDuration}`, "-shortest"])
//         .on("end", () => {
//           res.json({
//             message: 'Video generated successfully',
//             videoPath: outputVideoPath,
//             title,
//             description,
//             tags
//           });
//         })
//         .on("error", (err) => {
//           console.error("Error:", err);
//           res.status(500).send("Error generating video");
//         })
//         .save(outputVideoPath);
//     });
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).send("Error generating video");
//   }
// };

exports.generateVideo = async (req, res) => {
  try {
    const { title, description, tags, story } = await generateText();

    const audioPath = await createAudioFileFromText(story);

    ffmpeg.ffprobe(audioPath, async (err, metadata) => {
      if (err) {
        console.error("Error getting audio duration:", err);
        return res.status(500).send("Error generating video");
      }

      const audioDuration = metadata.format.duration;
      const imageDuration = 5; // Each image will be displayed for 5 seconds
      const numImages = Math.ceil(audioDuration / imageDuration);

      const images = await generateImages(story, numImages);

      const imagePaths = [];

      for (let i = 0; i < images.length; i++) {
        const imagePath = path.join(__dirname, "../images", `image${i + 1}.png`);
        const response = await axios.get(images[i], {
          responseType: "arraybuffer",
        });
        fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));
        imagePaths.push(imagePath);
      }

      const outputDir = path.join(__dirname, "../output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      const outputVideoPath = path.join(outputDir, "video.mp4");

      const inputFilePath = path.join(outputDir, "input.txt");
      let inputFileContent = "";

      for (let i = 0; i < Math.ceil(audioDuration / imageDuration); i++) {
        imagePaths.forEach((imagePath) => {
          inputFileContent += `file '${imagePath}'\nduration ${imageDuration}\n`;
        });
      }

      fs.writeFileSync(inputFilePath, inputFileContent);

      ffmpeg()
        .input(inputFilePath)
        .inputFormat("concat")
        .inputOption("-safe 0")
        .input(audioPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-pix_fmt yuv420p", `-t ${audioDuration}`, "-shortest"])
        .on("end", () => {
          res.json({
            message: 'Video generated successfully',
            videoPath: `/output/video.mp4`, // Change this to a relative path
            title,
            description,
            tags
          });
        })
        .on("error", (err) => {
          console.error("Error:", err);
          res.status(500).send("Error generating video");
        })
        .save(outputVideoPath);
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error generating video");
  }
};


