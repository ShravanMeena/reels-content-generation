const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();
const OpenAI = require("openai");
const { ElevenLabsClient } = require("elevenlabs");
const { v4: uuid } = require("uuid");
const { createWriteStream } = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const storyPrompt = `You are a helpful assistant. Your task is to create a short childhood story set in India. The story should start with an engaging hook that captures the listener's attention right away. It should be written in very simple English, making it easy for children to understand.

The story should be no longer than one minute when read aloud, which typically means it should be around 100-150 words. The narrative should be warm and nostalgic, like the kind of stories grandmothers tell to their grandchildren in India. Include elements of Indian culture and traditions, such as festivals, local animals, traditional foods, or family activities.

Make sure to end the story with a question that invites the audience to think about the story or share their own experiences. The goal is to create a sense of connection and engagement with the audience.

Here is an example structure for your story:
1. Start with a hook to grab attention.
2. Introduce a relatable character and setting in India.
3. Describe a simple plot with a small problem or lesson.
4. Conclude with a warm ending.
5. End with a thought-provoking or engaging question.

Keep the language very simple and the content suitable for children.

Here’s an example of the tone and simplicity we’re aiming for:
"Once upon a time in a small village in India, there was a little girl named Asha. One day, while playing under the big banyan tree, she found a colorful kite stuck in the branches. With the help of her friend Ravi, she managed to get it down. They spent the whole afternoon flying the kite and laughing together. Have you ever flown a kite with your friends?"

Please create a new story following these guidelines, using very simple English that children can easily understand.
`

const openai = new OpenAI(process.env.OPENAI_API_KEY);
const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

async function generateText() {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: storyPrompt },
    ],
    model: "gpt-3.5-turbo",
  });

  return completion.choices[0].message.content;
}

async function generateImages(prompt, n) {
  const imageUrls = [];
  for (let i = 0; i < n; i++) {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    imageUrls.push(response.data[0].url);
  }
  return imageUrls;
}

async function createAudioFileFromText(text) {
  return new Promise(async (resolve, reject) => {
    try {
      const audio = await elevenLabsClient.generate({
        voice: "Rachel" || process.env.ELEVENLABS_VOICE_ID,
        model_id: "eleven_turbo_v2",
        text,
      });
      const fileName = path.join(__dirname, "audio", `${uuid()}.mp3`);
      const fileStream = createWriteStream(fileName);

      audio.pipe(fileStream);
      fileStream.on("finish", () => resolve(fileName)); // Resolve with the fileName
      fileStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

app.post("/generate-video", async (req, res) => {
  try {
    const text = await generateText()

    const audioPath = await createAudioFileFromText(text);

    ffmpeg.ffprobe(audioPath, async (err, metadata) => {
      if (err) {
        console.error("Error getting audio duration:", err);
        return res.status(500).send("Error generating video");
      }

      const audioDuration = metadata.format.duration;
      const imageDuration = 5; // Each image will be displayed for 5 seconds
      const numImages = Math.ceil(audioDuration / imageDuration);

      const images = await generateImages(text, numImages);

      const imagePaths = [];

      for (let i = 0; i < images.length; i++) {
        const imagePath = path.join(__dirname, "images", `image${i + 1}.png`);
        const response = await axios.get(images[i], {
          responseType: "arraybuffer",
        });
        fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));
        imagePaths.push(imagePath);
      }

      const outputDir = path.join(__dirname, "output");
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
          res.sendFile(outputVideoPath);
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
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
