
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModuleId } from '../types';
import { SYSTEM_INSTRUCTIONS } from '../constants';

// Helper to convert file to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const streamModuleContent = async (
  moduleId: ModuleId,
  textInput: string,
  imageFile: File | null,
  onChunk: (text: string) => void
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key (process.env.API_KEY) is not configured in the environment.");
  }

  // Initialize client with key from process.env as required by guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = SYSTEM_INSTRUCTIONS[moduleId];
  // Using gemini-3-pro-preview for complex reasoning and cinematographic analysis
  const modelName = 'gemini-3-pro-preview'; 

  try {
    const parts: any[] = [];
    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      parts.push(imagePart);
    }
    if (textInput) {
      parts.push({ text: textInput });
    }

    const config: any = {
      systemInstruction,
    };

    if (moduleId === ModuleId.STORYBOARD) {
      config.responseMimeType = "application/json";
    }

    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: { parts },
      config: config
    });

    let fullText = '';
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    if (!fullText) throw new Error("No response generated");
    return fullText;
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
};

export const generateSingleFrame = async (
  description: string,
  shotSpecs: string
): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Using gemini-3-pro-preview for complex SVG generation tasks
  const modelName = 'gemini-3-pro-preview';

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{
          text: `Draw a professional storyboard frame in SVG format based on this description: "${description}".
                 Technical Specs: ${shotSpecs}.
                 Style: loose black pencil sketch on white background.
                 Return ONLY the raw SVG string (<svg viewBox="0 0 400 300"...>...</svg>). No markdown.`
        }]
      }
    });

    let text = response.text;
    if (text) {
      text = text.replace(/```svg/g, '').replace(/```/g, '').trim();
    }
    if (!text) throw new Error("No SVG generated");
    return text;
  } catch (error: any) {
    console.error("Single Frame Generation Error:", error);
    throw new Error("Failed to regenerate frame.");
  }
};
