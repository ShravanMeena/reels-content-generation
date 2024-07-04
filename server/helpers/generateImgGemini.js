const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

// The error happens even if safety settings are set to block none.
const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ]

  
const gemini_api_key = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiConfig = {
  temperature: 0.4,
  topP: 1,
  topK: 32,
  maxOutputTokens: 4096,
};

const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  safetySettings,
  geminiConfig,
});

// const generateImgGemini = async (prompt) => {
//   try {
//     const result = await geminiModel.generateImage({
//       prompt: prompt,
//       size: "1024x1024", // Specify the size you need
//       n: 1, // Number of images to generate
//     });
    
//     const imageUrl = result.data[0].url;
//     console.log("Generated Image URL:", imageUrl);
//     return imageUrl;
//   } catch (error) {
//     console.log("Image generation error", error);
//   }
// };

const generateImgGemini = async () => {
  try {
    // Read image file
    const filePath = "some-image.jpeg";
    const imageFile = await fs.readFile(filePath);
    const imageBase64 = imageFile.toString("base64");
 
    const promptConfig = [
      { text: "Can you tell me about this image whats happening there?" },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
    ];
 
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: promptConfig }],
    });
    const response = await result.response;
    console.log(response.text());
  } catch (error) {
    console.log(" response error", error);
  }
};

module.exports = generateImgGemini;
