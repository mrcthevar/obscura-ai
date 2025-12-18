
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
  const modelName = 'gemini-3-pro-image-preview';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            imageConfig: {
              aspectRatio: "16:9",
              imageSize: "1K"
            }
          }
        }),
      }
    );

    if (!response.ok) {
        let errorMessage = "Image synthesis failed.";
        try {
            const err = await response.json();
            if (err.error?.message?.includes("Requested entity was not found")) {
                await window.aistudio?.openSelectKey();
                // We could retry here, but throwing nicely is safer to prevent infinite loops
                throw new Error("License key required. Please select a key and try again.");
            }
            errorMessage = err.error?.message || errorMessage;
        } catch (e: any) {
             // If JSON parse fails (e.g. 500 HTML) or the specific check fails
             if (e.message && e.message.includes("License key")) throw e;
             errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    
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
    console.error("Image Gen Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};
