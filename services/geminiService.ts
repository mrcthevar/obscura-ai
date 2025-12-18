
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
  imageFile: File | null,
  onChunk: (text: string) => void
): Promise<string> => {
  const apiKey = getValidApiKey();
  const systemInstruction = SYSTEM_INSTRUCTIONS[moduleId];
  const modelName = 'gemini-3-pro-preview'; 

  const parts: any[] = [];
  if (imageFile) {
    const imagePart = await fileToGenerativePart(imageFile);
    parts.push(imagePart);
  }
  if (textInput) {
    parts.push({ text: textInput });
  }

  const payload: any = {
    contents: [{ parts }],
    system_instruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    }
  };

  if (moduleId === ModuleId.STORYBOARD) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      let errorMessage = "Uplink disrupted.";
      try {
        const err = await response.json();
        errorMessage = err.error?.message || errorMessage;
      } catch (e) {
        // Fallback if response is not JSON (e.g. 503 HTML page)
        errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Stream unreachable.");

    const decoder = new TextDecoder();
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.substring(6));
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullText += text;
              onChunk(text);
            }
          } catch (e) {
            // Partial JSON or non-JSON data line
          }
        }
      }
    }

    if (!fullText) throw new Error("Synthesis failed to converge.");
    return fullText;
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw new Error(error.message || "Neural uplink failure.");
  }
};

export const generateSingleFrame = async (
  description: string,
  shotSpecs: string
): Promise<string> => {
  const apiKey = getValidApiKey();
  const modelName = 'gemini-3-pro-preview';

  const prompt = `Draw a professional storyboard frame in SVG format based on this description: "${description}".
                 Technical Specs: ${shotSpecs}.
                 Style: loose black pencil sketch on white background.
                 Return ONLY the raw SVG string (<svg viewBox="0 0 400 300"...>...</svg>). No markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        }),
      }
    );

    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      text = text.replace(/```svg/g, '').replace(/```/g, '').trim();
    }
    if (!text) throw new Error("SVG synthesis failed.");
    return text;
  } catch (error: any) {
    console.error("Single Frame Generation Error:", error);
    throw new Error("Neural redraw failed.");
  }
};
