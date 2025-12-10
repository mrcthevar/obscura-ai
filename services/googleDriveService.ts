import { ProjectData, DriveFile } from '../types';

// Helper to get ID from Env OR LocalStorage
const getClientId = () => {
  // Safe access using optional chaining
  return import.meta.env?.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('obscura_client_id') || '';
};

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let accessToken: string | null = localStorage.getItem('obscura_drive_token');

export const initDriveAuth = (callback: (token: string) => void) => {
  const currentClientId = getClientId();

  if (!currentClientId) {
    console.warn("Google Drive Service: Missing Client ID.");
    return;
  }

  if (window.google) {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: currentClientId,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            accessToken = tokenResponse.access_token;
            localStorage.setItem('obscura_drive_token', accessToken!);
            callback(accessToken!);
          }
        },
      });
    } catch (e) {
      console.error("Failed to init token client", e);
    }
  }
};

export const requestDriveToken = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  } else {
    console.error("Token Client not initialized.");
    const currentClientId = getClientId();
    if (!currentClientId) {
        alert("Configuration Error: Google Client ID is missing. Please reload and check Landing page settings.");
    } else {
      // Retry init if it failed purely due to timing
      initDriveAuth(() => {});
      alert("System initializing... please click Connect Drive again.");
    }
  }
};

export const hasDriveToken = () => {
  return !!accessToken;
};

// --- API OPERATIONS ---

export const saveProjectToDrive = async (project: ProjectData): Promise<string> => {
  if (!accessToken) throw new Error("No Access Token");

  const fileMetadata = {
    name: `${project.name}.json`,
    mimeType: 'application/json',
    properties: {
        app: 'obscura',
        type: 'project_file'
    }
  };

  const fileContent = JSON.stringify(project);
  const file = new Blob([fileContent], { type: 'application/json' });
  const metadataBlob = new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' });

  const form = new FormData();
  form.append('metadata', metadataBlob);
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form
  });

  if (!response.ok) {
     if (response.status === 401) {
         localStorage.removeItem('obscura_drive_token');
         throw new Error("Token expired");
     }
     throw new Error("Failed to save project");
  }

  const data = await response.json();
  return data.id;
};

export const updateProjectOnDrive = async (fileId: string, project: ProjectData): Promise<void> => {
    if (!accessToken) throw new Error("No Access Token");

    const fileContent = JSON.stringify(project);
    
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: fileContent
    });
  
    if (!response.ok) throw new Error("Failed to update project");
};

export const listProjectsFromDrive = async (): Promise<DriveFile[]> => {
    if (!accessToken) throw new Error("No Access Token");
    
    const query = "mimeType = 'application/json' and properties has { key='app', value='obscura' } and trashed = false";
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, modifiedTime)`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
             localStorage.removeItem('obscura_drive_token');
             throw new Error("Token expired");
        }
        throw new Error("Failed to list projects");
    }

    const data = await response.json();
    return data.files || [];
};

export const loadProjectFromDrive = async (fileId: string): Promise<ProjectData> => {
    if (!accessToken) throw new Error("No Access Token");

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    if (!response.ok) throw new Error("Failed to load project content");
    
    return await response.json();
};