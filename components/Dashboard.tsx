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
  
  // App State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('obscura_theme') as 'dark' | 'light') || 'dark';
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Project State
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [projectList, setProjectList] = useState<DriveFile[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  // --- Initializers ---
  useEffect(() => {
    // Theme Sync
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
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [currentView]);

  // --- Handlers ---
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleResetApiKey = () => {
    if (confirm("Are you sure? This will remove your API Key and sign you out.")) {
      localStorage.removeItem('gemini_api_key');
      window.location.reload();
    }
  };

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
      console.error(e);
      alert("Save failed. Check connection.");
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
        alert("Failed to access Drive.");
    } finally {
        setIsLoadingDrive(false);
    }
  };

  const handleLoadProject = async (fileId: string) => {
    setShowLoadModal(false);
    setIsLoadingDrive(true);
    try {
        const project = await loadProjectFromDrive(fileId);
        setCurrentProject({ ...project, id: fileId });
        setModuleHistory(project.moduleHistory);
        localStorage.setItem('obscura_module_history', JSON.stringify(project.moduleHistory));
        setAutoSaveStatus('idle');
    } catch (e) {
        alert("Failed to load project.");
    } finally {
        setIsLoadingDrive(false);
    }
  };

  const activeModule = MODULES.find(m => m.id === currentView);

  return (
    <div className="flex h-screen bg-[var(--bg-studio)] overflow-hidden text-[var(--text-primary)] font-inter transition-colors duration-300">
      <TourGuide />
      
      {/* --- Sidebar --- */}
      <aside 
        id="sidebar-nav"
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--border-subtle)]">
          <div onClick={() => setCurrentView('HOME')} className="cursor-pointer flex items-center gap-2 group w-full">
             <div className="w-6 h-6 bg-[var(--text-primary)] group-hover:bg-[var(--accent)] transition-colors rounded-md flex items-center justify-center text-[var(--bg-panel)] font-brand font-bold text-xs">O</div>
             <span className="font-semibold tracking-tight text-[var(--text-primary)]">OBSCURA</span>
          </div>
        </div>

        {/* User / Project Status */}
        <div className="p-4" id="project-status">
           {currentProject ? (
             <div className="bg-[var(--bg-element)] rounded-lg p-3 border border-[var(--border-subtle)]">
               <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide font-medium">Active Project</div>
               <div className="text-sm font-medium truncate mt-1 text-[var(--text-primary)]">{currentProject.name}</div>
               <div className="flex items-center gap-2 mt-2">
                 <span className={`w-2 h-2 rounded-full ${autoSaveStatus === 'saved' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                 <span className="text-[10px] text-[var(--text-secondary)] uppercase">{autoSaveStatus}</span>
               </div>
             </div>
           ) : (
             <button 
                onClick={() => isDriveConnected ? setShowSaveModal(true) : requestDriveToken()}
                className="w-full py-2 bg-[var(--bg-element)] hover:bg-[var(--bg-hover)] rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-subtle)] flex items-center justify-center gap-2"
             >
                {isDriveConnected ? 'Save Workspace' : 'Connect Drive'}
             </button>
           )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
           {/* Explicit Home Button */}
           <button
              onClick={() => setCurrentView('HOME')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-4 ${
                currentView === 'HOME' 
                  ? 'bg-[var(--accent)] text-white font-medium shadow-md' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard Home
           </button>

           <div className="px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 mt-2">Studio Tools</div>
           {MODULES.map((mod) => (
             <Tooltip key={mod.id} content={mod.subtitle} position="right">
               <button
                 onClick={() => setCurrentView(mod.id)}
                 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                   currentView === mod.id 
                     ? 'bg-[var(--bg-hover)] text-[var(--accent)] font-medium border border-[var(--border-subtle)]' 
                     : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                 }`}
               >
                 <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mod.icon} /></svg>
                 {mod.title}
               </button>
             </Tooltip>
           ))}

           <div className="px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 mt-6">System</div>
           {/* Settings Button */}
           <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Settings
           </button>
           
           {['GUIDE', 'FAQ', 'SUPPORT'].map((view) => (
             <button
               key={view}
               onClick={() => setCurrentView(view)}
               className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                 currentView === view ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
               }`}
             >
               <span className="capitalize">{view.toLowerCase()}</span>
             </button>
           ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
             {user.picture ? <img src={user.picture} alt="" className="w-full h-full object-cover" /> : user.name[0]}
           </div>
           <div className="flex-1 min-w-0">
             <div className="text-xs font-medium truncate text-[var(--text-primary)]">{user.name}</div>
             <button onClick={onLogout} className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Sign Out</button>
           </div>
           {/* Theme Toggle in Footer */}
           <button onClick={toggleTheme} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
           </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[var(--bg-studio)]">
         
         {/* Mobile Header */}
         <div className="md:hidden h-14 border-b border-[var(--border-subtle)] flex items-center justify-between px-4 bg-[var(--bg-panel)]">
            <span className="font-brand font-bold text-[var(--text-primary)]">OBSCURA</span>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[var(--text-secondary)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
         </div>
         
         {/* Workspace Area */}
         <div className="flex-1 overflow-y-auto relative custom-scrollbar">
           
           {/* Loading Overlay */}
           {isLoadingDrive && (
             <div className="absolute inset-0 bg-[var(--bg-studio)]/80 backdrop-blur z-50 flex items-center justify-center">
               <div className="w-8 h-8 border-2 border-[var(--border-subtle)] border-t-[var(--accent)] rounded-full animate-spin"></div>
             </div>
           )}

           {currentView === 'HOME' && (
             <div className="p-8 max-w-5xl mx-auto">
                <header className="mb-12">
                   <h1 className="text-3xl font-semibold mb-2 text-[var(--text-primary)] animate-fade-in">Welcome back, {user.name.split(' ')[0]}</h1>
                   <p className="text-[var(--text-secondary)]">Select a tool to begin your session or load a project.</p>
                </header>

                <div id="modules-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                   {/* Quick Actions */}
                   <button 
                     onClick={handleLoadList}
                     className="p-6 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all text-left group shadow-sm"
                   >
                      <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                      </div>
                      <h3 className="font-medium text-[var(--text-primary)] mb-1">Open Project</h3>
                      <p className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Load an existing OBSCURA.AI project from Drive using a .json file and continue exactly where you left off.</p>
                   </button>

                   {/* Featured Module */}
                   <button 
                     onClick={() => setCurrentView(ModuleId.STORYBOARD)}
                     className="p-6 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all text-left group shadow-sm"
                   >
                      <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <h3 className="font-medium text-[var(--text-primary)] mb-1">New Storyboard</h3>
                      <p className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Generate a complete storyboard from text: upload a script or scene description and create editable shots with frames and camera notes.</p>
                   </button>
                   
                   {/* Modules Grid */}
                   {MODULES.filter(m => m.id !== ModuleId.STORYBOARD).map(mod => (
                     <button
                       key={mod.id}
                       onClick={() => setCurrentView(mod.id)}
                       className="p-6 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] transition-all text-left group shadow-sm"
                     >
                        <div className="flex items-center gap-3 mb-3">
                           <div className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mod.icon} /></svg>
                           </div>
                           <h3 className="font-medium text-sm text-[var(--text-primary)]">{mod.title}</h3>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-300 line-clamp-3 leading-relaxed">
                          {mod.description}
                        </p>
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
             />
           )}
           
           {currentView === 'GUIDE' && <Guide />}
           {currentView === 'FAQ' && <FAQ />}
           {currentView === 'SUPPORT' && <Support />}
         </div>
      </main>

      {/* --- Modals --- */}
      <SaveProjectModal 
         isOpen={showSaveModal} 
         onCancel={() => setShowSaveModal(false)} 
         onSave={handleCreateNewSave} 
      />

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-studio)]">
               <h3 className="text-lg font-semibold font-cinzel">System Config</h3>
               <button onClick={() => setShowSettings(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
             </div>
             <div className="p-6 space-y-6">
                
                {/* Mode Toggle Section */}
                <div>
                   <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Appearance</label>
                   <div className="flex bg-[var(--bg-element)] p-1 rounded-lg">
                      <button 
                        onClick={() => setTheme('dark')} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${theme === 'dark' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                         Studio Dark
                      </button>
                      <button 
                        onClick={() => setTheme('light')} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${theme === 'light' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                         Daylight
                      </button>
                   </div>
                </div>

                {/* API Key Section */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">API Connection</label>
                  <div className="bg-[var(--bg-element)] border border-[var(--border-subtle)] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-green-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-xs font-mono">Gemini API Connected</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mb-4 leading-relaxed">
                      Your API key is stored locally on this device. Resetting it will disconnect the AI modules and require re-authentication.
                    </p>
                    <button 
                      onClick={handleResetApiKey}
                      className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Reset API Key
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
      
      {/* Load Project Modal */}
      {showLoadModal && (
         <div 
           className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
           onClick={() => setShowLoadModal(false)}
         >
            <div 
              className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-studio)]">
                  <h3 className="font-medium text-[var(--text-primary)]">Load Project</h3>
                  <button onClick={() => setShowLoadModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
               </div>
               <div className="flex-1 overflow-y-auto p-2">
                  {projectList.length === 0 ? (
                     <div className="text-center py-8 text-[var(--text-muted)] text-sm">No compatible projects found in Drive.</div>
                  ) : (
                     projectList.map(f => (
                        <button key={f.id} onClick={() => handleLoadProject(f.id)} className="w-full text-left p-3 rounded-lg hover:bg-[var(--bg-hover)] flex justify-between items-center group">
                           <div>
                              <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">{f.name.replace('.json','')}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">Last modified: {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'Unknown'}</div>
                           </div>
                           <span className="text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100">Open</span>
                        </button>
                     ))
                  )}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default Dashboard;