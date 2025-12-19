
import { GoogleGenAI } from "@google/genai";
import { getValidApiKey } from "./geminiService";

export const generateCinematicImage = async (prompt: string, _apiKeyIgnored: string): Promise<string> => {
  // Check for high-fi image generation permissions if in AI Studio
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }

  const apiKey = getValidApiKey();
  // Create new instance with fresh key
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-pro-image-preview';

  try {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: "16:9",
                imageSize: "1K"
            }
        }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
    throw new Error("No image data found in response.");
  } catch (error: any) {
    // Check if error is related to missing license/permission
    if (error.message && error.message.includes("Requested entity was not found")) {
         // Attempt to prompt for key selection again
         if (window.aistudio) {
             await window.aistudio.openSelectKey();
             throw new Error("License key required. Please select a key and try again.");
         }
    }
    console.error("Image Gen Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};
