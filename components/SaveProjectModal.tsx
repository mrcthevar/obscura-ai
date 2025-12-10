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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0A0A0A] border border-neutral-700 w-full max-w-md p-8 shadow-[0_0_40px_rgba(255,215,0,0.1)] rounded relative">
        <h3 className="text-2xl font-cinzel text-white mb-6 border-b border-neutral-800 pb-4">
          Save Project to Drive
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
              Project Codename
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. BLADE RUNNER STUDY"
              autoFocus
              className="w-full bg-[#050505] border border-neutral-700 text-white px-4 py-3 focus:outline-none focus:border-[#FFD700] transition-colors font-mono text-sm"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors font-inter text-xs tracking-wider"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!projectName.trim()}
              className="flex-1 px-4 py-3 bg-[#FFD700] text-black font-bold hover:bg-white transition-colors font-inter text-xs tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              INITIATE SAVE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveProjectModal;