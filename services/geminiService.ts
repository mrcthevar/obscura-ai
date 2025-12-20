
import { GoogleGenAI } from "@google/genai";
import { ModuleId } from '../types';
import { SYSTEM_INSTRUCTIONS } from '../constants';

export const getValidApiKey = (): string => {
  const win = window as any;
  const key = win.process?.env?.API_KEY || localStorage.getItem('obscura_api_key');
  if (!key || key.length < 5) {
    throw new Error("Neural Gate Unauthorized. Please enter a valid Gemini API Key.");
  }
  return key;
};

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
  mediaFile: File | null,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  const apiKey = getValidApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = SYSTEM_INSTRUCTIONS[moduleId];
  const modelName = 'gemini-3-pro-preview'; 

  const parts: any[] = [];
  if (mediaFile) {
    const mediaPart = await fileToGenerativePart(mediaFile);
    parts.push(mediaPart);
  }
  if (textInput) {
    parts.push({ text: textInput });
  }

  const config: any = {
    systemInstruction,
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
  };

  if (moduleId === ModuleId.STORYBOARD) {
    config.responseMimeType = "application/json";
  }

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: { parts },
      config: config,
    });

    let fullText = '';
    
    // The SDK returns an async iterable for the stream
    for await (const chunk of result) {
      if (signal?.aborted) {
        throw new Error("Request timed out by operator.");
      }
      
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }

    if (!fullText) throw new Error("Synthesis failed to converge.");
    return fullText;
  } catch (error: any) {
    if (signal?.aborted || error.message === "Request timed out by operator.") {
      throw new Error("Request timed out by operator.");
    }
    console.error("Gemini Service Error:", error);
    throw new Error(error.message || "Neural uplink failure.");
  }
};

export const generateSingleFrame = async (
  description: string,
  shotSpecs: string
): Promise<string> => {
  const apiKey = getValidApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  // switched to Image model for Sketches instead of text model for SVGs
  const modelName = 'gemini-3-pro-image-preview'; 

  const prompt = `Create a loose, atmospheric storyboard sketch. 
                 Style: Charcoal drawing on white paper, rough pencil lines, black and white only. 
                 Scene Description: ${description}. 
                 Camera/Composition: ${shotSpecs}.
                 Do not add text to the image. Focus on lighting, blocking, and composition.`;

  try {
    // Check for paid key via window.aistudio helper if available (since image models require it)
    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
    }

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
    throw new Error("No sketch data generated.");
  } catch (error: any) {
    console.error("Sketch Generation Error:", error);
    throw new Error(error.message || "Neural redraw failed.");
  }
};
