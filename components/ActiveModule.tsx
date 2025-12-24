
import React, { useState, useRef, useContext, useEffect } from 'react';
import { ModuleDefinition, ModuleId, StoryboardFrame } from '../types';
import { streamModuleContent, generateSingleFrame, cleanAndParseJson, fileToGenerativePart } from '../services/geminiService';
import { generateCinematicImage } from '../services/bananaProService';
import { ApiKeyContext } from '../contexts/ApiKeyContext';
import MobileHeader from './MobileHeader';
import Toast from './Toast';

interface ActiveModuleProps {
  module: ModuleDefinition;
  history: string[];
  onResultGenerated: (result: string) => void;
  onUpdateHistory?: (result: string) => void;
  onExitModule: () => void;
  onToggleSidebar: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const PARALLEL_GENERATION_LIMIT = 2; // Rate limit protection

const ActiveModule: React.FC<ActiveModuleProps> = ({ module, history, onResultGenerated, onUpdateHistory, onExitModule, onToggleSidebar }) => {
  const apiKey = useContext(ApiKeyContext);
  const [textInput, setTextInput] = useState('');
  
  // Media State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'application' | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [thinkingState, setThinkingState] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); 

  const [exporting, setExporting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [storyboardData, setStoryboardData] = useState<StoryboardFrame[]>([]);
  
  // UX: View Modes
  const [frameViewModes, setFrameViewModes] = useState<Record<number, 'sketch' | 'hifi' | 'split'>>({});
  
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
  const [editingFrameIndex, setEditingFrameIndex] = useState<number | null>(null);
  const [editedFrameData, setEditedFrameData] = useState<StoryboardFrame | null>(null);
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  
  // Async status tracking
  const [processingFrames, setProcessingFrames] = useState<Set<number>>(new Set());
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Conversation History for Multi-turn logic
  const [conversationHistory, setConversationHistory] = useState<{ role: string, parts: any[] }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyboardRef = useRef<HTMLDivElement>(null);
  const endOfOutputRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userHasScrolledUp = useRef(false);
  const generationQueueRef = useRef<number[]>([]);
  const activeGenerationsRef = useRef<number>(0);

  // Clear history when module changes
  useEffect(() => {
    setConversationHistory([]);
    setStoryboardData([]);
    setOutput(null);
  }, [module.id]);

  // Smart Auto-Scroll
  useEffect(() => {
    const container = endOfOutputRef.current?.closest('.overflow-y-auto');
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      userHasScrolledUp.current = distanceFromBottom > 100;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (thinkingState === 'idle' && !output && storyboardData.length === 0) {
      userHasScrolledUp.current = false;
      return;
    }
    if (!userHasScrolledUp.current) {
      endOfOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [output, storyboardData, thinkingState]);

  useEffect(() => {
    if (history.length > 0) {
      processOutput(history[history.length - 1]);
    } else {
      setOutput(null);
      setStoryboardData([]);
      setFrameViewModes({});
    }
  }, [module.id, history]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (thinkingState === 'processing') {
      setIsFadingOut(false);
      setThinkingStepIndex(0);
      setTimeLeft(45);
      userHasScrolledUp.current = false;
      
      interval = setInterval(() => {
        setThinkingStepIndex(prev => prev < module.steps.length - 1 ? prev + 1 : prev);
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (thinkingState === 'complete') {
        setThinkingStepIndex(module.steps.length - 1);
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              setThinkingState('idle');
              setIsFadingOut(false);
            }, 600);
        }, 1500);
        return () => clearTimeout(timer);
    }
    return () => clearInterval(interval);
  }, [thinkingState, module.steps]);

  const isScriptModule = module.id === ModuleId.STORYBOARD || module.id === ModuleId.SUBTEXT;
  const canUpload = module.requiresImage || isScriptModule;
  const uploadAccept = module.requiresImage ? "image/*" : ".txt,.md,.fountain,.json,.pdf";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorToast(null);

    if (file.size > MAX_FILE_BYTES) {
        setErrorToast(`File too large. Limit is ${MAX_FILE_SIZE_MB}MB.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    if (module.requiresImage) {
        if (!file.type.startsWith('image/')) {
             setErrorToast("This module requires an image file.");
             return;
        }
        setMediaFile(file);
        setMediaType('image');
        const reader = new FileReader();
        reader.onloadend = () => setMediaPreview(reader.result as string);
        reader.readAsDataURL(file);
    } else {
        if (file.type === 'application/pdf') {
             setMediaFile(file);
             setMediaType('application');
             setMediaPreview(null);
             setErrorToast("PDF Script attached.");
        } else {
             const validExtensions = ['.txt', '.md', '.fountain', '.json'];
             const isTextType = file.type.startsWith('text/') || validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
             if (!isTextType) {
                  setErrorToast("Unsupported format. Use .pdf, .txt, .md, or .fountain.");
                  return;
             }
             const reader = new FileReader();
             reader.onload = (event) => {
                 const content = event.target?.result as string;
                 setTextInput(content); 
                 setErrorToast("Script text loaded.");
             };
             reader.readAsText(file);
        }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- PARALLEL QUEUE MANAGEMENT START ---

  const processQueue = async () => {
    if (activeGenerationsRef.current >= PARALLEL_GENERATION_LIMIT) return;
    if (generationQueueRef.current.length === 0) return;

    const index = generationQueueRef.current.shift();
    if (index === undefined) return;

    activeGenerationsRef.current++;
    setProcessingFrames(prev => new Set(prev).add(index));

    try {
        const currentData = await new Promise<StoryboardFrame[]>((resolve) => {
            setStoryboardData(prev => {
                resolve(prev);
                return prev;
            });
        });
        
        const frame = currentData[index];
        if (frame) {
            const specs = `${frame.shotType}, ${frame.cameraMovement}, ${frame.composition}`;
            const newSketch = await generateSingleFrame(frame.description, specs);

            setStoryboardData(prev => {
                const newData = [...prev];
                if (newData[index]) newData[index] = { ...newData[index], svg: newSketch };
                if (onUpdateHistory) onUpdateHistory(JSON.stringify(newData));
                return newData;
            });
        }
    } catch (e) {
        console.warn(`Frame ${index} auto-sketch failed`, e);
    } finally {
        activeGenerationsRef.current--;
        setProcessingFrames(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
        processQueue(); // Trigger next
    }
  };

  const queueFrameGeneration = (index: number) => {
    if (!generationQueueRef.current.includes(index) && !processingFrames.has(index)) {
        generationQueueRef.current.push(index);
        processQueue();
    }
  };

  const generateSketchesSequence = (frames: StoryboardFrame[]) => {
      // Find all frames needing visualization
      frames.forEach((frame, idx) => {
          if (frame.svg && frame.svg.includes('PENDING VISUALIZATION')) {
              queueFrameGeneration(idx);
          }
      });
  };

  // --- PARALLEL QUEUE MANAGEMENT END ---

  const processOutput = (result: string) => {
    if (module.id === ModuleId.STORYBOARD) {
      try {
        const frames = cleanAndParseJson(result);
        const validFrames = Array.isArray(frames) ? frames : [];
        if (validFrames.length > 0) {
          setStoryboardData(validFrames);
          setOutput(null); // Clear text if JSON succeeded
          generateSketchesSequence(validFrames);
        } else {
           // Empty array or invalid
           setOutput(result);
        }
      } catch (e) {
        // Fallback: If JSON fails, at least show the raw text so user knows something happened
        // The user logic might be in conversational mode (text output)
        if (!result.trim().startsWith('[')) setOutput(result);
      }
    } else {
      setOutput(result);
    }
  };

  const handleExecute = async (manualInput?: string) => {
    const inputToUse = manualInput || textInput;
    if (!inputToUse.trim() && !mediaFile) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setThinkingState('processing');
    
    // We do NOT clear history here to support multi-turn
    // We clear Output and StoryboardData temporarily to show new result coming
    setStoryboardData([]);
    setFrameViewModes({});
    setOutput('');
    setErrorToast(null);
    userHasScrolledUp.current = false;
    generationQueueRef.current = [];
    activeGenerationsRef.current = 0;
    setProcessingFrames(new Set());
    
    // Build the user message for this turn
    const parts: any[] = [];
    if (mediaFile) {
      // We must await conversion here to persist it in history state
      try {
          const mediaPart = await fileToGenerativePart(mediaFile);
          parts.push(mediaPart);
      } catch (e) {
          console.error("File processing error", e);
      }
    }
    if (inputToUse) {
      parts.push({ text: inputToUse });
    }

    const newUserTurn = { role: 'user', parts };
    // Optimistic update of history so the API calls sees it
    const nextHistory = [...conversationHistory, newUserTurn];

    const timeoutId = setTimeout(() => {
        if (abortControllerRef.current === controller) {
            controller.abort();
            setErrorToast("Connection timed out (45s). Network latency high.");
            setLoading(false);
            setThinkingState('idle');
        }
    }, 45000);

    let buffer = '';
    try {
      const result = await streamModuleContent(
        module.id, 
        nextHistory, // Send full history 
        (chunk) => {
            buffer += chunk;
            // For Storyboard, we don't stream to output directly if we expect JSON,
            // but for conversation mode we do. We'll stream to output and attempt parse at end.
            if (module.id !== ModuleId.STORYBOARD) {
               setOutput(buffer);
            } else {
               // For storyboard, show text as it comes (chat mode)
               // If it starts looking like JSON, we might hide it, but safer to just show text until done
               setOutput(buffer);
            }
        },
        controller.signal
      );
      clearTimeout(timeoutId);
      
      // Update history with model response
      setConversationHistory(prev => [
        ...prev, 
        newUserTurn,
        { role: 'model', parts: [{ text: result }] }
      ]);
      
      onResultGenerated(result);
      processOutput(result);
      
      setTextInput(''); 
      setMediaFile(null);
      setMediaType(null);
      setMediaPreview(null);
      setThinkingState('complete');
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.message !== "Request timed out by operator.") {
         setErrorToast(err.message || "Neural uplink failure.");
      }
      if (buffer && module.id !== ModuleId.STORYBOARD) setOutput(buffer);
      setThinkingState('idle');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
  };

  const handleEditFrame = (index: number) => {
    setEditingFrameIndex(index);
    setEditedFrameData({ ...storyboardData[index] });
  };

  const handleSaveEdit = () => {
    if (editingFrameIndex !== null && editedFrameData) {
      const newData = [...storyboardData];
      newData[editingFrameIndex] = editedFrameData;
      setStoryboardData(newData);
      if (onUpdateHistory) onUpdateHistory(JSON.stringify(newData));
      setEditingFrameIndex(null);
    }
  };

  const handleRegenerateFrame = async (index: number) => {
    const frame = editingFrameIndex === index && editedFrameData ? editedFrameData : storyboardData[index];
    setProcessingFrames(prev => new Set(prev).add(index));
    try {
      const specs = `${frame.shotType}, ${frame.cameraMovement}, ${frame.composition}`;
      const newSketchImage = await generateSingleFrame(frame.description, specs);
      setFrameViewModes(prev => ({...prev, [index]: 'sketch'}));

      if (editingFrameIndex === index && editedFrameData) {
        setEditedFrameData({ ...editedFrameData, svg: newSketchImage });
      } else {
        const newData = [...storyboardData];
        newData[index] = { ...frame, svg: newSketchImage };
        setStoryboardData(newData);
        if (onUpdateHistory) onUpdateHistory(JSON.stringify(newData));
      }
    } catch (e) { 
        setErrorToast("Sketch redraw failed. Try again."); 
    } finally { 
        setProcessingFrames(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
    }
  };

  const handleGenerateRealImage = async (index: number) => {
    const frame = editingFrameIndex === index && editedFrameData ? editedFrameData : storyboardData[index];
    setProcessingFrames(prev => new Set(prev).add(index));
    setGeneratingImageIndex(index); // Keep for UI distinction if needed
    try {
      const prompt = `Cinematic shot, ${frame.shotType}. ${frame.description}. Lighting: ${frame.lightingNotes}. Style: ${frame.composition}. Photorealistic 8k.`;
      const base64Image = await generateCinematicImage(prompt, apiKey);
      setFrameViewModes(prev => ({...prev, [index]: 'hifi'}));

      if (editingFrameIndex === index && editedFrameData) {
          setEditedFrameData({ ...editedFrameData, generatedImage: base64Image });
      } else {
          const newData = [...storyboardData];
          newData[index] = { ...frame, generatedImage: base64Image };
          setStoryboardData(newData);
          if (onUpdateHistory) onUpdateHistory(JSON.stringify(newData));
      }
    } catch (e) { 
        setErrorToast("Gen failed. Check API key/Quota."); 
    } finally { 
        setProcessingFrames(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
        setGeneratingImageIndex(null);
    }
  };

  const handleExportPDF = async () => {
    if (!storyboardRef.current || !window.jspdf || !window.html2canvas) {
        setErrorToast("Export modules failed to load. Check connection.");
        return;
    }
    setExporting(true);
    try {
       const { jsPDF } = window.jspdf;
       const doc = new jsPDF('l', 'mm', 'a4');
       const els = storyboardRef.current.querySelectorAll('.storyboard-frame');
       const pageWidth = doc.internal.pageSize.getWidth();
       let x = 10, y = 10, count = 0;
       const w = (pageWidth - 40) / 3;
       const h = w * 0.5625; 

       for (let i = 0; i < els.length; i++) {
         if (count > 0 && count % 6 === 0) { doc.addPage(); x = 10; y = 10; }
         const canvas = await window.html2canvas(els[i] as HTMLElement, { scale: 2, backgroundColor: '#ffffff' });
         const imgData = canvas.toDataURL('image/jpeg', 0.9);
         doc.addImage(imgData, 'JPEG', x, y, w, h);
         count++;
         if (count % 3 === 0) { x = 10; y += h + 10; } else { x += w + 10; }
       }
       doc.save(`OBSCURA_${module.id}_Story.pdf`);
    } catch(e) { console.error(e); setErrorToast("Export failed."); }
    finally { setExporting(false); }
  };

  const renderContent = () => {
    if (!output && !storyboardData.length && thinkingState === 'idle') {
       return (
         <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in p-10 pointer-events-none">
            <div className="text-[var(--text-primary)] animate-breathe mb-12 transform scale-[4]">
               <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d={module.icon} /></svg>
            </div>
            <div className="text-center space-y-4 max-w-md">
               <h3 className="text-3xl font-bold tracking-tight">{module.title}</h3>
               <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-light">{module.description}</p>
            </div>
         </div>
       );
    }

    return (
      <div className="max-w-7xl mx-auto w-full pb-72 pt-16 px-6 md:px-12">
        {thinkingState !== 'idle' && (
           <div className={`mb-16 bg-[var(--bg-panel)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-[2.5rem] p-8 flex items-center gap-8 shadow-2xl transition-all duration-1000 transform ${isFadingOut ? 'opacity-0 -translate-y-12 scale-95 overflow-hidden' : 'opacity-100'}`}>
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                 {thinkingState === 'complete' ? (
                   <div className="text-[var(--accent)] animate-scale-in">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </div>
                 ) : (
                   <>
                     <div className="absolute inset-0 border-[3px] border-[var(--accent)]/10 rounded-full"></div>
                     <div className="absolute inset-0 border-[3px] border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                     <div className="text-[9px] font-black text-[var(--accent)] font-mono tracking-tighter">{timeLeft}s</div>
                   </>
                 )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                 <h4 className="text-[9px] font-black text-[var(--accent)] uppercase tracking-[0.4em] mb-1.5 font-mono select-none">
                    {thinkingState === 'complete' ? 'Synthesis Converged' : 'Neural Processing'}
                 </h4>
                 <div className="flex items-center justify-between gap-4">
                   <div className="flex items-center gap-2">
                     <span className="text-xl font-bold truncate tracking-tight">
                        {thinkingState === 'complete' ? 'Success' : `${module.steps[thinkingStepIndex]}`}
                     </span>
                     {thinkingState === 'processing' && <span className="animate-pulse text-[var(--accent)] font-mono text-xl">_</span>}
                   </div>
                   {thinkingState === 'processing' && (
                     <button 
                       onClick={handleCancel}
                       className="px-4 py-2 border border-red-500/30 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all"
                     >
                       Abort
                     </button>
                   )}
                 </div>
              </div>
           </div>
        )}

        {output && !storyboardData.length && (
          <div className="bg-[var(--bg-card)] border border border-[var(--border-subtle)] rounded-[3rem] p-12 shadow-sm animate-slide-up backdrop-blur-[2px] relative group">
             <button onClick={handleCopy} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-3 text-[var(--text-muted)] hover:text-[var(--accent)] bg-[var(--bg-studio)] rounded-xl border border-[var(--border-subtle)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
             </button>
             <div className="prose prose-invert max-w-none text-[var(--text-secondary)] font-inter text-sm leading-[1.8] marker:text-[var(--accent)]" dangerouslySetInnerHTML={{ __html: output }} />
          </div>
        )}

        {storyboardData.length > 0 && (
          <div ref={storyboardRef} className="space-y-12 animate-slide-up">
             <div className="flex justify-between items-end border-b border-[var(--border-subtle)] pb-8">
                <div>
                  <h3 className="text-4xl font-bold tracking-tighter">Visual Archive</h3>
                  <p className="text-[var(--text-muted)] text-sm mt-2 font-light tracking-wide">Analysis Log // Sequence 01</p>
                </div>
                <button onClick={handleExportPDF} disabled={exporting} className="bg-[var(--text-primary)] text-[var(--bg-studio)] px-8 py-3 rounded-[1.25rem] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[var(--accent)] hover:text-black transition-all active:scale-95 shadow-xl">
                  {exporting ? 'Processing' : 'Export Dossier'}
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {storyboardData.map((frame, idx) => {
                 const isEditing = editingFrameIndex === idx;
                 const data = isEditing ? editedFrameData! : frame;
                 const isBusy = processingFrames.has(idx);
                 const isSketchImage = data.svg && data.svg.startsWith('data:image');
                 const hasHiFi = !!data.generatedImage;
                 const viewMode = frameViewModes[idx] || (hasHiFi ? 'hifi' : 'sketch');
                 
                 return (
                   <div key={idx} className="storyboard-frame flex flex-col gap-3 group">
                      <div className={`aspect-video relative bg-white border-4 ${isEditing ? 'border-[var(--accent)]' : 'border-[#1a1a1a]'} overflow-hidden transition-colors duration-300`}>
                         <div className="absolute top-0 left-0 bg-black text-white px-3 py-1 text-[10px] font-black font-mono z-20 border-b border-r border-[#333]">{idx + 1}</div>
                         {isBusy && (
                           <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center">
                              <div className="w-8 h-8 border-4 border-black border-t-[var(--accent)] rounded-full animate-spin mb-2"></div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-black">
                                {generatingImageIndex === idx ? 'Rendering Hi-Fi...' : 'Sketching...'}
                              </span>
                           </div>
                         )}
                         <div className="w-full h-full relative group/image">
                             {viewMode === 'split' && hasHiFi ? (
                                  <div className="flex w-full h-full relative">
                                      <div className="w-1/2 h-full border-r border-black/10 relative overflow-hidden">
                                         <span className="absolute top-2 left-2 z-10 text-[8px] font-black bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur-md">SKETCH</span>
                                         {isSketchImage ? <img src={data.svg} className="w-full h-full object-cover grayscale contrast-125" alt="Sketch" /> : <div dangerouslySetInnerHTML={{__html: data.svg}} />}
                                      </div>
                                      <div className="w-1/2 h-full relative overflow-hidden">
                                         <span className="absolute top-2 right-2 z-10 text-[8px] font-black bg-[var(--accent)] text-black px-1.5 py-0.5 rounded backdrop-blur-md">HI-FI</span>
                                         <img src={data.generatedImage} className="w-full h-full object-cover" alt="Hi-Fi" />
                                      </div>
                                  </div>
                             ) : (viewMode === 'hifi' && hasHiFi) ? (
                                  <img src={data.generatedImage} className="w-full h-full object-cover" alt="Hi-Fi" />
                             ) : (
                                  isSketchImage ? <img src={data.svg} className="w-full h-full object-cover grayscale contrast-125" alt="Sketch" /> : <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: data.svg }} />
                             )}
                             {/* HIGH CONTRAST TOGGLE */}
                             {hasHiFi && !isBusy && (
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 backdrop-blur-xl p-1 rounded-full border border-white/10 z-20 opacity-0 group-hover/image:opacity-100 transition-all duration-300 translate-y-2 group-hover/image:translate-y-0 shadow-2xl">
                                      <button onClick={(e) => { e.stopPropagation(); setFrameViewModes(prev => ({...prev, [idx]: 'sketch'})); }} className={`px-3 py-1 text-[8px] font-bold rounded-full transition-colors uppercase tracking-wider ${viewMode === 'sketch' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>Sketch</button>
                                      <button onClick={(e) => { e.stopPropagation(); setFrameViewModes(prev => ({...prev, [idx]: 'split'})); }} className={`px-3 py-1 text-[8px] font-bold rounded-full transition-colors uppercase tracking-wider ${viewMode === 'split' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>Both</button>
                                      <button onClick={(e) => { e.stopPropagation(); setFrameViewModes(prev => ({...prev, [idx]: 'hifi'})); }} className={`px-3 py-1 text-[8px] font-bold rounded-full transition-colors uppercase tracking-wider ${viewMode === 'hifi' ? 'bg-[var(--accent)] text-black' : 'text-zinc-400 hover:text-white'}`}>Hi-Fi</button>
                                  </div>
                             )}
                         </div>
                      </div>
                      <div className="space-y-3">
                         {isEditing ? (
                           <div className="bg-[var(--bg-panel)] p-4 rounded-xl border border-[var(--border-subtle)] space-y-3 animate-fade-in">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-wider">Editing Frame {idx+1}</span>
                             </div>
                             <textarea 
                                className="w-full bg-zinc-900/50 text-white p-3 rounded-lg text-xs border border-white/10 outline-none focus:border-[var(--accent)] font-mono leading-relaxed resize-none shadow-inner" 
                                rows={4} 
                                value={data.description} 
                                onChange={e => setEditedFrameData({...data, description: e.target.value})} 
                             />
                             <div className="flex flex-col gap-2">
                               <div className="flex gap-2">
                                  {/* HIGH CONTRAST BUTTONS */}
                                  <button onClick={() => handleRegenerateFrame(idx)} className="flex-1 bg-zinc-800 border border-zinc-600 hover:bg-white hover:text-black text-white py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all">Redraw Sketch</button>
                                  <button onClick={() => handleGenerateRealImage(idx)} className="flex-1 bg-[var(--accent)] text-black hover:bg-white py-2 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg border border-transparent">Render Hi-Fi</button>
                               </div>
                               <div className="flex gap-2 pt-2 border-t border-[var(--border-subtle)]">
                                  <button onClick={() => setEditingFrameIndex(null)} className="flex-1 py-2 text-[9px] font-bold text-zinc-400 hover:text-red-400 bg-transparent">CANCEL</button>
                                  <button onClick={handleSaveEdit} className="flex-1 bg-zinc-100 text-black py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[var(--accent)] transition-colors">COMMIT CHANGES</button>
                               </div>
                             </div>
                           </div>
                         ) : (
                           <div className="group/meta">
                             <div className="flex justify-between items-start mb-2">
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{data.shotType}</span>
                                 <span className="text-[9px] text-[var(--text-muted)] font-mono">{data.cameraMovement}</span>
                               </div>
                               <div className="flex gap-1">
                                  {!data.generatedImage && (
                                     <button 
                                       onClick={() => handleGenerateRealImage(idx)} 
                                       className="bg-zinc-800 border border-zinc-600 hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] text-zinc-300 p-1.5 rounded transition-all"
                                       title="Quick Render Hi-Fi"
                                     >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                     </button>
                                  )}
                                  <button onClick={() => handleEditFrame(idx)} className="bg-zinc-800 border border-zinc-600 hover:bg-white hover:text-black hover:border-white text-zinc-300 p-1.5 rounded transition-all">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                               </div>
                             </div>
                             <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium line-clamp-3 group-hover/meta:line-clamp-none transition-all">{data.description}</p>
                           </div>
                         )}
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        )}
        <div ref={endOfOutputRef} />
      </div>
    );
  };

  return (
    <>
      <MobileHeader title={module.title} onBack={onExitModule} onOpenSettings={onToggleSidebar} />
      {renderContent()}
      {errorToast && <Toast message={errorToast} onClose={() => setErrorToast(null)} />}
      <div className="fixed bottom-12 left-0 md:left-72 right-0 px-8 z-30 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
           {mediaFile && (
             <div className="mb-6 bg-[var(--bg-studio)] border border-[var(--border-subtle)] rounded-[2rem] p-3 w-fit flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] animate-slide-up border-b-[var(--accent)]/50">
               {mediaType === 'image' && mediaPreview ? (
                   <img src={mediaPreview} className="w-12 h-12 rounded-xl object-cover" alt="Upload preview" />
               ) : (
                   <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                   </div>
               )}
               <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-[var(--text-primary)] max-w-[150px] truncate">{mediaFile.name}</span>
                   <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{mediaType === 'image' ? 'Visual Ref' : 'Script Doc'}</span>
                   <span className="text-[8px] text-[var(--text-muted)] opacity-70">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</span>
               </div>
               <button onClick={() => {setMediaFile(null); setMediaPreview(null); setMediaType(null);}} className="text-[var(--text-muted)] hover:text-red-500 pr-3 transition-colors ml-2" aria-label="Remove attachment">✕</button>
             </div>
           )}

           <div className="bg-[var(--bg-panel)] backdrop-blur-2xl border border-[var(--border-subtle)] rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] flex items-end p-2.5 transition-all duration-500 focus-within:border-[var(--accent)]/50 focus-within:shadow-[0_0_25px_var(--shadow-glow)]">
              {canUpload && (
                <button onClick={() => fileInputRef.current?.click()} className="p-5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-all duration-300">
                  {module.requiresImage ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  )}
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept={uploadAccept} />
              <div className="flex-1 relative">
                 <span className="absolute left-5 top-5 text-[var(--accent)] font-mono text-base pointer-events-none select-none">&gt;_</span>
                 <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Ask ${module.title.toUpperCase()}...`} className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm py-5 pl-12 pr-6 outline-none resize-none max-h-48 min-h-[64px] font-mono leading-relaxed" rows={1} style={{ height: 'auto', minHeight: '64px' }} aria-label="Prompt Input"/>
              </div>
              <button onClick={() => handleExecute()} disabled={loading || (!textInput.trim() && !mediaFile)} className={`p-5 m-1 rounded-[1.75rem] transition-all duration-500 shadow-2xl ${textInput.trim() || mediaFile ? 'bg-[var(--accent)] text-black hover:bg-white active:scale-95 shadow-[var(--accent)]/20' : 'bg-[var(--bg-studio)] text-[var(--text-muted)] cursor-not-allowed opacity-30'}`}>
                {loading ? <span className="block w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
              </button>
           </div>
        </div>
      </div>
    </>
  );
};
export default ActiveModule;
