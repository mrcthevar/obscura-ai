
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
  const modelName = 'gemini-3-pro-preview';

  const prompt = `Draw a professional storyboard frame in SVG format based on this description: "${description}".
                 Technical Specs: ${shotSpecs}.
                 Style: loose black pencil sketch on white background.
                 Return ONLY the raw SVG string (<svg viewBox="0 0 400 300"...>...</svg>). No markdown.`;

  try {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: prompt }] },
        config: { temperature: 0.2 }
    });

    let text = response.text;
    
    if (text) {
      text = text.replace(/```svg/g, '').replace(/```/g, '').trim();
    }
    if (!text) throw new Error("SVG synthesis failed.");
    return text;
  } catch (error: any) {
    console.error("Single Frame Generation Error:", error);
    throw new Error(error.message || "Neural redraw failed.");
  }
};
