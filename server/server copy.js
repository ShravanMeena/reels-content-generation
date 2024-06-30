const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors()); // Enable CORS
app.use(express.json());

app.post('/create-video', (req, res) => {
  const audioPath = path.join(__dirname, 'audio', 'voice.mp3');
  const imagePaths = [
    path.join(__dirname, 'images', 'frame1.webp'),
    path.join(__dirname, 'images', 'frame2.webp'),
    path.join(__dirname, 'images', 'frame3.webp'),
  ];

  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const outputVideoPath = path.join(outputDir, 'video.mp4');

  // Get the duration of the audio
  ffmpeg.ffprobe(audioPath, (err, metadata) => {
    if (err) {
      console.error('Error getting audio duration:', err);
      return res.status(500).send('Error generating video');
    }

    const audioDuration = metadata.format.duration;
    const imageDuration = 5; // Each image will be displayed for 5 seconds

    // Create a temporary text file for ffmpeg to use as input
    const inputFilePath = path.join(outputDir, 'input.txt');
    let inputFileContent = '';

    for (let i = 0; i < Math.ceil(audioDuration / imageDuration); i++) {
      imagePaths.forEach(imagePath => {
        inputFileContent += `file '${imagePath}'\nduration ${imageDuration}\n`;
      });
    }

    fs.writeFileSync(inputFilePath, inputFileContent);

    ffmpeg()
      .input(inputFilePath)
      .inputFormat('concat')
      .inputOption('-safe 0')
      .input(audioPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-pix_fmt yuv420p',
        `-t ${audioDuration}`,
        '-shortest'
      ])
      .on('end', () => {
        res.sendFile(outputVideoPath);
      })
      .on('error', (err) => {
        console.error('Error:', err);
        res.status(500).send('Error generating video');
      })
      .save(outputVideoPath);
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
