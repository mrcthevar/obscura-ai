import { useEffect, useRef } from 'react';
import { ProjectData } from '../types';
import { updateProjectOnDrive } from '../services/googleDriveService';

export const useAutoSave = (
  projectData: ProjectData | null,
  isDriveConnected: boolean,
  onSaveStatusChange: (status: 'saved' | 'saving' | 'error' | 'idle') => void
) => {
  const lastSavedData = useRef<string>('');
  
  useEffect(() => {
    if (!isDriveConnected || !projectData || !projectData.id) return;

    const currentDataString = JSON.stringify(projectData.moduleHistory);
    
    // Don't save if data hasn't changed since last save
    if (currentDataString === lastSavedData.current) return;

    const intervalId = setInterval(async () => {
      // Check again inside interval to be safe
      const currentDataStringNow = JSON.stringify(projectData.moduleHistory);
      if (currentDataStringNow === lastSavedData.current) return;

      try {
        onSaveStatusChange('saving');
        await updateProjectOnDrive(projectData.id!, projectData);
        lastSavedData.current = currentDataStringNow;
        onSaveStatusChange('saved');
        
        // Reset to idle after 2 seconds for UI nicety
        setTimeout(() => onSaveStatusChange('idle'), 2000);
      } catch (error) {
        console.error("Auto-save failed", error);
        onSaveStatusChange('error');
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [projectData, isDriveConnected]);
};