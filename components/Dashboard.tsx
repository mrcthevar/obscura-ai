import React, { useState, useEffect } from 'react';
import { UserProfile, ModuleId, ProjectData, DriveFile } from '../types';
import { MODULES } from '../constants';
import ActiveModule from './ActiveModule';
import Guide from './Guide';
import FAQ from './FAQ';
import Support from './Support';
import SaveProjectModal from './SaveProjectModal';
import { initDriveAuth, requestDriveToken, saveProjectToDrive, listProjectsFromDrive, loadProjectFromDrive, hasDriveToken } from '../services/googleDriveService';
import { useAutoSave } from '../hooks/useAutoSave';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>('HOME');
  const [moduleHistory, setModuleHistory] = useState<Record<string, string[]>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Project State
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [projectList, setProjectList] = useState<DriveFile[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  // Initialize Drive Auth on Mount
  useEffect(() => {
    const initialize = async () => {
      // Check if we already have a token first to set initial state
      if (hasDriveToken()) {
          setIsDriveConnected(true);
      }
      
      // Wait for script to ensure we can refresh/init if needed
      // but don't block UI if offline or script fails
      try {
        await initDriveAuth((token) => {
           setIsDriveConnected(true);
        });
      } catch (e) {
        console.warn("Drive init non-fatal error", e);
      }
    };
    initialize();
  }, []);

  // Load history from local storage on mount (Local-First fallback)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('obscura_module_history');
      if (stored) {
        setModuleHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Sync currentProject state with moduleHistory when history changes
  useEffect(() => {
    if (currentProject) {
      setCurrentProject(prev => prev ? { ...prev, moduleHistory } : null);
    }
  }, [moduleHistory]);

  // Hook for Auto-Save
  useAutoSave(currentProject, isDriveConnected, setAutoSaveStatus);

  // SEO: Dynamic Title Management
  useEffect(() => {
    const activeMod = MODULES.find(m => m.id === currentView);
    if (activeMod) {
      document.title = `OBSCURA | ${activeMod.title}`;
    } else if (currentView === 'HOME') {
      document.title = 'OBSCURA.AI | Cinematic Intelligence Suite';
    }
    // Close mobile menu on view change
    setIsMobileMenuOpen(false);
  }, [currentView]);

  const handleModuleResult = (moduleId: ModuleId, result: string) => {
    setModuleHistory(prev => {
      const currentHistory = prev[moduleId] || [];
      const updatedHistory = { ...prev, [moduleId]: [...currentHistory, result] };
      localStorage.setItem('obscura_module_history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const handleUpdateLastLog = (moduleId: ModuleId, updatedResult: string) => {
     setModuleHistory(prev => {
        const list = prev[moduleId] || [];
        if (list.length === 0) return prev; // No history to update
        
        const newList = [...list];
        newList[newList.length - 1] = updatedResult; // Replace last item
        
        const updatedHistory = { ...prev, [moduleId]: newList };
        localStorage.setItem('obscura_module_history', JSON.stringify(updatedHistory));
        return updatedHistory;
     });
  };

  const handleConnectDrive = () => {
    requestDriveToken();
  };

  const handleCreateNewSave = async (name: string) => {
    setShowSaveModal(false);
    setIsLoadingDrive(true);
    try {
      const newProject: ProjectData = {
        name,
        lastModified: Date.now(),
        moduleHistory: moduleHistory,
        version: '1.0'
      };
      
      const fileId = await saveProjectToDrive(newProject);
      setCurrentProject({ ...newProject, id: fileId });
      setAutoSaveStatus('saved');
    } catch (e) {
      console.error(e);
      alert("Failed to save to Drive. If using Guest Mode, ensure you've connected a Google account.");
      // If error suggests token issue, reset connection state
      if (e instanceof Error && e.message === "Token expired") {
        setIsDriveConnected(false);
      }
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
    } catch (e: any) {
        console.error(e);
        if (e.message === "Token expired") {
           setIsDriveConnected(false);
           handleConnectDrive(); // Prompt re-login
        } else {
           alert("Failed to access Drive. Please reconnect.");
        }
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
        console.error(e);
        alert("Failed to load project file.");
    } finally {
        setIsLoadingDrive(false);
    }
  };

  const activeModule = MODULES.find(m => m.id === currentView);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-inter">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#050505] border-b border-neutral-900 z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <button onClick={() => setCurrentView('HOME')} className="font-cinzel text-white text-lg hover:text-[#FFD700] transition-colors tracking-widest">OBSCURA</button>
          </div>
          
          <div className="h-8 w-8 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700" onClick={onLogout}>
             {user.picture ? <img src={user.picture} alt={user.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-neutral-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg></div>}
          </div>
      </div>

      {/* Sidebar Navigation (Desktop: Fixed, Mobile: Overlay) */}
      <nav className={`
        fixed top-0 left-0 h-full w-64 border-r border-neutral-900 bg-[#050505] z-40 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 mt-16 md:mt-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:block p-8 border-b border-neutral-900">
          <button 
            onClick={() => setCurrentView('HOME')} 
            className="text-xl font-cinzel text-white tracking-widest hover:text-[#FFD700] transition-colors w-full text-left"
          >
            OBSCURA
          </button>
        </div>
        
        <div className="flex-1 py-6 md:py-8 space-y-2 overflow-y-auto">
          {/* Project Controls */}
          <div className="px-6 md:px-8 pb-4 border-b border-neutral-900 mb-4 space-y-3">
             <div className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mb-2">Project Database</div>
             
             {!isDriveConnected ? (
               <button onClick={handleConnectDrive} className="w-full flex items-center justify-center space-x-2 bg-[#0A0A0A] border border-neutral-800 py-3 md:py-2 hover:border-[#FFD700] text-xs text-neutral-400 hover:text-white transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg>
                  <span>Connect Drive</span>
               </button>
             ) : (
               <>
                 <button 
                   onClick={() => setShowSaveModal(true)}
                   className="w-full text-left flex items-center space-x-3 text-neutral-400 hover:text-[#FFD700] transition-colors text-xs font-inter py-1"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    <span>Save Project</span>
                 </button>
                 <button 
                    onClick={handleLoadList}
                    className="w-full text-left flex items-center space-x-3 text-neutral-400 hover:text-[#FFD700] transition-colors text-xs font-inter py-1"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span>Load Project</span>
                 </button>
               </>
             )}

             {currentProject && (
                 <div className="mt-2 p-2 bg-neutral-900 border border-neutral-800 rounded">
                    <p className="text-[10px] text-[#FFD700] uppercase font-bold truncate">{currentProject.name}</p>
                    <p className="text-[9px] text-neutral-500 flex items-center mt-1">
                        Status: 
                        <span className={`ml-1 ${autoSaveStatus === 'saved' ? 'text-green-500' : autoSaveStatus === 'saving' ? 'text-yellow-500' : 'text-neutral-500'}`}>
                           {autoSaveStatus.toUpperCase()}
                        </span>
                    </p>
                 </div>
             )}
          </div>

          {/* Navigation Items */}
          <button
            onClick={() => setCurrentView('HOME')}
            className={`w-full text-left px-6 md:px-8 py-3 md:py-4 flex items-center space-x-4 transition-all duration-300 ${
              currentView === 'HOME' 
                ? 'bg-[#0A0A0A] text-[#FFD700] border-r-2 border-[#FFD700]' 
                : 'text-neutral-500 hover:text-white'
            }`}
          >
             <svg className="w-5 h-5 min-w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
             </svg>
             <span className="font-inter text-xs tracking-wider font-semibold">HOME</span>
          </button>

          <div className="px-6 md:px-8 py-2 text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-4 mb-1">Modules</div>

          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setCurrentView(mod.id)}
              className={`w-full text-left px-6 md:px-8 py-3 flex items-center space-x-4 transition-all duration-300 ${
                currentView === mod.id 
                  ? 'bg-[#0A0A0A] text-[#FFD700] border-r-2 border-[#FFD700]' 
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
               <svg className="w-5 h-5 min-w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mod.icon} />
               </svg>
               <span className="font-inter text-xs tracking-wider font-semibold">{mod.title}</span>
            </button>
          ))}

          <div className="px-6 md:px-8 py-2 text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-6 mb-1">Resources</div>
          
          <button onClick={() => setCurrentView('GUIDE')} className={`w-full text-left px-6 md:px-8 py-3 flex items-center space-x-4 transition-all duration-300 ${currentView === 'GUIDE' ? 'text-[#FFD700]' : 'text-neutral-500 hover:text-white'}`}>
             <svg className="w-5 h-5 min-w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             <span className="font-inter text-xs tracking-wider font-semibold">HOW TO USE</span>
          </button>
          <button onClick={() => setCurrentView('FAQ')} className={`w-full text-left px-6 md:px-8 py-3 flex items-center space-x-4 transition-all duration-300 ${currentView === 'FAQ' ? 'text-[#FFD700]' : 'text-neutral-500 hover:text-white'}`}>
             <svg className="w-5 h-5 min-w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span className="font-inter text-xs tracking-wider font-semibold">FAQ</span>
          </button>
          <button onClick={() => setCurrentView('SUPPORT')} className={`w-full text-left px-6 md:px-8 py-3 flex items-center space-x-4 transition-all duration-300 ${currentView === 'SUPPORT' ? 'text-[#FFD700]' : 'text-neutral-500 hover:text-white'}`}>
             <svg className="w-5 h-5 min-w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             <span className="font-inter text-xs tracking-wider font-semibold">SUPPORT</span>
          </button>
        </div>

        <div className="p-8 border-t border-neutral-900 flex items-center gap-4 hidden md:flex">
          <div className="h-10 w-10 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0 border border-neutral-700">
             {user.picture ? (
               <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
             ) : (
               <div className="h-full w-full flex items-center justify-center text-neutral-500">
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
               </div>
             )}
          </div>
          <div className="overflow-hidden">
             <p className="text-xs text-neutral-500 font-cinzel truncate">{user.isGuest ? 'Operator' : 'Director'}</p>
             <p className="text-sm text-white truncate">{user.name}</p>
             <button onClick={onLogout} className="text-[10px] text-red-800 hover:text-red-500 transition-colors uppercase tracking-widest mt-1">Disconnect</button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <main className="md:ml-64 p-4 md:p-12 pt-20 md:pt-12 min-h-screen relative bg-[#050505] transition-all duration-300">
        {isLoadingDrive && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                 <div className="w-12 h-12 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
             </div>
        )}

        {currentView === 'HOME' && (
          <div className="max-w-6xl mx-auto animate-fade-in">
            <h2 className="text-2xl md:text-5xl font-cinzel text-white mb-6 md:mb-12">Cinematic Intelligence Suite</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {MODULES.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setCurrentView(mod.id)}
                  className="group bg-[#0A0A0A] border border-neutral-800 p-6 md:p-8 text-left hover:border-[#FFD700] hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] transition-all duration-500 relative overflow-hidden"
                >
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-neutral-900 rounded-full flex items-center justify-center text-[#FFD700] mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                     <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mod.icon} /></svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-cinzel text-white mb-2">{mod.title}</h3>
                  <p className="text-sm md:text-base text-neutral-400 font-inter leading-relaxed group-hover:text-neutral-300 transition-colors">{mod.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentView === 'GUIDE' && <Guide />}
        {currentView === 'FAQ' && <FAQ />}
        {currentView === 'SUPPORT' && <Support />}
        {activeModule && (
          <ActiveModule 
            key={activeModule.id} 
            module={activeModule} 
            history={moduleHistory[activeModule.id] || []}
            onResultGenerated={(result) => handleModuleResult(activeModule.id, result)}
            onUpdateHistory={(result) => handleUpdateLastLog(activeModule.id, result)}
          />
        )}
      </main>

      {/* Modals */}
      <SaveProjectModal 
        isOpen={showSaveModal}
        onCancel={() => setShowSaveModal(false)}
        onSave={handleCreateNewSave}
      />
      
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-[#0A0A0A] border border-neutral-700 w-full max-w-2xl p-6 md:p-8 max-h-[80vh] overflow-hidden flex flex-col shadow-[0_0_40px_rgba(255,215,0,0.1)] rounded relative">
             <div className="flex justify-between items-center mb-4 md:mb-6 pb-4 border-b border-neutral-800">
                <h3 className="text-xl md:text-2xl font-cinzel text-white">Load Project</h3>
                <button onClick={() => setShowLoadModal(false)} className="text-neutral-500 hover:text-white p-2">✕</button>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {projectList.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 font-inter italic">No saves found in Drive.</div>
                ) : (
                    projectList.map(file => (
                        <button 
                           key={file.id} 
                           onClick={() => handleLoadProject(file.id)}
                           className="w-full text-left p-3 md:p-4 bg-[#050505] border border-neutral-800 hover:border-[#FFD700] transition-colors flex justify-between items-center group"
                        >
                           <div className="overflow-hidden mr-2">
                               <p className="text-white font-mono text-xs md:text-sm group-hover:text-[#FFD700] truncate">{file.name.replace('.json', '')}</p>
                               <p className="text-neutral-600 text-[10px] mt-1 truncate">ID: {file.id}</p>
                           </div>
                           <span className="text-neutral-500 text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                             LOAD
                           </span>
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