const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
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
];

const gemini_api_key = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiConfig = {
  temperature: 0.9,
  topP: 1,
  topK: 1,
  maxOutputTokens: 4096,
};

const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  safetySettings,
  geminiConfig,
});

const systemPrompt = `"Generate a short, unique story about Lord Krishna with the following structure:

Setting: Introduce where and when the story takes place.
Character: Describe Lord Krishna and any other key characters involved.
Conflict: Show Krishna encountering a challenge or an unusual situation.
Observation: Include an observation or event that makes Krishna or others reflect on life.
Resolution: End with Krishna teaching a valuable lesson.
Ensure the story is concise and can be read within 30-40 seconds. Use simple, engaging language suitable for all ages."

Example:

One day in Vrindavan, Lord Krishna and his friends decided to play near the Yamuna River. Suddenly, a fierce storm began, and everyone became frightened. Krishna then played his flute, and the storm calmed down. This event taught everyone that faith and devotion to Lord Krishna can resolve any problem.

`
const userPrompt = `"Generate a short, unique story in english with the following structure`

function generateDynamicTitle(story) {
  const words = story.split(" ");
  const mainCharacter = words[4]; // Assume the 5th word is the main character's name (example: "Once upon a time in a small village in India, there was a little girl named Asha.")
  return `${mainCharacter}`;
}

function generateDynamicDescription(story) {
  return `${story}`;
}

function generateDynamicTags(story) {
  const tags = [];
  const additionalTags = story.split(" ").filter((word) => word.length > 3); // Adding words longer than 3 characters as tags
  return [...new Set([...tags, ...additionalTags])]; // Remove duplicates
}

const generateText = async () => {
  try {
    const prompt = `${systemPrompt} ${userPrompt}`;
    const result = await geminiModel.generateContent(prompt);
    const story = result.response.text();

    // Generate dynamic title, description, and tags based on the story
    const title = generateDynamicTitle(story);
    const description = generateDynamicDescription(story);
    const tags = generateDynamicTags(story);

    return {
      story,
      title,
      description,
      tags,
    };
  } catch (error) {
    console.log("response error", error);
  }
};

module.exports = generateText;
