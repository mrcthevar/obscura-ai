import { ProjectData, DriveFile } from '../types';

declare global {
  interface Window {
    google: any;
  }
}

// Helper to get ID from Env OR LocalStorage
const getClientId = () => {
  // Safe access using optional chaining
  return import.meta.env?.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('obscura_client_id') || '';
};

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
// Initialize from storage, but don't trust it blindly without auth
let accessToken: string | null = localStorage.getItem('obscura_drive_token');

// Helper to wait for the Google Script to load
const waitForGoogleScript = async () => {
  let attempts = 0;
  while (!window.google && attempts < 50) { // Increased to 50 attempts (10s)
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }
  return !!window.google;
};

export const initDriveAuth = async (callback: (token: string) => void) => {
  const currentClientId = getClientId();

  if (!currentClientId) {
    console.warn("Google Drive Service: Missing Client ID.");
    return;
  }

  const isLoaded = await waitForGoogleScript();
  if (!isLoaded) {
    console.error("Google Scripts failed to load.");
    return;
  }

  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: currentClientId,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          accessToken = tokenResponse.access_token;
          localStorage.setItem('obscura_drive_token', accessToken!);
          callback(accessToken!);
        } else {
          console.error("Token response missing access_token", tokenResponse);
        }
      },
      error_callback: (error: any) => {
        console.error("Token Client Error:", error);
      }
    });

    // If we have a stored token, verify it via callback (or let app assume it's valid until 401)
    if (accessToken) {
      callback(accessToken);
    }
  } catch (e) {
    console.error("Failed to init token client", e);
  }
};

export const requestDriveToken = () => {
  if (tokenClient) {
    // Force prompt if we suspect issues, or use '' for auto-select if valid
    tokenClient.requestAccessToken({ prompt: '' });
  } else {
    console.error("Token Client not initialized. Re-initializing...");
    // Attempt re-init
    initDriveAuth(() => {
      if (tokenClient) tokenClient.requestAccessToken();
    });
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
  const fileBlob = new Blob([fileContent], { type: 'application/json' });
  const metadataBlob = new Blob([JSON.stringify(fileMetadata)], { type: 'application/json; charset=UTF-8' });

  // STRICT ORDER: Metadata MUST be the first part
  const form = new FormData();
  form.append('metadata', metadataBlob);
  form.append('file', fileBlob);

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
         accessToken = null;
         throw new Error("Token expired");
     }
     const errText = await response.text();
     throw new Error(`Failed to save project: ${response.status} ${errText}`);
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
  
    if (!response.ok) {
       if (response.status === 401) {
          localStorage.removeItem('obscura_drive_token');
          accessToken = null;
       }
       throw new Error("Failed to update project");
    }
};

export const listProjectsFromDrive = async (): Promise<DriveFile[]> => {
    if (!accessToken) throw new Error("No Access Token");
    
    // Query: Not in trash AND has property app='obscura'
    const query = "trashed = false and properties has { key='app', value='obscura' }";
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, modifiedTime)`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
             localStorage.removeItem('obscura_drive_token');
             accessToken = null;
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

    if (!response.ok) {
      if (response.status === 401) {
         localStorage.removeItem('obscura_drive_token');
         accessToken = null;
         throw new Error("Token expired");
      }
      throw new Error("Failed to load project content");
    }
    
    return await response.json();
};