
import { ProjectData, DriveFile } from '../types';

/**
 * Robust Client ID retrieval from either Vite's build-time env 
 * or our runtime Neural Shim.
 */
const getClientId = (): string => {
  const win = window as any;
  const id = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
             win.process?.env?.VITE_GOOGLE_CLIENT_ID || '';
  return id;
};

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let tokenClient: any = null;
let accessToken: string | null = localStorage.getItem('obscura_drive_token');

/**
 * Polls for the Google identity library to ensure we don't 
 * initialize too early.
 */
const waitForGoogleScript = async (): Promise<boolean> => {
  let attempts = 0;
  while (!(window as any).google?.accounts?.oauth2 && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }
  return !!(window as any).google?.accounts?.oauth2;
};

export const initDriveAuth = async (callback: (token: string) => void) => {
  const currentClientId = getClientId();
  console.log("Vault Init: Client ID loaded:", currentClientId ? `${currentClientId.slice(0, 15)}...` : "MISSING");

  if (!currentClientId) {
    console.warn("Vault Sync Unavailable: Missing VITE_GOOGLE_CLIENT_ID");
    alert("Configuration Error: VITE_GOOGLE_CLIENT_ID is missing.");
    return;
  }

  const isLoaded = await waitForGoogleScript();
  if (!isLoaded) {
    console.error("Google Auth Script Timeout.");
    return;
  }

  try {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: currentClientId,
      scope: SCOPES,
      ux_mode: 'popup',
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          accessToken = tokenResponse.access_token;
          localStorage.setItem('obscura_drive_token', accessToken!);
          callback(accessToken!);
        }
      },
      error_callback: (error: any) => {
        console.error("Vault Auth Fault:", error);
        // Specifically catch origin mismatch or access denied errors
        // Note: If the popup shows a 403, this callback might not even fire.
        if (error.type === 'access_denied' || (error.message && error.message.includes('access_denied'))) {
            alert(
                `ACCESS BLOCKED: Origin Mismatch.\n\n` +
                `The domain "${window.location.origin}" is not authorized.\n\n` +
                `TROUBLESHOOTING:\n` +
                `1. Go to Google Cloud Console > Credentials.\n` +
                `2. Add "${window.location.origin}" to Authorized Origins.\n` +
                `3. CRITICAL: Ensure there is NO trailing slash (e.g., .dev NOT .dev/).\n` +
                `4. Wait 5-10 minutes for changes to propagate.`
            );
        }
      }
    });

    // If we already have a cached token, notify the app immediately
    if (accessToken) {
      callback(accessToken);
    }
  } catch (e) {
    console.error("Neural Link Init Error:", e);
  }
};

/**
 * Triggers the Google OAuth consent flow.
 */
export const requestDriveToken = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    initDriveAuth((token) => {
      if (tokenClient) tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }
};

export const hasDriveToken = () => !!accessToken;

/**
 * Saves a new project file to the user's Google Drive.
 */
export const saveProjectToDrive = async (project: ProjectData): Promise<string> => {
  if (!accessToken) throw new Error("Terminal Unauthorized: Requesting Token...");

  const metadata = {
    name: `${project.name}.json`,
    mimeType: 'application/json',
    properties: { app: 'obscura', type: 'project_file' }
  };

  const boundary = '-------OBSCURA_UPLOAD_BOUNDARY-------';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  const body = 
    delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) +
    delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(project) +
    close_delim;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: body
  });

  if (!response.ok) {
     if (response.status === 401) {
         localStorage.removeItem('obscura_drive_token');
         accessToken = null;
         throw new Error("Neural link expired. Re-authenticate.");
     }
     throw new Error(`Sync Error: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
};

export const updateProjectOnDrive = async (fileId: string, project: ProjectData): Promise<void> => {
    if (!accessToken) return;
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)
    });
    if (!response.ok && response.status === 401) {
      localStorage.removeItem('obscura_drive_token');
      accessToken = null;
    }
};

export const listProjectsFromDrive = async (): Promise<DriveFile[]> => {
    if (!accessToken) throw new Error("Vault Locked");
    const query = "trashed = false and properties has { key='app', value='obscura' }";
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, modifiedTime)`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("Manifest retrieval failed.");
    const data = await response.json();
    return data.files || [];
};

export const loadProjectFromDrive = async (fileId: string): Promise<ProjectData> => {
    if (!accessToken) throw new Error("Vault Locked");
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("Archive retrieval failed.");
    return await response.json();
};
