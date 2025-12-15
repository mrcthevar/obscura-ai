import React, { useState, useRef, useContext, useEffect } from 'react';
import { ModuleDefinition, ModuleId, StoryboardFrame } from '../types';
import { streamModuleContent, generateSingleFrame } from '../services/geminiService';
import { generateCinematicImage } from '../services/bananaProService';
import { ApiKeyContext } from '../contexts/ApiKeyContext';

declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

interface ActiveModuleProps {
  module: ModuleDefinition;
  history: string[];
  onResultGenerated: (result: string) => void;
  onUpdateHistory?: (result: string) => void;
}

const ActiveModule: React.FC<ActiveModuleProps> = ({ module, history, onResultGenerated, onUpdateHistory }) => {
  const apiKey = useContext(ApiKeyContext);
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false); // Tracks API active state
  const [thinkingState, setThinkingState] = useState<'idle' | 'processing' | 'complete'>('idle'); // Tracks UI state
  const [isFadingOut, setIsFadingOut] = useState(false); // Tracks exit animation

  const [exporting, setExporting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [storyboardData, setStoryboardData] = useState<StoryboardFrame[]>([]);
  
  // Thinking Mode State
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);

  // Editing State
  const [editingFrameIndex, setEditingFrameIndex] = useState<number | null>(null);
  const [editedFrameData, setEditedFrameData] = useState<StoryboardFrame | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyboardRef = useRef<HTMLDivElement>(null);
  const endOfOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when output changes or loads
    endOfOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output, storyboardData, thinkingState]);

  useEffect(() => {
    // When switching modules or loading history, set initial state
    if (history.length > 0) {
      processOutput(history[history.length - 1]);
    } else {
      setOutput(null);
      setStoryboardData([]);
    }
  }, [module.id, history]);

  // Thinking Mode Simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (thinkingState === 'processing') {
      setIsFadingOut(false);
      setThinkingStepIndex(0);
      interval = setInterval(() => {
        setThinkingStepIndex(prev => {
           // Advance steps but stop at the last one while processing
           if (prev < module.steps.length - 1) return prev + 1;
           return prev;
        });
      }, 1500); // 1.5s per simulated step
    } else if (thinkingState === 'complete') {
        // Force to last step for 100% visual
        setThinkingStepIndex(module.steps.length - 1);
        
        // Vanish after delay
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            
            // Allow animation to play before removing from DOM
            setTimeout(() => {
              setThinkingState('idle');
              setIsFadingOut(false);
            }, 600); // Match CSS transition duration
            
        }, 1500);
        return () => clearTimeout(timer);
    }
    
    return () => clearInterval(interval);
  }, [thinkingState, module.steps]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const processOutput = (result: string) => {
    if (module.id === ModuleId.STORYBOARD) {
      try {
        const frames = JSON.parse(result);
        setStoryboardData(Array.isArray(frames) ? frames : []);
      } catch (e) {
        // If partial JSON or error, usually handled in streaming logic but fallback here
        setOutput(result);
      }
    } else {
      setOutput(result);
    }
  };

  const handleExecute = async () => {
    if (!textInput.trim() && !imageFile) return;
    setLoading(true);
    setThinkingState('processing');
    setStoryboardData([]);
    setOutput(''); // Start fresh
    
    // For Storyboard, we buffer the output because incomplete JSON is invalid.
    // For others, we stream directly to `output`
    let buffer = '';

    try {
      const result = await streamModuleContent(
        module.id, 
        textInput, 
        imageFile,
        (chunk) => {
            buffer += chunk;
            // Only update live output for text modules
            if (module.id !== ModuleId.STORYBOARD) {
                setOutput(buffer);
            }
        }
      );
      
      onResultGenerated(result);
      processOutput(result);
      setTextInput(''); // Clear input on success
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setOutput(`<div class="text-red-400">Error: ${err.message}</div>`);
    } finally {
      setLoading(false);
      setThinkingState('complete');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  // --- Storyboard Logic ---
  const handleEditFrame = (index: number) => {
    setEditingFrameIndex(index);
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
    const frame = editingFrameIndex === index ? editedFrameData! : storyboardData[index];
    setRegeneratingIndex(index);
    try {
      const specs = `${frame.shotType}, ${frame.cameraMovement}, ${frame.composition}`;
      const newSvg = await generateSingleFrame(frame.description, specs);
      const newData = [...storyboardData];
      if (editingFrameIndex === index) setEditedFrameData({ ...frame, svg: newSvg });
      else {
        newData[index] = { ...frame, svg: newSvg };
        setStoryboardData(newData);
        if (onUpdateHistory) onUpdateHistory(JSON.stringify(newData));
      }
    } catch (e) { alert("Failed to regenerate."); } 
    finally { setRegeneratingIndex(null); }
  };

  const handleGenerateRealImage = async (index: number) => {
    const frame = storyboardData[index];
    setGeneratingImageIndex(index);
    try {
      const prompt = `Cinematic shot, ${frame.shotType}. ${frame.description}. Lighting: ${frame.lightingNotes}. Style: ${frame.composition}. Photorealistic 8k.`;
      const base64Image = await generateCinematicImage(prompt, apiKey);
      const newData = [...storyboardData];
      newData[index] = { ...frame, generatedImage: base64Image };
      setStoryboardData(newData);
      if (onUpdateHistory) onUpdateHistory(JSON.stringify(newData));
    } catch (e) { alert("Image gen failed."); }
    finally { setGeneratingImageIndex(null); }
  };

  // --- Exports ---
  const handleExportPDF = async () => {
    if (!storyboardRef.current || !window.jspdf) return;
    setExporting(true);
    try {
       const { jsPDF } = window.jspdf;
       const doc = new jsPDF('p', 'mm', 'a4');
       const els = storyboardRef.current.querySelectorAll('.storyboard-frame');
       for (let i = 0; i < els.length; i++) {
         if (i > 0) doc.addPage();
         const canvas = await window.html2canvas(els[i] as HTMLElement, { scale: 2, backgroundColor: '#ffffff' });
         const imgData = canvas.toDataURL('image/jpeg', 0.9);
         doc.addImage(imgData, 'JPEG', 10, 10, 190, 0); // approx A4 width fit
       }
       doc.save('OBSCURA_Storyboard.pdf');
    } catch(e) { console.error(e); }
    finally { setExporting(false); }
  };

  // --- Renderers ---
  const renderContent = () => {
    if (!output && !storyboardData.length && thinkingState === 'idle') {
       return (
         <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-50 pb-20">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={module.icon} /></svg>
            <p className="text-sm">Enter a prompt to begin</p>
         </div>
       );
    }

    return (
      <div className="max-w-4xl mx-auto w-full pb-32 pt-8">
        
        {/* Thinking Indicator */}
        {thinkingState !== 'idle' && (
           <div className={`mb-8 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg p-4 flex items-center gap-4 shadow-lg transition-all duration-500 transform ${isFadingOut ? 'opacity-0 -translate-y-4 max-h-0 mb-0 py-0 overflow-hidden' : 'opacity-100 max-h-32'}`}>
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                 {thinkingState === 'complete' ? (
                   <div className="text-[var(--accent)] animate-scale-in">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   </div>
                 ) : (
                   <>
                     <div className="absolute inset-0 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                     <div className="text-[10px] font-bold text-[var(--accent)]">{Math.round((thinkingStepIndex + 1) / module.steps.length * 100)}%</div>
                   </>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                 <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-1">
                    {thinkingState === 'complete' ? 'Protocol Executed' : 'Processing Protocol'}
                 </h4>
                 <div className="flex items-center gap-2">
                   <span className="text-sm text-[var(--text-primary)] font-mono truncate">
                      {thinkingState === 'complete' ? 'Analysis Complete' : `${module.steps[thinkingStepIndex]}...`}
                   </span>
                   {thinkingState === 'processing' && <span className="animate-pulse text-[var(--accent)]">_</span>}
                 </div>
              </div>
              {/* Progress Steps Visualizer */}
              <div className="hidden md:flex gap-1 shrink-0">
                 {module.steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 w-6 rounded-full transition-colors duration-300 ${
                          thinkingState === 'complete' || idx <= thinkingStepIndex 
                          ? 'bg-[var(--accent)]' 
                          : 'bg-[var(--bg-element)]'
                      }`}
                    />
                 ))}
              </div>
           </div>
        )}

        {/* Text Output */}
        {output && module.id !== ModuleId.STORYBOARD && (
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-8 shadow-sm animate-slide-up">
             <div 
               className="prose prose-invert max-w-none text-[var(--text-secondary)] font-inter text-sm leading-7"
               dangerouslySetInnerHTML={{ __html: output }}
             />
          </div>
        )}

        {/* Storyboard Output */}
        {storyboardData.length > 0 && (
          <div ref={storyboardRef} className="space-y-8 animate-slide-up">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Storyboard Sequence</h3>
                <button onClick={handleExportPDF} disabled={exporting} className="text-xs bg-[var(--text-primary)] text-[var(--bg-panel)] px-3 py-1.5 rounded-md font-medium hover:opacity-80 transition-opacity">
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {storyboardData.map((frame, idx) => {
                 const isEditing = editingFrameIndex === idx;
                 const data = isEditing ? editedFrameData! : frame;
                 const isBusy = regeneratingIndex === idx || generatingImageIndex === idx;

                 return (
                   <div key={idx} className="storyboard-frame bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm hover:border-[var(--text-secondary)] transition-all group">
                      
                      {/* Visual */}
                      <div className="aspect-video bg-white relative flex items-center justify-center overflow-hidden">
                         {isBusy && (
                           <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                           </div>
                         )}
                         
                         {data.generatedImage ? (
                           <img src={data.generatedImage} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <div className="p-4 w-full h-full" dangerouslySetInnerHTML={{ __html: data.svg }} />
                         )}

                         {/* Overlay Controls */}
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!data.generatedImage && (
                              <button onClick={() => handleGenerateRealImage(idx)} className="bg-black/70 text-white p-1.5 rounded-md hover:bg-black" title="Render AI Image">
                                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                              </button>
                            )}
                         </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 text-sm">
                         {isEditing ? (
                           <div className="space-y-2">
                             <textarea 
                               className="w-full bg-[var(--bg-element)] text-[var(--text-primary)] p-2 rounded text-xs border border-[var(--border-subtle)] outline-none" 
                               rows={3} 
                               value={data.description} 
                               onChange={e => setEditedFrameData({...data, description: e.target.value})}
                             />
                             <div className="flex gap-2 text-xs">
                               <button onClick={() => handleRegenerateFrame(idx)} className="flex-1 bg-[var(--bg-element)] py-1 rounded text-[var(--text-primary)]">Redraw</button>
                               <button onClick={handleSaveEdit} className="flex-1 bg-[var(--text-primary)] text-[var(--bg-panel)] py-1 rounded">Save</button>
                             </div>
                           </div>
                         ) : (
                           <>
                             <div className="flex justify-between items-start mb-2">
                               <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Shot {idx+1} • {data.shotType}</span>
                               <button onClick={() => handleEditFrame(idx)} className="text-[var(--accent)] text-xs hover:underline">Edit</button>
                             </div>
                             <p className="text-[var(--text-primary)] leading-snug">{data.description}</p>
                             <div className="mt-3 text-[10px] text-[var(--text-muted)] font-mono">
                               {data.focalLength} | {data.cameraMovement}
                             </div>
                           </>
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

  // --- Input Command Bar ---
  return (
    <div className="flex flex-col h-full relative">
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 custom-scrollbar">
        {renderContent()}
      </div>

      {/* Floating Command Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[var(--bg-studio)] via-[var(--bg-studio)] to-transparent">
        <div className="max-w-3xl mx-auto relative group">
           
           {/* Image Preview Tag */}
           {imagePreview && (
             <div className="absolute bottom-full left-0 mb-2 bg-[var(--bg-element)] border border-[var(--border-subtle)] rounded-lg p-2 flex items-center gap-2">
               <img src={imagePreview} className="w-8 h-8 rounded object-cover" />
               <button onClick={() => {setImageFile(null); setImagePreview(null);}} className="text-[var(--text-primary)] hover:text-red-400">✕</button>
             </div>
           )}

           <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-xl p-1 focus-within:ring-1 focus-within:ring-[var(--border-subtle)] transition-all">
             
             {/* Description Text */}
             <div className="px-4 pt-2 text-[10px] text-[var(--text-muted)] opacity-50 font-medium tracking-wide">
               {module.description}
             </div>

             <div className="flex items-end p-1">
                 {/* Upload Button */}
                 {module.requiresImage && (
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                     title="Upload Image"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </button>
                 )}
                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

                 {/* Text Area */}
                 <textarea 
                   value={textInput}
                   onChange={(e) => setTextInput(e.target.value)}
                   onKeyDown={handleKeyDown}
                   placeholder={module.requiresText ? `Ask ${module.title}...` : "Describe your vision..."}
                   className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm p-3 outline-none resize-none max-h-32 min-h-[44px]"
                   rows={1}
                   style={{ height: 'auto', minHeight: '44px' }}
                 />

                 {/* Send Button */}
                 <button 
                   onClick={handleExecute}
                   disabled={loading || (!textInput.trim() && !imageFile)}
                   className={`p-2 m-1 rounded-xl transition-all ${
                      textInput.trim() || imageFile 
                        ? 'bg-[var(--text-primary)] text-[var(--bg-panel)] hover:opacity-90' 
                        : 'bg-[var(--bg-element)] text-[var(--text-muted)] cursor-not-allowed'
                   }`}
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                   </svg>
                 </button>
             </div>
           </div>
           
           <div className="text-center mt-2">
             <p className="text-[10px] text-[var(--text-muted)]">
               {module.id === ModuleId.STORYBOARD ? "AI generates 4-6 frames. Results may vary." : "AI can make mistakes. Verify important info."}
             </p>
           </div>
        </div>
      </div>

    </div>
  );
};

export default ActiveModule;