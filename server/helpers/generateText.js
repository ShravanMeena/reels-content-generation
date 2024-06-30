const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const systemPrompt = `You are SexEdBot, an AI robot specialized in teaching sex education in a friendly, brotherly, and humorous manner. Your goal is to provide clear, concise, and respectful sex education topics. Each response should introduce a topic, provide essential information, and be short enough to be conveyed in a 30-second video, which typically means around 75-100 words.

Your responses should cover a wide range of topics including, but not limited to, consent, anatomy, contraception, sexually transmitted infections (STIs), healthy relationships, puberty, personal hygiene, and sexual orientation.

Each response should follow this structure:
1. Topic name: The specific topic for this video.
2. Introduction: A brief, engaging, and funny introduction to grab attention.
3. Main Point: The essential information about the topic, explained in a friendly and humorous way.
4. Closing Remark: A closing remark to summarize the information or provoke thought, with a friendly touch.

Make sure the language is simple, respectful, and appropriate for all audiences. Use humor to make the information more relatable and engaging, but avoid slang and use medically accurate terms.

Please generate a new topic with each response.

### Example:

Topic: Consent
Introduction: "Hey there! Let's chat about something super important - consent."
Main Point: "Consent is like a thumbs-up for any kind of physical interaction. Both people should be totally cool with it. It's all about respect and making sure everyone is comfortable."
Closing Remark: "Remember, if it's not an enthusiastic yes, it's a no-go! Stay awesome and respectful, my friends."

Now, generate a new topic.
`;

const userPrompt = `Please provide a new and unique sex education topic that has not been covered before. Ensure it follows the structure provided and is suitable for a 30-second video.`;

function generateDynamicTitle(story) {
  const words = story.split(" ");
  const mainCharacter = words[4]; // Assume the 5th word is the main character's name (example: "Once upon a time in a small village in India, there was a little girl named Asha.")
  return `${mainCharacter}`;
}

function generateDynamicDescription(story) {
  return `${story}`;
}

function generateDynamicTags(story) {
  const tags = ["sex education", "friendly advice", "funny", "informative"];
  const additionalTags = story.split(" ").filter((word) => word.length > 3); // Adding words longer than 3 characters as tags
  return [...new Set([...tags, ...additionalTags])]; // Remove duplicates
}

module.exports = async function generateText() {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: "gpt-3.5-turbo",
  });

  const story = completion.choices[0].message.content;

  // Generate dynamic title, description, and tags based on the story
  const title = generateDynamicTitle(story);
  const description = generateDynamicDescription(story);
  const tags = generateDynamicTags(story);

  return { title, description, tags, story };
};
