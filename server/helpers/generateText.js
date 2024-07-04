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

const systemPrompt = `Imagine a character facing a unique challenge or situation. Describe their initial actions and the events that unfold, leading them to learn an important lesson about life. Your story should include:

Setting: Introduce where and when the story takes place.
Character: Describe the main character and their initial problem.
Conflict: Show the character encountering a challenge or an unusual situation.
Observation: Include an observation or event that makes the character reflect on life.
Resolution: End with the character learning a valuable lesson.
Example Template:

Once upon a time in [setting], a [description of main character] faced a [describe the problem]. While [initial action], [unexpected event] occurred. The [character] observed [specific event/interaction], which made them wonder [reflection/thought].

In the midst of this, [additional challenge] arose. The character [describe action taken to address this challenge]. Ultimately, [resolution of the challenge].

In the end, [character] realized [life lesson]. This story reminds us that [moral of the story].

Example:

Once upon a time in a quaint village, a lazy man tried to steal some apples, but a farmer saw him and started yelling. The lazy man got scared and ran into the forest. After a while, he saw an old wolf. The man wondered how the wolf could survive, being that old and not able to feed himself.

Suddenly, he saw a lion coming towards the wolf with a piece of meat. The lazy man climbed up a tree to stay safe. But the wolf, too old to escape, stayed. The lion left the piece of meat for the wolf to eat.

The lazy man felt happy seeing God's play. God always has a plan set to take care of his creations. He believed that God must have something planned for him, too. So he left to find a place to sit and waited for someone to feed him.

He waited there for two days without any food. Finally, he couldn't bear the hunger and left. He met a wise man on the way. He asked him why God treated him differently from the wolf. The wise man answered, "It's true that God has a plan for everyone. You are obviously a part of his plan, but son, he didn't want you to be like the wolf. He wanted you to be like the lion."

Feel free to use this template to craft your own stories!
make sure story should not be more than 30 sec. please conver it in only 30 sec . so when i will create audio for this story i want 30 to 40 sec video length.

`;

const userPrompt = `Generate a visually captivating and refreshing image of a glass of freshly squeezed lemonade against a vibrant background. The lemonade should be served in a tall, clear glass, with condensation dripping down the sides. Add a wedge of lemon and a sprig of mint for added freshness and visual appeal. Set the glass of lemonade against a vibrant gradient backdrop, creating a sense of depth and dimension. Ensure the lighting enhances the translucency of the lemonade and the texture of the lemon wedge. Experiment with vibrant color tones and a photorealistic art style to make the image pop.`;

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
    // const title = generateDynamicTitle(story);
    // const description = generateDynamicDescription(story);
    // const tags = generateDynamicTags(story);

    return {
      story,
      title: "here is title",
      description: "here is desc",
      tags: ["A"],
    };
  } catch (error) {
    console.log("response error", error);
  }
};

module.exports = generateText;
