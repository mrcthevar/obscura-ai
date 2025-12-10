import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModuleId } from '../types';
import { SYSTEM_INSTRUCTIONS } from '../constants';

// Helper to get API Key (LocalStorage -> Env)
const getApiKey = (): string => {
  // 1. Check LocalStorage first (User overrides System)
  const storedKey = localStorage.getItem('gemini_api_key');
  if (storedKey) return storedKey;

  // 2. Fallback to System Key (if configured in deployment)
  // Safe access using optional chaining
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.length > 0 && envKey !== 'undefined') {
    return envKey;
  }
  
  return '';
};

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

export const generateModuleContent = async (
  moduleId: ModuleId,
  textInput: string,
  imageFile: File | null
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing API Key. Please enter one in the Gatekeeper.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = SYSTEM_INSTRUCTIONS[moduleId];
  const modelName = 'gemini-3-pro-preview'; // Using Pro for reasoning capabilities

  try {
    const parts: any[] = [];

    // Add image if present
    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      parts.push(imagePart);
    }

    // Add text input
    if (textInput) {
      parts.push({ text: textInput });
    }

    // Special config for STORYBOARD to ensure JSON output
    const config: any = {
      systemInstruction,
    };

    if (moduleId === ModuleId.STORYBOARD) {
      config.responseMimeType = "application/json";
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");
    
    return text;

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
};

export const generateSingleFrame = async (
  description: string,
  shotSpecs: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Missing API Key");

  const ai = new GoogleGenAI({ apiKey });
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

    // Clean up response if it contains markdown
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