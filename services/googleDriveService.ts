import { ProjectData, DriveFile } from '../types';

declare global {
  interface Window {
    google: any;
  }
}

const getClientId = () => {
  return import.meta.env?.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('obscura_client_id') || '';
};

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let tokenClient: any;
let accessToken: string | null = localStorage.getItem('obscura_drive_token');

const waitForGoogleScript = async () => {
  let attempts = 0;
  while (!window.google && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }
  return !!window.google;
};

export const initDriveAuth = async (callback: (token: string) => void) => {
  const currentClientId = getClientId();
  if (!currentClientId) return;

  const isLoaded = await waitForGoogleScript();
  if (!isLoaded) return;

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
      error_callback: (error: any) => console.error("Drive Auth Error:", error)
    });

    if (accessToken) callback(accessToken);
  } catch (e) {
    console.error("Failed to init token client", e);
  }
};

export const requestDriveToken = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: '' });
  } else {
    initDriveAuth(() => { if (tokenClient) tokenClient.requestAccessToken(); });
  }
};

export const hasDriveToken = () => !!accessToken;

export const saveProjectToDrive = async (project: ProjectData): Promise<string> => {
  if (!accessToken) throw new Error("No Access Token");

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
         throw new Error("Token expired");
     }
     throw new Error(`Save failed: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
};

export const updateProjectOnDrive = async (fileId: string, project: ProjectData): Promise<void> => {
    if (!accessToken) throw new Error("No Access Token");
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)
    });
    if (!response.ok) {
       if (response.status === 401) {
          localStorage.removeItem('obscura_drive_token');
          accessToken = null;
       }
       throw new Error("Update failed");
    }
};

export const listProjectsFromDrive = async (): Promise<DriveFile[]> => {
    if (!accessToken) throw new Error("No Access Token");
    const query = "trashed = false and properties has { key='app', value='obscura' }";
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, modifiedTime)`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("List failed");
    const data = await response.json();
    return data.files || [];
};

export const loadProjectFromDrive = async (fileId: string): Promise<ProjectData> => {
    if (!accessToken) throw new Error("No Access Token");
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("Load failed");
    return await response.json();
};