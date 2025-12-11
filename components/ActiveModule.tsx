import React, { useState, useRef, useContext } from 'react';
import { ModuleDefinition, ModuleId, StoryboardFrame } from '../types';
import { generateModuleContent, generateSingleFrame } from '../services/geminiService';
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
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false); // Separate state for export loading
  const [output, setOutput] = useState<string | null>(null);
  const [storyboardData, setStoryboardData] = useState<StoryboardFrame[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Editing state for storyboard
  const [editingFrameIndex, setEditingFrameIndex] = useState<number | null>(null);
  const [editedFrameData, setEditedFrameData] = useState<StoryboardFrame | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  
  // Image Generation State
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyboardRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processOutput = (result: string) => {
    if (module.id === ModuleId.STORYBOARD) {
      try {
        const frames = JSON.parse(result);
        if (Array.isArray(frames)) {
          setStoryboardData(frames);
        } else {
           throw new Error("Invalid JSON format");
        }
      } catch (e) {
        console.error("Failed to parse storyboard JSON", e);
        setOutput("Error generating storyboard visual. Raw output: " + result);
      }
    } else {
      setOutput(result);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setOutput(null);
    setStoryboardData([]);
    setShowHistory(false);

    try {
      const result = await generateModuleContent(module.id, textInput, imageFile);
      onResultGenerated(result);
      processOutput(result);
    } catch (err: any) {
      setOutput(`<div class="text-red-500">System Failure: ${err.message}</div>`);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (result: string) => {
    setStoryboardData([]);
    processOutput(result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Storyboard Specific Handlers
  const handleEditFrame = (index: number) => {
    setEditingFrameIndex(index);
    setEditedFrameData({ ...storyboardData[index] });
  };

  const handleSaveEdit = () => {
    if (editingFrameIndex !== null && editedFrameData) {
      const newData = [...storyboardData];
      newData[editingFrameIndex] = editedFrameData;
      setStoryboardData(newData);
      
      // Persist changes
      if (onUpdateHistory) {
        onUpdateHistory(JSON.stringify(newData));
      }

      setEditingFrameIndex(null);
      setEditedFrameData(null);
    }
  };

  const handleRegenerateFrame = async (index: number) => {
    const frame = editingFrameIndex === index ? editedFrameData! : storyboardData[index];
    setRegeneratingIndex(index);
    try {
      const specs = `${frame.shotType}, ${frame.cameraMovement}, ${frame.composition}`;
      const newSvg = await generateSingleFrame(frame.description, specs);
      
      const newData = [...storyboardData];
      if (editingFrameIndex === index) {
        setEditedFrameData({ ...frame, svg: newSvg });
      } else {
        // Update main state if not in edit mode (unlikely flow but safe)
        newData[index] = { ...frame, svg: newSvg };
        setStoryboardData(newData);
        if (onUpdateHistory) onUpdateHistory(JSON.stringify(newData));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate frame.");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleGenerateRealImage = async (index: number) => {
    const frame = storyboardData[index];
    setGeneratingImageIndex(index);
    try {
      // Construct a rich prompt for the image generator
      const prompt = `Cinematic movie shot, ${frame.shotType}. ${frame.description}. 
      Lighting: ${frame.lightingNotes}. 
      Composition: ${frame.composition}, ${frame.cameraMovement}, ${frame.focalLength}. 
      Highly detailed, photorealistic, 8k resolution, dramatic lighting, movie still.`;

      const base64Image = await generateCinematicImage(prompt, apiKey);
      
      const newData = [...storyboardData];
      newData[index] = { ...frame, generatedImage: base64Image };
      setStoryboardData(newData);
      
      // Persist
      if (onUpdateHistory) {
        onUpdateHistory(JSON.stringify(newData));
      }

    } catch (e: any) {
      console.error(e);
      alert(`Failed to generate image: ${e.message || "Unknown error"}`);
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  const handleDownloadJPG = async (svgString: string, frameNumber: number) => {
    try {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800; // standard width
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/jpeg');
          a.download = `storyboard_frame_${frameNumber}.jpg`;
          a.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e) {
      console.error("JPG Download failed", e);
    }
  };

  const handleExportFullSectionJPG = async () => {
    if (!storyboardRef.current || !window.html2canvas) {
      alert("Export library not loaded.");
      return;
    }
    setExporting(true);

    try {
      // Clone the element to render off-screen with full height
      const original = storyboardRef.current;
      const clone = original.cloneNode(true) as HTMLElement;
      
      // Force styles on clone to ensure full capture
      clone.style.position = 'absolute';
      clone.style.top = '0';
      clone.style.left = '-9999px';
      clone.style.width = '1200px'; // High resolution fixed width
      clone.style.height = 'auto';
      clone.style.overflow = 'visible';
      clone.style.backgroundColor = '#ffffff'; // Ensure white background for export
      clone.style.zIndex = '-1';
      
      document.body.appendChild(clone);

      // Render the clone
      const canvas = await window.html2canvas(clone, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Cleanup
      document.body.removeChild(clone);

      // Download
      const image = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = image;
      link.download = `OBSCURA_Storyboard_Full.jpg`;
      link.click();

    } catch (e) {
      console.error("Full JPG Export failed", e);
      alert("Failed to export JPG.");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!storyboardRef.current || !window.jspdf || !window.html2canvas) {
      alert("PDF libraries not loaded.");
      return;
    }
    setExporting(true);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;

      // 1. Capture Header
      const headerEl = storyboardRef.current.querySelector('.storyboard-header') as HTMLElement;
      if (headerEl) {
        const canvas = await window.html2canvas(headerEl, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = pageWidth - (margin * 2);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'JPEG', margin, margin, pdfWidth, pdfHeight);
      }

      // 2. Capture Each Frame on a new page
      const frameEls = storyboardRef.current.querySelectorAll('.storyboard-frame');
      
      for (let i = 0; i < frameEls.length; i++) {
        doc.addPage(); // Start each frame on a fresh page for clean layout
        
        const frameEl = frameEls[i] as HTMLElement;
        const canvas = await window.html2canvas(frameEl, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = pageWidth - (margin * 2);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(imgData, 'JPEG', margin, margin, pdfWidth, pdfHeight);
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Frame ${i + 1} / ${frameEls.length} | Generated by OBSCURA.AI`, margin, pageHeight - 10);
      }
      
      doc.save('OBSCURA_Storyboard_Dossier.pdf');
    } catch (e) {
      console.error("PDF Export failed", e);
      alert("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  const renderOutput = () => {
    if (loading) {
      return (
        <div className="bg-[#0A0A0A] rounded-lg flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-12 h-12 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#FFD700] font-cinzel animate-pulse">Analyzing...</p>
        </div>
      );
    }

    if (module.id === ModuleId.STORYBOARD && storyboardData.length > 0) {
      return (
        <div className="space-y-8 animate-fade-in pb-10 relative">
           {/* Export Overlay */}
           {exporting && (
             <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center rounded">
                <div className="w-10 h-10 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#FFD700] font-cinzel">GENERATING HIGH-RES EXPORT...</p>
             </div>
           )}

           {/* Actions Bar (Toolbar) */}
           <div className="flex flex-col md:flex-row justify-between items-center bg-[#0A0A0A] p-4 border border-neutral-800 rounded gap-4 mb-4">
             <div className="text-[#FFD700] font-cinzel text-sm">
               SCENE: {textInput.substring(0, 40)}...
             </div>
             <div className="flex space-x-4">
               <button 
                 onClick={handleExportFullSectionJPG}
                 className="flex items-center space-x-2 px-4 py-2 border border-neutral-600 text-neutral-400 hover:border-[#FFD700] hover:text-[#FFD700] transition-colors font-cinzel text-xs rounded"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 <span>EXPORT FULL JPG</span>
               </button>
               <button 
                 onClick={handleDownloadPDF}
                 className="flex items-center space-x-2 px-4 py-2 border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-colors font-cinzel text-xs rounded"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 <span>EXPORT PDF DOSSIER</span>
               </button>
             </div>
           </div>

           {/* Professional Storyboard Grid - White Production Layout */}
           <div ref={storyboardRef} className="w-full bg-white rounded-lg border border-gray-200 p-8 min-h-screen text-gray-900 shadow-sm">
              <div className="storyboard-header text-center pb-8 mb-8 border-b border-gray-200">
                 <h2 className="font-sans text-3xl font-black text-gray-900 tracking-tight uppercase">Storyboard Production</h2>
                 <p className="font-mono text-xs mt-2 text-gray-500 uppercase tracking-widest">
                   Project: {textInput.substring(0, 30)}... | Generated by OBSCURA.AI
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto">
                {storyboardData.map((frame, idx) => {
                   const isEditing = editingFrameIndex === idx;
                   const data = isEditing ? editedFrameData! : frame;
                   const isRegenerating = regeneratingIndex === idx;
                   const isGeneratingImage = generatingImageIndex === idx;

                   return (
                    <div key={idx} className="storyboard-frame bg-white border border-gray-300 rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      
                      {/* Frame / SVG Area */}
                      <div className="bg-gray-50 border-b border-gray-200 p-4 relative aspect-video flex items-center justify-center group overflow-hidden">
                          {/* Badge */}
                          <div className="absolute top-2 right-2 bg-white px-3 py-1 border border-gray-400 text-sm font-bold text-gray-800 shadow-sm z-10">
                            SHOT {idx + 1}: {data.shotType}
                          </div>

                          {/* Loader */}
                          {(isRegenerating || isGeneratingImage) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20">
                               <div className="flex flex-col items-center">
                                 <div className="w-8 h-8 border-2 border-gray-800 border-t-transparent rounded-full animate-spin mb-2"></div>
                                 <span className="text-xs font-mono font-bold text-gray-800">
                                   {isGeneratingImage ? "RENDERING AI..." : "REGENERATING SKETCH..."}
                                 </span>
                               </div>
                            </div>
                          )}

                          {/* Display Image (Generated) or SVG (Sketch) */}
                          {data.generatedImage ? (
                            <div className="w-full h-full relative">
                               <img src={data.generatedImage} alt={data.description} className="w-full h-full object-cover" />
                               {/* Toggle back to sketch button */}
                               <button 
                                 onClick={() => {
                                   const newData = [...storyboardData];
                                   delete newData[idx].generatedImage;
                                   setStoryboardData(newData);
                                 }}
                                 className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 hover:bg-black"
                               >
                                 Show Sketch
                               </button>
                            </div>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: data.svg }} className="w-full h-full object-contain" />
                          )}
                          
                          {/* Hover Actions */}
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                             {!data.generatedImage && !isGeneratingImage && (
                               <button 
                                 onClick={() => handleGenerateRealImage(idx)}
                                 className="bg-purple-900 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider hover:bg-purple-800 rounded shadow flex items-center gap-1"
                               >
                                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                 Render
                               </button>
                             )}
                             
                             <button 
                               onClick={() => handleDownloadJPG(data.svg, idx + 1)}
                               className="bg-gray-800 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider hover:bg-gray-700 rounded shadow"
                             >
                               Save JPG
                             </button>
                          </div>
                      </div>

                      {/* Card Content */}
                      {isEditing ? (
                         <div className="p-4 bg-gray-50 space-y-3 flex-grow">
                           <div>
                             <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Description</label>
                             <textarea 
                               className="w-full p-2 border border-gray-300 rounded text-sm focus:border-black outline-none bg-white text-black"
                               rows={3}
                               value={data.description}
                               onChange={(e) => setEditedFrameData({...data, description: e.target.value})}
                             />
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                             <div>
                               <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Shot Type</label>
                               <input 
                                 className="w-full p-2 border border-gray-300 rounded text-xs focus:border-black outline-none bg-white text-black"
                                 value={data.shotType}
                                 onChange={(e) => setEditedFrameData({...data, shotType: e.target.value})} 
                               />
                             </div>
                             <div>
                               <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Movement</label>
                               <input 
                                 className="w-full p-2 border border-gray-300 rounded text-xs focus:border-black outline-none bg-white text-black"
                                 value={data.cameraMovement}
                                 onChange={(e) => setEditedFrameData({...data, cameraMovement: e.target.value})} 
                               />
                             </div>
                           </div>
                           <div className="flex space-x-2 pt-2">
                              <button onClick={() => handleRegenerateFrame(idx)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-100 py-2 text-xs font-bold text-gray-800 rounded">
                                REGENERATE
                              </button>
                              <button onClick={handleSaveEdit} className="flex-1 bg-gray-900 text-white hover:bg-black py-2 text-xs font-bold rounded">
                                SAVE
                              </button>
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col flex-grow">
                           {/* Description */}
                           <div className="p-4 text-gray-800 text-sm leading-relaxed border-b border-gray-100 flex-grow min-h-[4rem]">
                             {data.description}
                           </div>

                           {/* Technical Specs */}
                           <div className="px-4 pt-3 pb-1 text-gray-600 text-[11px] font-mono uppercase tracking-wide flex flex-wrap gap-2">
                             <span>LENS: <span className="font-bold text-gray-900">{data.focalLength}</span></span>
                             <span className="text-gray-300">|</span>
                             <span>CAM: <span className="font-bold text-gray-900">{data.cameraMovement}</span></span>
                           </div>

                           {/* Notes */}
                           <div className="px-4 pb-4 text-gray-500 italic text-[11px] mt-1 border-t border-gray-50 pt-2">
                             {data.lightingNotes}
                           </div>

                           <button 
                             onClick={() => handleEditFrame(idx)}
                             className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-black self-end m-2 px-2"
                           >
                             Edit
                           </button>
                         </div>
                       )}
                    </div>
                   );
                })}
              </div>
           </div>
        </div>
      );
    }

    if (output) {
      return (
        <div 
          className="prose prose-invert max-w-none font-inter text-neutral-300 bg-[#0A0A0A] p-8 border border-neutral-800 animate-fade-in"
          dangerouslySetInnerHTML={{ __html: output }}
        />
      );
    }

    return (
      <div className="bg-[#0A0A0A] h-64 flex flex-col items-center justify-center border border-neutral-800 text-neutral-600 font-inter space-y-2 rounded-lg">
        <span className="text-[#FFD700] text-opacity-50 text-4xl font-thin">+</span>
        <span>Awaiting Input. Run this module to generate intelligence.</span>
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto pb-20 relative">
      {/* Header */}
      <div className="flex items-center space-x-4 border-b border-neutral-900 pb-6">
        <div className="p-3 bg-neutral-900 border border-neutral-700 text-[#FFD700]">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={module.icon} />
           </svg>
        </div>
        <div>
          <h2 className="text-3xl font-cinzel text-white">{module.title}</h2>
          <p className="text-neutral-500 font-inter">{module.subtitle}</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          
          {module.requiresImage && (
            <div 
              className="bg-[#0A0A0A] border border-neutral-700 aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700] transition-colors relative overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <span className="text-4xl block mb-2 text-neutral-600">+</span>
                  <span className="text-xs text-neutral-500 uppercase tracking-widest">Upload Reference</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          )}

          {module.requiresText && (
            <textarea
              className="w-full h-40 bg-[#0A0A0A] border border-neutral-700 p-4 text-white focus:border-[#FFD700] focus:outline-none resize-none font-inter text-sm"
              placeholder={module.id === ModuleId.GENESIS ? "Describe the context..." : "Enter scene description, script, or query..."}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          )}

          <button
            onClick={handleExecute}
            disabled={loading || (module.requiresText && !textInput) || (module.requiresImage && !imageFile)}
            className="w-full bg-[#FFD700] text-black font-cinzel font-bold py-4 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            EXECUTE
          </button>
        </div>

        {/* Output Section */}
        <div className="md:col-span-2 space-y-8">
           {renderOutput()}

           {/* History Section */}
           {history.length > 0 && (
             <div className="border-t border-neutral-900 pt-6">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center text-xs text-neutral-500 hover:text-[#FFD700] transition-colors tracking-widest uppercase mb-4"
                >
                  <svg className={`w-4 h-4 mr-2 transition-transform ${showHistory ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Previous Transmissions ({history.length})
                </button>
                
                {showHistory && (
                  <div className="space-y-2 animate-fade-in">
                    {history.map((item, index) => (
                      <div 
                        key={index} 
                        onClick={() => loadFromHistory(item)}
                        className="p-4 bg-[#0A0A0A] border border-neutral-800 hover:border-[#FFD700] cursor-pointer transition-all group"
                      >
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-[#FFD700] font-cinzel text-xs">LOG #{history.length - index}</span>
                           <span className="text-neutral-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">RESTORE</span>
                         </div>
                         <div className="text-neutral-500 text-xs font-mono truncate">
                           {item.replace(/<[^>]*>?/gm, '').substring(0, 80)}...
                         </div>
                      </div>
                    )).reverse()}
                  </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ActiveModule;