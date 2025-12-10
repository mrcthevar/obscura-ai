import React from 'react';
import { MODULES } from '../constants';

const Guide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <h2 className="text-4xl font-cinzel text-white mb-2">Operator's Manual</h2>
      <p className="text-neutral-400 font-inter mb-12">Protocol for the Cinematic Intelligence Suite.</p>

      <div className="space-y-12">
        {/* General Workflow */}
        <section className="bg-[#0A0A0A] border border-neutral-800 p-8 rounded-lg">
          <h3 className="text-2xl font-cinzel text-[#FFD700] mb-4">Core Workflow</h3>
          <ol className="list-decimal pl-5 space-y-4 text-neutral-300 font-inter leading-relaxed">
            <li>
              <strong className="text-white">Select a Module:</strong> Choose the intelligence tool relevant to your current production phase (Pre-production, Production, or Post).
            </li>
            <li>
              <strong className="text-white">Input Data:</strong> Upload reference images or enter text descriptions/scripts depending on the module's requirement.
            </li>
            <li>
              <strong className="text-white">Execute:</strong> Click the <span className="text-[#FFD700] font-bold text-xs uppercase">EXECUTE</span> button to initialize the AI analysis.
            </li>
            <li>
              <strong className="text-white">Review & Export:</strong> Analyze the output. For Storyboards, use the edit/regenerate tools and export to PDF.
            </li>
          </ol>
        </section>

        {/* Module Specific Guides */}
        <div className="grid grid-cols-1 gap-8">
          {MODULES.map((mod) => (
            <div key={mod.id} className="border-t border-neutral-800 pt-8">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-2 bg-neutral-900 border border-neutral-700 text-[#FFD700] rounded">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mod.icon} />
                    </svg>
                 </div>
                 <h3 className="text-xl font-cinzel text-white">{mod.title}</h3>
              </div>
              
              <div className="pl-14">
                <p className="text-neutral-500 mb-4 italic">{mod.description}</p>
                
                <div className="bg-[#0A0A0A] p-6 rounded border border-neutral-900">
                  <h4 className="text-xs font-bold text-[#FFD700] uppercase tracking-widest mb-3">Usage Instructions</h4>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    {mod.id === 'LUX' && (
                      <>
                        <li>• <strong>Input:</strong> Upload a reference image (film still, painting, or photo).</li>
                        <li>• <strong>Output:</strong> Detailed lighting diagram breakdown, color temperature analysis, and fixture recommendations.</li>
                        <li>• <strong>Tip:</strong> Use high-contrast images for better shadow analysis.</li>
                      </>
                    )}
                    {mod.id === 'STORYBOARD' && (
                      <>
                        <li>• <strong>Input:</strong> Describe the scene action, camera angle, and mood in text.</li>
                        <li>• <strong>Output:</strong> 4-6 generated sketch frames with technical specs.</li>
                        <li>• <strong>Editing:</strong> Click "Edit" on any frame to tweak the description, then "Regenerate" to redraw just that frame.</li>
                        <li>• <strong>Export:</strong> Use "Export PDF Dossier" for a print-ready document or "Export Full JPG" for a single image strip.</li>
                      </>
                    )}
                    {mod.id === 'MASTERCLASS' && (
                      <>
                        <li>• <strong>Input:</strong> Enter a specific Film Title (e.g., "Blade Runner") or Director Name.</li>
                        <li>• <strong>Output:</strong> A deep-dive academic dossier covering visual language, philosophy, and techniques.</li>
                      </>
                    )}
                    {mod.id === 'SUBTEXT' && (
                      <>
                        <li>• <strong>Input:</strong> Paste a scene from a script or a dialogue exchange.</li>
                        <li>• <strong>Output:</strong> Analysis of the "Invisible Script," emotional beats, and a suggested shot list.</li>
                      </>
                    )}
                    {mod.id === 'KINETIC' && (
                      <>
                        <li>• <strong>Input:</strong> Describe the physical action or tension of a scene.</li>
                        <li>• <strong>Output:</strong> Camera rig recommendations (Steadicam vs. Handheld) and blocking strategies.</li>
                      </>
                    )}
                    {mod.id === 'GENESIS' && ( // VISIONARY
                      <>
                        <li>• <strong>Input:</strong> Upload a style reference image AND provide a text description of your subject.</li>
                        <li>• <strong>Output:</strong> A high-fidelity Midjourney v6 prompt combining your subject with the image's aesthetic DNA.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Guide;