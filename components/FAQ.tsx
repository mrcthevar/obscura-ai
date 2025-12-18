
import React from 'react';

const FAQ: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20 px-6">
      <h2 className="text-4xl font-cinzel text-[var(--text-primary)] mb-2">F.A.Q.</h2>
      <p className="text-[var(--text-secondary)] font-inter mb-12">Frequently Asked Questions regarding system operations.</p>

      <div className="space-y-6">
        
        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-8 rounded-[2rem] hover:border-[var(--accent)]/40 transition-all group shadow-sm">
          <h3 className="text-lg font-cinzel text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors">Is OBSCURA.AI free to use?</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-light">
            The application interface is free to access. However, because it utilizes Google's advanced Gemini 3 Pro models, it requires a valid API connection. Your keys remain stored within your local environment for absolute privacy.
          </p>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-8 rounded-[2rem] hover:border-[var(--accent)]/40 transition-all group shadow-sm">
          <h3 className="text-lg font-cinzel text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors">Where is my data stored?</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-light">
            OBSCURA.AI operates on a <strong className="text-[var(--text-primary)]">Local-First</strong> architecture. Your keys, chat history, and results are stored locally or synced with your personal Google Drive. No data is harvested by central servers.
          </p>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-8 rounded-[2rem] hover:border-[var(--accent)]/40 transition-all group shadow-sm">
          <h3 className="text-lg font-cinzel text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors">Why does the export look different?</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-light">
            The app interface is optimized for screen viewing (high contrast). However, Storyboard exports (PDF) are rendered in a clean "Production White" style to ensure legibility when printed for the film set.
          </p>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-8 rounded-[2rem] hover:border-[var(--accent)]/40 transition-all group shadow-sm">
          <h3 className="text-lg font-cinzel text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors">Can I use results commercially?</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-light">
            AI-generated artwork copyright laws vary by region. Generally, these results are intended for internal pre-production, planning, and visualization purposes within your professional workflow.
          </p>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-8 rounded-[2rem] hover:border-[var(--accent)]/40 transition-all group shadow-sm">
          <h3 className="text-lg font-cinzel text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors">Connection Issues?</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-light">
            Ensure your environment has access to the <code className="bg-[var(--bg-studio)] px-1 rounded">gemini-3-pro-preview</code> model. You can verify your status at the <a href="https://aistudio.google.com/" target="_blank" className="text-[var(--accent)] underline underline-offset-4">AI Studio Portal</a>.
          </p>
        </div>

      </div>
    </div>
  );
};

export default FAQ;
