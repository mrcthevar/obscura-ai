import { GoogleGenAI } from "@google/genai";

export const generateCinematicImage = async (prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Missing API Key. Please configure in Gatekeeper.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Using the "Banana Pro" equivalent model for high-quality generation
  const modelName = 'gemini-3-pro-image-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    // Iterate through parts to find the image
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
    }

    throw new Error("No image data found in response.");

  } catch (error: any) {
    console.error("Banana Pro Service Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};