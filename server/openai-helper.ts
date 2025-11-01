import OpenAI from "openai";
import { Buffer } from "node:buffer";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// Charges are billed to your Replit credits.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

/**
 * Generate an image from a text prompt using OpenAI's gpt-image-1 model
 * @param prompt - Text description of the image to generate
 * @param size - Image dimensions (default: 1024x1024)
 * @returns Buffer containing the generated image (PNG format)
 */
export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  console.log("[AI Image] Generating image with prompt:", prompt);
  
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size,
  });
  
  const base64 = response.data[0]?.b64_json ?? "";
  if (!base64) {
    throw new Error("No image data received from OpenAI");
  }
  
  console.log("[AI Image] Image generated successfully, size:", base64.length, "bytes (base64)");
  
  return Buffer.from(base64, "base64");
}
