
import { GoogleGenAI } from "@google/genai";
import { getValidApiKey } from "./geminiService";

export const generateCinematicImage = async (prompt: string, _apiKeyIgnored: string): Promise<string> => {
  // Check for high-fi image generation permissions
  const hasKey = await window.aistudio?.hasSelectedApiKey();
  if (!hasKey) {
    await window.aistudio?.openSelectKey();
  }

  // Use the validated key
  const apiKey = getValidApiKey();
  const ai = new GoogleGenAI({ apiKey });
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
    if (error.message?.includes("Requested entity was not found")) {
        await window.aistudio?.openSelectKey();
    }
    console.error("Image Gen Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};
