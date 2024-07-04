const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

module.exports = async function generateImages(prompt, n) {
  const imageUrls = ["https://www.assemblyai.com/blog/content/images/2022/07/How-Imagen-Actually-Works.png","https://imagen.research.google/main_gallery_images/a-robot-couple-fine-dining.jpg"];
  const basePrompt = `
    You are DALL-E, an advanced AI image generation model. Your task is to create highly realistic, attractive, and visually stunning images that are HD (1024x1792), clear, and vertical.

    Instructions:
    1. Ensure the images look highly realistic, avoiding cartoon-like or abstract styles.
    2. Make the images visually appealing and detailed, with vibrant colors and sharp clarity.
    3. Each image should follow the prompt provided by the user but maintain a high degree of realism and attractiveness.
    4. Avoid any text or captions within the images.
    5. Ensure images are vertical and fill the entire screen, without any white space at the top or bottom.
    6. Minimize the number of characters in the images, focusing on realistic settings and scenes.
    7. Emphasize creating lifelike textures, lighting, and perspectives to enhance realism.
    8. Avoid any form of text, symbols, or markings in the images.

    Here is the user prompt: ${prompt}
  `;

  // for (let i = 0; i < n; i++) {
  //   const response = await openai.images.generate({
  //     model: "dall-e-3",
  //     prompt: basePrompt,
  //     n: 1,
  //     size: "1024x1792", // HD and vertical
  //   });

  //   if (response.data[0] && response.data[0].url) {
  //     imageUrls.push(response.data[0].url);
  //   } else {
  //     console.error("Error generating image:", response);
  //   }
  // }
  return imageUrls;
};
