
import React from 'react';
import { MODULES } from '../constants';

const Guide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20 px-6">
      <h2 className="text-4xl font-cinzel text-[var(--text-primary)] mb-2">Operator's Manual</h2>
      <p className="text-[var(--text-secondary)] font-inter mb-12">Protocol for the Cinematic Intelligence Suite.</p>

      <div className="space-y-12">
        {/* General Workflow */}
        <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-8 rounded-[2rem] shadow-sm">
          <h3 className="text-2xl font-cinzel text-[var(--accent)] mb-4">Core Workflow</h3>
          <ol className="list-decimal pl-5 space-y-4 text-[var(--text-secondary)] font-inter leading-relaxed">
            <li>
              <strong className="text-[var(--text-primary)]">Select a Module:</strong> Choose the intelligence tool relevant to your current production phase.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Input Data:</strong> Upload reference images or enter text descriptions/scripts.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Execute:</strong> Click the <span className="text-[var(--accent)] font-bold text-xs uppercase">INITIALIZE</span> button.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Review & Export:</strong> Analyze the output. For Storyboards, use the edit/regenerate tools.
            </li>
          </ol>
        </section>

        {/* Module Specific Guides */}
        <div className="grid grid-cols-1 gap-8">
          {MODULES.map((mod) => (
            <div key={mod.id} className="border-t border-[var(--border-subtle)] pt-8">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] rounded-2xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mod.icon} />
                    </svg>
                 </div>
                 <h3 className="text-2xl font-cinzel text-[var(--text-primary)]">{mod.title}</h3>
              </div>
              
              <div className="md:pl-16">
                <p className="text-[var(--text-secondary)] mb-6 italic">{mod.description}</p>
                
                <div className="bg-[var(--bg-studio)] p-8 rounded-[1.5rem] border border-[var(--border-subtle)] shadow-inner">
                  <h4 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.3em] mb-4 font-mono">Usage Instructions</h4>
                  <ul className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {mod.id === 'LUX' && (
                      <>
                        <li>• <strong className="text-[var(--text-primary)]">Input:</strong> Upload a reference image (film still, painting, or photo).</li>
                        <li>• <strong className="text-[var(--text-primary)]">Output:</strong> Detailed lighting diagram breakdown and color analysis.</li>
                        <li>• <strong className="text-[var(--text-primary)]">Tip:</strong> Use high-contrast images for better shadow detection.</li>
                      </>
                    )}
                    {mod.id === 'STORYBOARD' && (
                      <>
                        <li>• <strong className="text-[var(--text-primary)]">Input:</strong> Describe the scene action and camera angle in text.</li>
                        <li>• <strong className="text-[var(--text-primary)]">Output:</strong> 4-6 generated sketch frames with technical specs.</li>
                        <li>• <strong className="text-[var(--text-primary)]">Editing:</strong> Click "Edit" to tweak descriptions or redraw frames.</li>
                      </>
                    )}
                    {mod.id === 'MASTERCLASS' && (
                      <>
                        <li>• <strong className="text-[var(--text-primary)]">Input:</strong> Enter a specific Film Title or Director Name.</li>
                        <li>• <strong className="text-[var(--text-primary)]">Output:</strong> A deep-dive academic dossier covering style and philosophy.</li>
                      </>
                    )}
                    {mod.id === 'SUBTEXT' && (
                      <>
                        <li>• <strong className="text-[var(--text-primary)]">Input:</strong> Paste a scene from a script or dialogue exchange.</li>
                        <li>• <strong className="text-[var(--text-primary)]">Output:</strong> Analysis of emotional beats and suggested shot lists.</li>
                      </>
                    )}
                    {mod.id === 'KINETIC' && (
                      <>
                        <li>• <strong className="text-[var(--text-primary)]">Input:</strong> Describe the action or tension of a scene.</li>
                        <li>• <strong className="text-[var(--text-primary)]">Output:</strong> Camera rig recommendations and blocking strategies.</li>
                      </>
                    )}
                    {mod.id === 'GENESIS' && (
                      <>
                        <li>• <strong className="text-[var(--text-primary)]">Input:</strong> Style reference image AND text description of subject.</li>
                        <li>• <strong className="text-[var(--text-primary)]">Output:</strong> Midjourney v6 prompt combining action with aesthetic DNA.</li>
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
