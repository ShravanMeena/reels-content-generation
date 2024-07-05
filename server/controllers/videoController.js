const path = require("path");
const fs = require("fs");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const { google } = require("googleapis");

const generateText = require("../helpers/generateText");
const generateImgGemini = require("../helpers/generateImgGemini");
const generateImages = require("../helpers/generateImages");
const createAudioFileFromText = require("../helpers/createAudioFile");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

exports.uploadVideo = async (req, res) => {
  const tokens = JSON.parse(fs.readFileSync("tokens.json"));
  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const videoPath = path.join(__dirname, "..", req.body.videoPath); // Resolve video path

  youtube.videos.insert(
    {
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: req.body.title,
          description: req.body.description,
          tags: req.body.tags?.slice,
          categoryId: "22", // Category ID for 'People & Blogs'
        },
        status: {
          privacyStatus: "private", // Set to private for testing
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    },
    (err, data) => {
      if (err) {
        return res.status(400).send(err);
      }
      res.send({ message: "Video uploaded successfully", data });
    }
  );
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
    const { story, title, description, tags } = await generateText();

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
        const imagePath = path.join(
          __dirname,
          "../images",
          `image${i + 1}.png`
        );
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

      const ffmpegCommand = ffmpeg().input(audioPath);

      imagePaths.forEach((imagePath) => {
        ffmpegCommand.input(imagePath);
        // .inputOptions(["-loop 1", `-t ${imageDuration}`]);
      });

      const filterComplex = imagePaths.map((_, index) => {
        const zoomDirection = index % 2 === 0 ? "zoom+0.001" : "zoom-0.001";
        return `[${
          index + 1
        }:v]scale=1024:1792,setsar=1,zoompan=z='${zoomDirection}':d=${
          imageDuration * 25
        }:s=1024x1792[v${index + 1}]`;
      });

      const concatFilter =
        filterComplex.join(";") +
        `;${filterComplex
          .map((_, index) => `[v${index + 1}]`)
          .join("")}concat=n=${imagePaths.length}:v=1:a=0[vout]`;

      ffmpegCommand
        .complexFilter(concatFilter)
        .map("[vout]")
        .outputOptions([
          "-map 0:a?",
          "-c:v libx264",
          "-c:a aac",
          "-pix_fmt yuv420p",
          `-t ${audioDuration}`,
          "-shortest",
        ])
        .on("start", (commandLine) => {
          console.log("Spawned Ffmpeg with command: " + commandLine);
        })
        .on("end", () => {
          console.log("Processing finished successfully");
          res.json({
            message: "Video generated successfully",
            videoPath: `/output/video.mp4`,
            images,
            audioPath,
            title,
            description,
            tags,
            story
          });
        })
        .on("error", (err, stdout, stderr) => {
          console.error("Error during processing:", err.message);
          console.error("ffmpeg stderr:", stderr);
          res.status(500).send("Error generating video");
        })
        .save(outputVideoPath);
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error generating video");
  }
};

exports.regenerateVideo = async (req, res) => {
  try {
    const { images, audioPath, effects } = req.body;
    const outputDir = path.join(__dirname, "../output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputVideoPath = path.join(outputDir, "video.mp4");

    const ffmpegCommand = ffmpeg().input(audioPath);

    images.forEach((imagePath, index) => {
      ffmpegCommand.input(imagePath).inputOptions(["-loop 1", `-t 5`]);
    });

    const filterComplex = images.map((imagePath, index) => {
      const zoomDirection =
        effects[index] === "zoomIn" ? "zoom+0.001" : "zoom-0.001";
      const inputIndex = index + 1;

      return `[${inputIndex}:v]scale=1024:1792,setsar=1,zoompan=z='${zoomDirection}':d=125:s=1024x1792[v${inputIndex}]`;
    });

    const concatFilter =
      filterComplex.join(";") +
      `;${filterComplex
        .map((_, index) => `[v${index + 1}]`)
        .join(" ")}concat=n=${images.length}:v=1:a=0[vout]`;

    ffmpegCommand
      .complexFilter(concatFilter)
      .map("[vout]")
      .outputOptions([
        "-map 0:a",
        "-c:v libx264",
        "-c:a aac",
        "-pix_fmt yuv420p",
        "-shortest",
      ])
      .on("end", () => {
        res.json({
          message: "Video regenerated successfully",
          videoPath: `/output/video.mp4`,
        });
      })
      .on("error", (err) => {
        console.error("Error during processing:", err.message);
        res.status(500).send("Error regenerating video");
      })
      .save(outputVideoPath);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error regenerating video");
  }
};
