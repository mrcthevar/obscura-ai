import React from 'react';

const Support: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in text-center pt-20 pb-24 px-6">
      <div className="mb-10 flex justify-center">
         <div className="h-24 w-24 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-[2.5rem] flex items-center justify-center text-[var(--accent)] shadow-xl">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
         </div>
      </div>
      
      <h2 className="text-5xl font-cinzel text-[var(--text-primary)] mb-4 tracking-tighter">Technical Support</h2>
      <p className="text-[var(--text-secondary)] font-inter mb-16 leading-relaxed font-light">
        Encountering a glitch in the studio matrix? Our systems engineering team is standing by to resolve any neural uplink disruptions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <a href="mailto:support@obscura.ai" className="block bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-10 rounded-[2.5rem] hover:border-[var(--accent)]/40 transition-all group shadow-sm">
           <h3 className="text-xl font-cinzel text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors">Direct Support</h3>
           <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed font-light">For bug reports, technical inquiries, and feature requests.</p>
           <span className="text-[var(--accent)] text-[10px] font-black tracking-[0.3em] uppercase">support@obscura.ai</span>
        </a>

        <a href="#" target="_blank" rel="noreferrer" className="block bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-10 rounded-[2.5rem] hover:border-[var(--accent)]/40 transition-all group shadow-sm">
           <h3 className="text-xl font-cinzel text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors">Knowledge Base</h3>
           <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed font-light">View technical documentation, API logs, and release notes.</p>
           <span className="text-[var(--accent)] text-[10px] font-black tracking-[0.3em] uppercase">Open Archives</span>
        </a>
      </div>

      <div className="mt-16 p-8 border border-[var(--border-subtle)] rounded-[2rem] bg-[var(--bg-studio)] shadow-inner inline-block">
        <p className="text-[var(--text-muted)] text-[9px] font-mono tracking-widest uppercase">
          OBSCURA.AI CORE v1.0.4 <br/>
          System Status: <span className="text-green-500 font-bold ml-2">● OPERATIONAL</span>
        </p>
      </div>
    </div>
  );
};

export default Support;