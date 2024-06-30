const { ElevenLabsClient } = require("elevenlabs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { createWriteStream } = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

module.exports = async function createAudioFileFromText(text) {
  return new Promise(async (resolve, reject) => {
    try {
      const audio = await elevenLabsClient.generate({
        voice: "Rachel" || process.env.ELEVENLABS_VOICE_ID,
        model_id: "eleven_turbo_v2",
        text,
      });


      const fileName = path.join(__dirname, "../audio", `${uuid()}.mp3`);
      const fileStream = createWriteStream(fileName);

      audio.pipe(fileStream);
      fileStream.on("finish", () => resolve(fileName)); // Resolve with the fileName
      fileStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};
