
import React, { useState } from 'react';

interface SaveProjectModalProps {
  onSave: (name: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const SaveProjectModal: React.FC<SaveProjectModalProps> = ({ onSave, onCancel, isOpen }) => {
  const [projectName, setProjectName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onSave(projectName);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div 
        className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] w-full max-w-lg p-12 shadow-[0_0_80px_var(--shadow-glow)] rounded-[3rem] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-3xl font-cinzel text-[var(--text-primary)] mb-8 border-b border-[var(--border-subtle)] pb-6 tracking-tight">
          Archive Project
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4 font-mono">
              Project Identifier
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. NEO_SEOUL_SCENE_01"
              autoFocus
              className="w-full bg-[var(--bg-studio)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-6 py-4 rounded-2xl focus:outline-none focus:border-[var(--accent)] transition-all font-mono text-sm shadow-inner"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-8 py-4 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] rounded-2xl transition-all font-bold text-[10px] tracking-[0.2em] uppercase"
            >
              ABORT
            </button>
            <button
              type="submit"
              disabled={!projectName.trim()}
              className="flex-1 px-8 py-4 bg-[var(--accent)] text-black font-black rounded-2xl hover:bg-white transition-all text-[10px] tracking-[0.2em] uppercase disabled:opacity-20 disabled:cursor-not-allowed shadow-xl active:scale-95"
            >
              SYNC VAULT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveProjectModal;
