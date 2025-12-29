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
import { saveToDB, loadFromDB, clearDBKey } from '../services/storageService';

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
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('obscura_theme', theme);
  }, [theme]);

  // Initialization & Migration Logic
  useEffect(() => {
    const init = async () => {
      // 1. Check Drive Token
      if (hasDriveToken()) setIsDriveConnected(true);
      try { await initDriveAuth(() => setIsDriveConnected(true)); } catch (e) {}

      // 2. Hydrate History (Migration: LocalStorage -> IndexedDB)
      try {
        const legacyData = localStorage.getItem('obscura_module_history');
        if (legacyData) {
            console.log("System: Migrating legacy storage to Neural Database...");
            const parsed = JSON.parse(legacyData);
            await saveToDB('obscura_module_history', parsed);
            setModuleHistory(parsed);
            localStorage.removeItem('obscura_module_history'); // Cleanup
        } else {
            const dbData = await loadFromDB('obscura_module_history');
            if (dbData) setModuleHistory(dbData);
        }
      } catch (e) {
        console.error("Storage Hydration Error:", e);
      } finally {
        setIsHydrating(false);
      }
    };
    init();
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
      // Async Save to IndexedDB (No blocking, No 5MB Limit)
      saveToDB('obscura_module_history', updated).catch(err => console.error("DB Save Failed", err));
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
        saveToDB('obscura_module_history', updated).catch(err => console.error("DB Save Failed", err));
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

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the local analysis cache? This cannot be undone.')) {
      await clearDBKey('obscura_module_history');
      setModuleHistory({});
      alert('Local cache cleared.');
    }
  };

  const handleRestartTour = () => {
    localStorage.removeItem('obscura_tour_completed');
    window.location.reload();
  };
  
  const handleHomeNavigation = () => {
    setCurrentView('HOME');
  };

  const activeModule = MODULES.find(m => m.id === currentView);

  const cardStyle = `
    relative p-8 rounded-[2.5rem] transition-all duration-700 text-left group overflow-hidden
    bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-[2px]
    hover:border-[var(--accent)]/40 hover:shadow-[0_0_50px_var(--shadow-glow)]
  `;

  const h2Style = "text-3xl md:text-4xl font-bold mb-6 tracking-tighter text-[var(--text-primary)]";
  const pStyle = "text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl font-light";

  if (isHydrating) {
      return (
          <div className="h-screen bg-[var(--bg-studio)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest uppercase">Initializing Database...</span>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-studio)] text-[var(--text-primary)] font-inter transition-all duration-500 overflow-hidden">
      <TourGuide />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar - Kept Compact for Tool Navigation */}
      <aside 
        id="sidebar-nav"
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-500 ease-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
        `}
        aria-label="Sidebar Navigation"
      >
        <div className="h-24 flex items-center px-8">
          <div 
            onClick={handleHomeNavigation} 
            className="cursor-pointer flex items-center gap-4 group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHomeNavigation()}
            aria-label="Go to Home"
          >
             <div className="w-10 h-10 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-black font-brand font-bold text-lg shadow-[0_0_25px_var(--shadow-glow)] group-hover:scale-110 transition-transform">O</div>
             <span className="font-brand font-bold tracking-[0.4em] text-sm text-[var(--text-primary)] uppercase">Obscura</span>
          </div>
        </div>

        <div className="px-6 mb-8 space-y-3">
           {currentProject ? (
             <div className="bg-[var(--bg-panel)] rounded-2xl p-5 border border-[var(--border-subtle)]" id="project-status">
               <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-black font-mono">Archive Active</div>
               <div className="text-sm font-semibold truncate mt-1">{currentProject.name}</div>
               <div className="flex items-center gap-2 mt-4">
                 <div className={`w-2 h-2 rounded-full ${autoSaveStatus === 'saved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--shadow-glow)]'}`}></div>
                 <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-wider">
                    {autoSaveStatus === 'saved' && isDriveConnected ? '🔒 VAULT SECURE' : autoSaveStatus}
                 </span>
               </div>
             </div>
           ) : (
             <button 
                onClick={() => isDriveConnected ? setShowSaveModal(true) : requestDriveToken()}
                className="w-full py-3.5 bg-transparent border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95"
                aria-label={isDriveConnected ? 'Sync Project to Vault' : 'Link Google Drive'}
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
                {isDriveConnected ? 'Sync Vault' : 'Link Drive'}
             </button>
           )}
           <button 
              onClick={handleLoadList}
              className="w-full py-3.5 bg-transparent border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
              aria-label="Load Archived Project"
           >
              Load Archive
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 py-4 border-t border-[var(--border-subtle)] custom-scrollbar">
           <button
              onClick={handleHomeNavigation}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-xs transition-all mb-4 ${
                currentView === 'HOME' 
                  ? 'bg-[var(--bg-panel)] text-[var(--accent)] font-bold border-l-4 border-[var(--accent)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
              }`}
              aria-current={currentView === 'HOME' ? 'page' : undefined}
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Studio Home
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
                 aria-label={`Open ${mod.title} Module`}
                 aria-current={currentView === mod.id ? 'page' : undefined}
               >
                 <svg className={`w-4 h-4 transition-all duration-500 ${currentView === mod.id ? 'opacity-100' : 'opacity-20'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mod.icon} /></svg>
                 {mod.title}
               </button>
             </Tooltip>
           ))}
           {/* Navigation Items ... */}
           <div className="px-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3 mt-10 font-mono">System Terminal</div>
           <button
              onClick={() => setCurrentView('GUIDE')}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-xs transition-all ${
                currentView === 'GUIDE' 
                  ? 'bg-[var(--bg-panel)] text-[var(--accent)] font-bold border-l-4 border-[var(--accent)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
              }`}
              aria-label="Operator's Guide"
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
              aria-label="FAQ"
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
              aria-label="Support"
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
             <button onClick={onLogout} className="text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-[0.3em] font-black mt-1" aria-label="Disconnect">Disconnect</button>
           </div>
           <button onClick={() => setShowSettings(true)} className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" aria-label="Open Settings">
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

           {/* --- MAIN DASHBOARD VIEW --- */}
           {currentView === 'HOME' && (
             <div className="p-8 md:p-24 max-w-7xl mx-auto space-y-32" id="modules-grid">
                
                {/* 1. HERO SECTION */}
                <header className="text-center md:text-left space-y-8">
                   <div className="inline-block mb-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] font-mono">
                      v1.0.4 · SYSTEM ONLINE · SYS_READY
                   </div>
                   <h1 className="text-5xl md:text-8xl font-bold tracking-tighter animate-fade-in text-[var(--text-primary)] leading-[0.9]">
                     OBSCURA Studio
                   </h1>
                   <p className="text-lg md:text-xl text-[var(--text-secondary)] font-light max-w-3xl leading-relaxed">
                     AI tools for cinematic preproduction. A unified workspace for Directors and DOPs to plan lighting, generate shot lists, and define visual language.
                   </p>
                   <div className="flex flex-wrap gap-4 pt-4">
                     <button onClick={() => setCurrentView(ModuleId.LUX)} className="px-8 py-4 bg-[var(--text-primary)] text-[var(--bg-studio)] font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[var(--accent)] hover:text-black transition-all active:scale-95">
                        Launch Studio
                     </button>
                     <button onClick={() => setCurrentView('GUIDE')} className="px-8 py-4 border border-[var(--border-subtle)] text-[var(--text-primary)] font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[var(--bg-panel)] transition-all">
                        View Sample Project
                     </button>
                   </div>
                </header>

                {/* 2. CINEMATIC SYSTEMS (GRID) */}
                <section>
                    <h2 className={h2Style}>Cinematic Systems</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
                      {MODULES.map(mod => (
                        <button key={mod.id} onClick={() => setCurrentView(mod.id)} className={cardStyle} aria-label={`Open ${mod.title} Module`}>
                            <div className="flex justify-between items-start mb-12">
                                <div className="p-4 rounded-2xl bg-[var(--accent)]/5 text-[var(--accent)] border border-transparent group-hover:border-[var(--accent)]/20 transition-all">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mod.icon} /></svg>
                                </div>
                                <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest border border-[var(--border-subtle)] px-2 py-1 rounded-full group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/30 transition-colors">SYS_READY</span>
                            </div>
                            <div className="space-y-3">
                              <h3 className="text-2xl font-bold tracking-tighter group-hover:text-[var(--accent)] transition-colors duration-500">{mod.title}</h3>
                              <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{mod.subtitle}</h4>
                              <p className="text-sm text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-primary)] transition-colors duration-500 pt-2">
                                {mod.description}
                              </p>
                            </div>
                            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                                <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">Open {mod.title} →</span>
                            </div>
                        </button>
                      ))}
                    </div>
                </section>

                {/* 3. WORKFLOW OVERVIEW */}
                <section className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <svg className="w-64 h-64" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                   </div>
                   <h2 className={h2Style}>A pipeline for your next shoot.</h2>
                   <p className={pStyle + " mb-12"}>
                      OBSCURA is designed to function as a modular system. Use tools individually for quick tasks, or chain them together for a complete preproduction workflow.
                   </p>
                   <div className="space-y-6">
                      {[
                        { step: "01", title: "Script → SUBTEXT", desc: "Parse scenes to identify emotional beats and key moments." },
                        { step: "02", title: "SUBTEXT → STORYBOARD", desc: "Generate shot lists and frames based on those emotional beats." },
                        { step: "03", title: "STORYBOARD → KINETIC", desc: "Refine the camera movement, rigging choices, and blocking." },
                        { step: "04", title: "References → LUX", desc: "Reverse-engineer lighting from your location photos or mood board." },
                        { step: "05", title: "Stills → VISIONARY", desc: "Create cohesive look-dev prompts to finalize the aesthetic." }
                      ].map((item, idx) => (
                         <div key={idx} className="flex gap-6 items-start group">
                            <span className="text-[10px] font-mono text-[var(--accent)] font-bold pt-1 opacity-50 group-hover:opacity-100">{item.step}</span>
                            <div>
                               <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">{item.title}</h4>
                               <p className="text-xs text-[var(--text-secondary)] font-light">{item.desc}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </section>

                {/* 4. TRUST SECTION */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <div>
                      <h2 className={h2Style}>Built for working Cinematographers.</h2>
                      <div className="space-y-6">
                         <div className="flex gap-4">
                            <div className="w-1 h-1 mt-2.5 bg-[var(--accent)] rounded-full shrink-0"></div>
                            <p className={pStyle}><strong>Designed by Filmmakers:</strong> Tools that understand f-stops, focal lengths, and lighting ratios—not just generic image generation.</p>
                         </div>
                         <div className="flex gap-4">
                            <div className="w-1 h-1 mt-2.5 bg-[var(--accent)] rounded-full shrink-0"></div>
                            <p className={pStyle}><strong>Efficiency without Compromise:</strong> Speed up the technical prep (shot listing, diagrams) so you can spend more time on creative direction.</p>
                         </div>
                         <div className="flex gap-4">
                            <div className="w-1 h-1 mt-2.5 bg-[var(--accent)] rounded-full shrink-0"></div>
                            <p className={pStyle}><strong>Production Ready:</strong> Generate assets that are clear enough to hand to a 1st AD, Gaffer, or Operator.</p>
                         </div>
                      </div>
                      <button onClick={() => setCurrentView('GUIDE')} className="mt-8 text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.3em] hover:text-[var(--text-primary)] transition-colors">
                         See a sample scene walkthrough →
                      </button>
                   </div>
                   <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] h-80 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--bg-studio)] via-transparent to-[var(--accent)]/10"></div>
                      <div className="text-center p-8 z-10">
                         <h3 className="text-4xl font-brand mb-2">OBSCURA</h3>
                         <p className="text-[10px] font-mono text-[var(--text-muted)] tracking-[0.5em] uppercase">Cinematic Intelligence</p>
                      </div>
                   </div>
                </section>

                {/* 5. HELP & SYSTEM */}
                <section>
                   <h2 className={h2Style}>Help, Support, and System.</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <button onClick={() => setCurrentView('GUIDE')} className="text-left p-6 rounded-3xl border border-[var(--border-subtle)] hover:bg-[var(--bg-panel)] transition-all group">
                         <h4 className="text-sm font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">Operator's Guide</h4>
                         <p className="text-xs text-[var(--text-secondary)] font-light">Deep dive into every system with examples.</p>
                      </button>
                      <button onClick={() => setCurrentView('FAQ')} className="text-left p-6 rounded-3xl border border-[var(--border-subtle)] hover:bg-[var(--bg-panel)] transition-all group">
                         <h4 className="text-sm font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">F.A.Q.</h4>
                         <p className="text-xs text-[var(--text-secondary)] font-light">Quick answers regarding API keys and privacy.</p>
                      </button>
                      <button onClick={() => setCurrentView('SUPPORT')} className="text-left p-6 rounded-3xl border border-[var(--border-subtle)] hover:bg-[var(--bg-panel)] transition-all group">
                         <h4 className="text-sm font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">Support</h4>
                         <p className="text-xs text-[var(--text-secondary)] font-light">Reach out to the engineering team.</p>
                      </button>
                      <button onClick={() => setShowSettings(true)} className="text-left p-6 rounded-3xl border border-[var(--border-subtle)] hover:bg-[var(--bg-panel)] transition-all group">
                         <h4 className="text-sm font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">System Console</h4>
                         <p className="text-xs text-[var(--text-secondary)] font-light">Advanced settings and status.</p>
                      </button>
                   </div>
                </section>

                {/* 6. FOOTER */}
                <footer className="pt-24 pb-12 border-t border-[var(--border-subtle)] flex flex-col md:flex-row justify-between gap-12 text-[10px] text-[var(--text-secondary)] font-mono">
                   <div className="space-y-4">
                      <div className="flex gap-8">
                         <button onClick={handleHomeNavigation} className="hover:text-[var(--text-primary)] uppercase tracking-wider">Home</button>
                         <button onClick={() => setCurrentView(ModuleId.LUX)} className="hover:text-[var(--text-primary)] uppercase tracking-wider">Tools</button>
                         <button onClick={() => setCurrentView('GUIDE')} className="hover:text-[var(--text-primary)] uppercase tracking-wider">Guide</button>
                         <button onClick={() => setCurrentView('SUPPORT')} className="hover:text-[var(--text-primary)] uppercase tracking-wider">Support</button>
                      </div>
                      <p className="font-light opacity-60">OBSCURA Studio – AI tools for cinematic preproduction.</p>
                      <p className="font-light opacity-60">© {new Date().getFullYear()} OBSCURA.AI // All rights reserved.</p>
                   </div>
                   <div className="text-right space-y-2">
                      <div className="text-[var(--text-primary)] uppercase tracking-widest">System Console</div>
                      <div className="text-green-500">Status: OPERATIONAL</div>
                      <div>Version: 1.0.4</div>
                   </div>
                </footer>

             </div>
           )}

           {activeModule && (
             <ActiveModule 
                module={activeModule} 
                history={moduleHistory[activeModule.id] || []}
                onResultGenerated={(r) => handleModuleResult(activeModule.id, r)}
                onUpdateHistory={(r) => handleUpdateLastLog(activeModule.id, r)}
                onExitModule={handleHomeNavigation}
                onToggleSidebar={() => setIsSidebarOpen(true)}
             />
           )}
           
           {currentView === 'GUIDE' && <div className="p-8 md:p-24"><Guide /></div>}
           {currentView === 'FAQ' && <div className="p-8 md:p-24"><FAQ /></div>}
           {currentView === 'SUPPORT' && <div className="p-8 md:p-24"><Support /></div>}
         </div>
      </main>

      <SaveProjectModal isOpen={showSaveModal} onCancel={() => setShowSaveModal(false)} onSave={handleCreateNewSave} />
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-2xl animate-fade-in p-6" onClick={() => setShowSettings(false)}>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden text-[var(--text-primary)]" onClick={(e) => e.stopPropagation()}>
             <div className="p-10 border-b border-[var(--border-subtle)] flex justify-between items-center">
               <h3 className="text-2xl font-bold tracking-tight">System Core</h3>
               <button onClick={() => setShowSettings(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--border-subtle)] p-3 rounded-2xl transition-colors" aria-label="Close Settings">✕</button>
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
                  <label className="block text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-6 font-mono">Maintenance</label>
                  <div className="space-y-4">
                     <button onClick={handleClearCache} className="w-full bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-studio)] hover:text-[var(--text-primary)] py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all border border-transparent hover:border-[var(--text-muted)]">Clear Analysis Cache</button>
                     <button onClick={handleRestartTour} className="w-full bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-studio)] hover:text-[var(--text-primary)] py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all border border-transparent hover:border-[var(--text-muted)]">Replay Onboarding</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-6 font-mono">Neural Status</label>
                  <div className="bg-[var(--bg-studio)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-inner">
                    <div className="flex items-center gap-4 mb-6 text-green-500">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                      <span className="text-xs font-bold font-mono uppercase tracking-tighter">System Ready</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-8 leading-relaxed font-light">
                      Encryption active. All neural processing is secured via your primary environment key.
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <button onClick={onLogout} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all border border-red-500/20">Disconnect System</button>
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