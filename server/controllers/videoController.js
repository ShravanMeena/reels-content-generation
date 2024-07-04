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
      res.send({message:"Video uploaded successfully",da});
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


function createSubtitleFile(story, filePath) {
  const lines = story.split('\n').filter(line => line.trim() !== '');
  let srtContent = '';
  let startTime = 0;
  const duration = 4; // duration for each subtitle in seconds

  lines.forEach((line, index) => {
    const endTime = startTime + duration;
    srtContent += `${index + 1}\n`;
    srtContent += `${new Date(startTime * 1000).toISOString().substr(11, 8)},000 --> ${new Date(endTime * 1000).toISOString().substr(11, 8)},000\n`;
    srtContent += `${line}\n\n`;
    startTime = endTime;
  });

  fs.writeFileSync(filePath, srtContent);
}

exports.generateVideo = async (req, res) => {
  try {
    const story = `
Once upon a time in a quaint village, a lazy man tried to steal some apples, but a farmer saw him and started yelling. The lazy man got scared and ran into the forest. After a while, he saw an old wolf. The man wondered how the wolf could survive, being that old and not able to feed himself.

Suddenly, he saw a lion coming towards the wolf with a piece of meat. The lazy man climbed up a tree to stay safe. But the wolf, too old to escape, stayed. The lion left the piece of meat for the wolf to eat.

The lazy man felt happy seeing God's play. `;

    const audioPath = "/Users/shravansymita/Desktop/personal/reel-generator/server/audio/0d36d095-f412-43d2-80b6-de9688075154.mp3";

    const subtitlePath = path.resolve(__dirname, "../output/subtitles.srt");
    // createSubtitleFile(story, subtitlePath);

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

      const ffmpegCommand = ffmpeg().input(audioPath);

      imagePaths.forEach((imagePath) => {
        ffmpegCommand.input(imagePath).inputOptions([
          "-loop 1",
          `-t ${imageDuration}`
        ]);
      });

      const filterComplex = imagePaths.map((imagePath, index) => {
        const zoomDirection = index % 2 === 0 ? 'zoom+0.001' : 'zoom-0.001';
        const inputIndex = index + 1;

        return `[${inputIndex}:v]scale=1024:1792,setsar=1,zoompan=z='${zoomDirection}':d=${imageDuration * 25}:s=1024x1792[v${inputIndex}]`;
      });

      const concatFilter = filterComplex.join(';') + `;${filterComplex.map((_, index) => `[v${index + 1}]`).join(' ')}concat=n=${imagePaths.length}:v=1:a=0,subtitles=${subtitlePath}[vout]`;

      ffmpegCommand
        .complexFilter(concatFilter)
        .map("[vout]")
        .outputOptions([
          "-map 0:a",
          "-c:v libx264",
          "-c:a aac",
          "-pix_fmt yuv420p",
          `-t ${audioDuration}`,
          "-shortest"
        ])
        .on("start", (commandLine) => {
          console.log("Spawned Ffmpeg with command: " + commandLine);
        })
        .on("end", () => {
          console.log("Processing finished successfully");
          res.json({
            message: "Video generated successfully",
            videoPath: `/output/video.mp4`,
            imagePaths
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