import React from 'react';

const Support: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in text-center pt-10 pb-20">
      <div className="mb-8 flex justify-center">
         <div className="h-20 w-20 bg-[#0A0A0A] border border-neutral-700 rounded-full flex items-center justify-center text-[#FFD700]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
         </div>
      </div>
      
      <h2 className="text-4xl font-cinzel text-white mb-4">Technical Support</h2>
      <p className="text-neutral-400 font-inter mb-12">
        Encountering a glitch in the matrix? Our engineering team is standing by.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <a href="mailto:support@obscura.ai" className="block bg-[#0A0A0A] border border-neutral-800 p-8 rounded hover:border-[#FFD700] transition-all group">
           <h3 className="text-xl font-cinzel text-white mb-2 group-hover:text-[#FFD700]">Email Support</h3>
           <p className="text-neutral-500 text-sm mb-4">For general inquiries, bug reports, and feature requests.</p>
           <span className="text-[#FFD700] text-xs tracking-widest uppercase">support@obscura.ai</span>
        </a>

        <a href="https://github.com" target="_blank" rel="noreferrer" className="block bg-[#0A0A0A] border border-neutral-800 p-8 rounded hover:border-[#FFD700] transition-all group">
           <h3 className="text-xl font-cinzel text-white mb-2 group-hover:text-[#FFD700]">Documentation</h3>
           <p className="text-neutral-500 text-sm mb-4">View technical documentation and release notes.</p>
           <span className="text-[#FFD700] text-xs tracking-widest uppercase">View Docs</span>
        </a>
      </div>

      <div className="mt-12 p-6 border border-neutral-800 rounded">
        <p className="text-neutral-600 text-xs font-mono">
          OBSCURA.AI v1.0.4 (Beta) <br/>
          System Status: <span className="text-green-500">OPERATIONAL</span>
        </p>
      </div>
    </div>
  );
};

export default Support;