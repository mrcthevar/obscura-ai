import { GoogleGenAI } from "@google/genai";
import { ModuleId } from '../types';
import { SYSTEM_INSTRUCTIONS } from '../constants';
import { databaseToolDeclaration } from '../functions/geminiSystemPrompt';
import { searchDatabase } from '../functions/databaseQueries';

// Callback type for status updates
type StatusCallback = (isFetching: boolean, status?: string) => void;

export const getValidApiKey = (): string => {
  const win = window as any;
  const key = win.process?.env?.API_KEY || localStorage.getItem('obscura_api_key');
  if (!key || key.length < 5) {
    throw new Error("Neural Gate Unauthorized. Please enter a valid Gemini API Key.");
  }
  return key;
};

// PRODUCTION FIX: Convert ugly API errors into user-friendly status messages
const sanitizeError = (error: any): string => {
  const msg = error.message || error.toString();
  
  if (msg.includes('QuotaFailure') || msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted')) {
    return "System Capacity Reached: Rate limit exceeded. Please wait 60 seconds before retrying.";
  }
  
  if (msg.includes('503') || msg.includes('overloaded')) {
    return "System Overload: Neural servers are currently busy. Try again shortly.";
  }
  
  if (msg.includes('SAFETY') || msg.includes('blocked')) {
    return "Safety Protocol: Content flagged by safety filters.";
  }

  // If it's a huge raw JSON dump, return a generic error
  if (msg.includes('{') && msg.length > 100) {
      return "Neural Uplink Failure: Connection refused by remote host.";
  }

  return msg;
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

/**
 * Robust JSON extraction that handles Markdown code blocks and common LLM formatting errors.
 */
export const cleanAndParseJson = (text: string): any => {
    let clean = text.trim();
    // Remove markdown code blocks
    if (clean.includes('```')) {
        clean = clean.replace(/^```(json)?/gm, '').replace(/```$/gm, '');
    }
    // Attempt to find the array/object if surrounded by conversation
    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
        clean = clean.substring(firstBracket, lastBracket + 1);
    }
    return JSON.parse(clean);
};

export const streamModuleContent = async (
  moduleId: ModuleId,
  contents: any[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  onStatusUpdate?: StatusCallback
): Promise<string> => {
  const apiKey = getValidApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = SYSTEM_INSTRUCTIONS[moduleId];
  const modelName = 'gemini-3-pro-preview'; 

  // Add tools configuration
  const tools = [{ functionDeclarations: [databaseToolDeclaration] }];
  const config: any = {
    systemInstruction,
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    tools: tools,
  };

  if (moduleId === ModuleId.STORYBOARD) {
    // We do NOT enforce JSON mimetype here because the first turns are conversational
    // config.responseMimeType = "application/json"; 
  }

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: contents, // Full history
      config: config,
    });

    let fullText = '';
    
    // We need to buffer chunks to detect function calls effectively if they are split (unlikely but safe)
    // However, google-genai yields chunks that might contain function calls property
    
    for await (const chunk of result) {
      if (signal?.aborted) {
        throw new Error("Request timed out by operator.");
      }

      // Check for Function Call
      const functionCalls = chunk.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
           if (call.name === 'query_database') {
              const { category, searchTerm } = call.args as any;
              
              if (onStatusUpdate) onStatusUpdate(true, `Querying Archive: ${category}...`);
              
              console.log(`[System] Executing Tool: ${call.name}`, call.args);
              const dbResult = await searchDatabase(category, searchTerm);
              
              if (onStatusUpdate) onStatusUpdate(false);
              
              // Recursive call with function response
              // We append the function call and response to history and stream again
              const newContents = [
                ...contents,
                { role: 'model', parts: [{ functionCall: call }] }, // The model's call
                { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result: dbResult } } }] } // Our response
              ];
              
              return streamModuleContent(moduleId, newContents, onChunk, signal, onStatusUpdate);
           }
        }
        continue; // Skip text processing if it was a function call
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
    throw new Error(sanitizeError(error));
  }
};

/**
 * Retry helper for unstable image generation APIs
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

export const generateSingleFrame = async (
  description: string,
  shotSpecs: string
): Promise<string> => {
  const apiKey = getValidApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-pro-image-preview'; 

  const prompt = `Create a loose, atmospheric storyboard sketch. 
                 Style: Charcoal drawing on white paper, rough pencil lines, black and white only. 
                 Scene Description: ${description}. 
                 Camera/Composition: ${shotSpecs}.
                 Do not add text to the image. Focus on lighting, blocking, and composition.`;

  const attemptGeneration = async () => {
    try {
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
      // Don't retry auth errors, only networking/server errors
      if (error.message?.includes("API Key") || error.message?.includes("License")) throw error;
      throw error; 
    }
  };

  try {
    // Retry up to 2 times (3 total attempts) with backoff
    return await withRetry(attemptGeneration, 2, 1000);
  } catch (error: any) {
    console.error("Sketch Generation Error:", error);
    throw new Error(sanitizeError(error));
  }
};