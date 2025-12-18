
import React, { useState, useEffect } from 'react';
import { UserProfile, ModuleId, ProjectData, DriveFile } from '../types';
import { MODULES } from '../constants';
import ActiveModule from './ActiveModule';
import Guide from './Guide';
import FAQ from './FAQ';
import Support from './Support';
import SaveProjectModal from './SaveProjectModal';
import Tooltip from './Tooltip';
import TourGuide from './TourGuide';
import { initDriveAuth, requestDriveToken, saveProjectToDrive, listProjectsFromDrive, loadProjectFromDrive, hasDriveToken } from '../services/googleDriveService';
import { useAutoSave } from '../hooks/useAutoSave';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<string>('HOME');
  const [moduleHistory, setModuleHistory] = useState<Record<string, string[]>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('obscura_theme') as 'dark' | 'light') || 'dark';
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [projectList, setProjectList] = useState<DriveFile[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('obscura_theme', theme);
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      if (hasDriveToken()) setIsDriveConnected(true);
      try { await initDriveAuth(() => setIsDriveConnected(true)); } catch (e) {}
    };
    init();
    
    try {
      const stored = localStorage.getItem('obscura_module_history');
      if (stored) setModuleHistory(JSON.parse(stored));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (currentProject) {
      setCurrentProject(prev => prev ? { ...prev, moduleHistory } : null);
    }
  }, [moduleHistory]);

  useAutoSave(currentProject, isDriveConnected, setAutoSaveStatus);

  useEffect(() => {
    const mod = MODULES.find(m => m.id === currentView);
    document.title = mod ? `OBSCURA | ${mod.title}` : 'OBSCURA Studio';
    
    if (window.innerWidth < 768 && currentView !== 'HOME') setIsSidebarOpen(false);
  }, [currentView]);

  const handleModuleResult = (moduleId: ModuleId, result: string) => {
    setModuleHistory(prev => {
      const current = prev[moduleId] || [];
      const updated = { ...prev, [moduleId]: [...current, result] };
      localStorage.setItem('obscura_module_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateLastLog = (moduleId: ModuleId, updatedResult: string) => {
     setModuleHistory(prev => {
        const list = prev[moduleId] || [];
        if (list.length === 0) return prev;
        const newList = [...list];
        newList[newList.length - 1] = updatedResult;
        const updated = { ...prev, [moduleId]: newList };
        localStorage.setItem('obscura_module_history', JSON.stringify(updated));
        return updated;
     });
  };

  const handleCreateNewSave = async (name: string) => {
    setShowSaveModal(false);
    setIsLoadingDrive(true);
    try {
      const newProject: ProjectData = { name, lastModified: Date.now(), moduleHistory, version: '1.0' };
      const fileId = await saveProjectToDrive(newProject);
      setCurrentProject({ ...newProject, id: fileId });
      setAutoSaveStatus('saved');
    } catch (e) {
      alert("Save failed.");
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleLoadList = async () => {
    setIsLoadingDrive(true);
    try {
        const files = await listProjectsFromDrive();
        setProjectList(files);
        setShowLoadModal(true);
    } catch (e) {
        alert("Drive access error.");
    } finally {
        setIsLoadingDrive(false);
    }
  };

  const activeModule = MODULES.find(m => m.id === currentView);

  const cardStyle = `
    relative p-8 rounded-[2.5rem] transition-all duration-700 text-left group overflow-hidden
    bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-[2px]
    hover:border-[var(--accent)]/40 hover:shadow-[0_0_50px_var(--shadow-glow)]
  `;

  return (
    <div className="flex h-screen bg-[var(--bg-studio)] text-[var(--text-primary)] font-inter transition-all duration-500 overflow-hidden">
      <TourGuide />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside 
        id="sidebar-nav"
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-500 ease-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
        `}
      >
        <div className="h-24 flex items-center px-8">
          <div onClick={() => setCurrentView('HOME')} className="cursor-pointer flex items-center gap-4 group">
             <div className="w-10 h-10 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-black font-brand font-bold text-lg shadow-[0_0_25px_var(--shadow-glow)] group-hover:scale-110 transition-transform">O</div>
             <span className="font-brand font-bold tracking-[0.4em] text-sm text-[var(--text-primary)] uppercase">Obscura</span>
          </div>
        </div>

        <div className="px-6 mb-8 space-y-3">
           {currentProject ? (
             <div className="bg-[var(--bg-panel)] rounded-2xl p-5 border border-[var(--border-subtle)]">
               <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-black font-mono">Archive Active</div>
               <div className="text-sm font-semibold truncate mt-1">{currentProject.name}</div>
               <div className="flex items-center gap-2 mt-4">
                 <div className={`w-2 h-2 rounded-full ${autoSaveStatus === 'saved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--shadow-glow)]'}`}></div>
                 <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-wider">{autoSaveStatus}</span>
               </div>
             </div>
           ) : (
             <button 
                onClick={() => isDriveConnected ? setShowSaveModal(true) : requestDriveToken()}
                className="w-full py-3.5 bg-transparent border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
                {isDriveConnected ? 'Sync Vault' : 'Link Drive'}
             </button>
           )}
           <button 
              onClick={handleLoadList}
              className="w-full py-3.5 bg-transparent border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
           >
              Load Archive
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 py-4 border-t border-[var(--border-subtle)] custom-scrollbar">
           <button
              onClick={() => setCurrentView('HOME')}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-xs transition-all mb-4 ${
                currentView === 'HOME' 
                  ? 'bg-[var(--bg-panel)] text-[var(--accent)] font-bold border-l-4 border-[var(--accent)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
              }`}
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Home
           </button>

           <div className="px-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3 mt-6 font-mono">Neural Systems</div>
           {MODULES.map((mod) => (
             <Tooltip key={mod.id} content={mod.subtitle} position="right">
               <button
                 onClick={() => setCurrentView(mod.id)}
                 className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-xs transition-all ${
                   currentView === mod.id 
                     ? 'bg-[var(--bg-panel)] text-[var(--accent)] font-bold border-l-4 border-[var(--accent)]' 
                     : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
                 }`}
               >
                 <svg className={`w-4 h-4 transition-all duration-500 ${currentView === mod.id ? 'opacity-100' : 'opacity-20'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mod.icon} /></svg>
                 {mod.title}
               </button>
             </Tooltip>
           ))}

           <div className="px-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3 mt-10 font-mono">System Terminal</div>
           <button
              onClick={() => setCurrentView('GUIDE')}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-xs transition-all ${
                currentView === 'GUIDE' 
                  ? 'bg-[var(--bg-panel)] text-[var(--accent)] font-bold border-l-4 border-[var(--accent)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
              }`}
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Operator's Guide
           </button>
           <button
              onClick={() => setCurrentView('FAQ')}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-xs transition-all ${
                currentView === 'FAQ' 
                  ? 'bg-[var(--bg-panel)] text-[var(--accent)] font-bold border-l-4 border-[var(--accent)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
              }`}
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              F.A.Q.
           </button>
           <button
              onClick={() => setCurrentView('SUPPORT')}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-xs transition-all ${
                currentView === 'SUPPORT' 
                  ? 'bg-[var(--bg-panel)] text-[var(--accent)] font-bold border-l-4 border-[var(--accent)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
              }`}
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Support Uplink
           </button>
        </div>

        <div className="p-8 border-t border-[var(--border-subtle)] flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl bg-[var(--bg-studio)] border border-[var(--border-subtle)] flex items-center justify-center text-sm font-bold text-[var(--text-muted)] overflow-hidden shadow-2xl">
             {user.picture ? <img src={user.picture} alt="" className="w-full h-full object-cover" /> : user.name[0]}
           </div>
           <div className="flex-1 min-w-0 text-left">
             <div className="text-xs font-bold truncate">{user.name}</div>
             <button onClick={onLogout} className="text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-[0.3em] font-black mt-1">Disconnect</button>
           </div>
           <button onClick={() => setShowSettings(true)} className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0 bg-[var(--bg-studio)]">
         <div className="flex-1 overflow-y-auto relative custom-scrollbar">
           {isLoadingDrive && (
             <div className="absolute inset-0 bg-[var(--bg-studio)]/80 backdrop-blur-md z-50 flex items-center justify-center">
               <div className="w-12 h-12 border-2 border-[var(--border-subtle)] border-t-[var(--accent)] rounded-full animate-spin"></div>
             </div>
           )}

           {currentView === 'HOME' && (
             <div className="p-8 md:p-24 max-w-7xl mx-auto">
                <header className="mb-24 text-center md:text-left">
                   <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tighter animate-fade-in">
                     Cinematic Intelligence suite <span className="text-[var(--text-muted)] font-mono text-xl ml-4 select-none hidden md:inline">v1.0.4</span>
                   </h1>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 animate-slide-up">
                   {MODULES.map(mod => (
                     <button key={mod.id} onClick={() => setCurrentView(mod.id)} className={cardStyle}>
                        <div className="p-5 rounded-2xl bg-[var(--accent)]/5 text-[var(--accent)] w-fit mb-12 group-hover:scale-110 group-hover:bg-[var(--accent)]/10 transition-all duration-700 shadow-xl border border-transparent group-hover:border-[var(--accent)]/20">
                           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mod.icon} /></svg>
                        </div>
                        <div className="space-y-4">
                           <h3 className="text-3xl font-bold tracking-tighter group-hover:text-[var(--accent)] transition-colors duration-500">{mod.title}</h3>
                           <p className="text-sm text-[var(--text-secondary)] leading-relaxed min-h-[5rem] group-hover:text-[var(--text-primary)] transition-colors duration-500">
                             {mod.description}
                           </p>
                        </div>
                        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                           <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.4em] flex items-center gap-3">
                              Initialize
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                           </span>
                           <span className="text-[9px] text-[var(--text-muted)] font-mono select-none uppercase tracking-widest">Sys_Ready</span>
                        </div>
                     </button>
                   ))}
                </div>
             </div>
           )}

           {activeModule && (
             <ActiveModule 
                module={activeModule} 
                history={moduleHistory[activeModule.id] || []}
                onResultGenerated={(r) => handleModuleResult(activeModule.id, r)}
                onUpdateHistory={(r) => handleUpdateLastLog(activeModule.id, r)}
                onExitModule={() => setCurrentView('HOME')}
                onToggleSidebar={() => setIsSidebarOpen(true)}
             />
           )}
           
           {currentView === 'GUIDE' && <div className="p-8 md:p-24"><Guide /></div>}
           {currentView === 'FAQ' && <div className="p-8 md:p-24"><FAQ /></div>}
           {currentView === 'SUPPORT' && <div className="p-8 md:p-24"><Support /></div>}
         </div>
      </main>

      <SaveProjectModal isOpen={showSaveModal} onCancel={() => setShowSaveModal(false)} onSave={handleCreateNewSave} />

      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-2xl animate-fade-in p-6" onClick={() => setShowSettings(false)}>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden text-[var(--text-primary)]" onClick={(e) => e.stopPropagation()}>
             <div className="p-10 border-b border-[var(--border-subtle)] flex justify-between items-center">
               <h3 className="text-2xl font-bold tracking-tight">System Core</h3>
               <button onClick={() => setShowSettings(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--border-subtle)] p-3 rounded-2xl transition-colors">✕</button>
             </div>
             <div className="p-10 space-y-12 overflow-y-auto max-h-[70vh] custom-scrollbar">
                <div>
                   <label className="block text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-6 font-mono">Aesthetics Engine</label>
                   <div className="flex bg-[var(--bg-studio)] p-1.5 rounded-2xl border border-[var(--border-subtle)] shadow-inner">
                      <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center gap-3 py-4 text-xs font-bold rounded-xl transition-all ${theme === 'dark' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                         Obsidian Matte
                      </button>
                      <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center gap-3 py-4 text-xs font-bold rounded-xl transition-all ${theme === 'light' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-lg border border-[var(--border-subtle)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                         Daylight
                      </button>
                   </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-6 font-mono">Neural Status</label>
                  <div className="bg-[var(--bg-studio)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-inner">
                    <div className="flex items-center gap-4 mb-6 text-green-500">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                      <span className="text-xs font-bold font-mono uppercase tracking-tighter">Encrypted Uplink Established</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-8 leading-relaxed font-light">Local-only key injection active. All contextual processing occurs within the hardware-accelerated viewport.</p>
                    <div className="grid grid-cols-1 gap-3">
                      <button onClick={onLogout} className="w-full bg-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-studio)] py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all">Disconnect System</button>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
