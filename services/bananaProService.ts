
import { GoogleGenAI } from "@google/genai";

// Removed AIStudio import as it is now globally available via declare global in types.ts.

export const generateCinematicImage = async (prompt: string, _apiKeyIgnored: string): Promise<string> => {
  // Mandatory check for gemini-3-pro-image-preview key selection
  // Using optional chaining as aistudio is now declared as optional on Window
  const hasKey = await window.aistudio?.hasSelectedApiKey();
  if (!hasKey) {
    await window.aistudio?.openSelectKey();
    // Instructions mandate assuming success after openSelectKey to avoid race conditions
  }

  // Create new instance right before call to get up-to-date key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        // Find the image part, do not assume it is the first part.
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
        // Handle race condition/stale key by re-prompting
        await window.aistudio?.openSelectKey();
    }
    console.error("Image Gen Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};