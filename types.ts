

export enum AppState {
  LANDING = 'LANDING',
  GATEKEEPER = 'GATEKEEPER',
  DASHBOARD = 'DASHBOARD'
}

export enum ModuleId {
  LUX = 'LUX',
  STORYBOARD = 'STORYBOARD',
  MASTERCLASS = 'MASTERCLASS',
  SUBTEXT = 'SUBTEXT',
  KINETIC = 'KINETIC',
  GENESIS = 'GENESIS'
}

export interface UserProfile {
  name: string;
  email?: string | null;
  picture?: string;
  isGuest: boolean;
}

export interface ModuleDefinition {
  id: ModuleId;
  title: string;
  subtitle: string;
  icon: string; // SVG path data or simple identifier
  description: string;
  requiresImage: boolean;
  requiresText: boolean;
  steps: string[]; // Visual steps for thinking mode
}

export interface GeminiResponse {
  content: string; // HTML or JSON string
  isError: boolean;
}

export interface StoryboardFrame {
  frameNumber: number;
  svg: string;
  description: string;
  shotType: string;
  cameraMovement: string;
  focalLength: string;
  dof: string; // Depth of field
  composition: string;
  lightingNotes: string;
  blocking: string;
  emotionalIntent: string;
  timing: string;
  generatedImage?: string; // Base64 Data URL of AI Generated Image
}

export interface ProjectData {
  id?: string; // Google Drive File ID
  name: string;
  lastModified: number;
  moduleHistory: Record<string, string[]>;
  version: string;
}

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

declare global {
  // Removed conflicting process declaration as it is provided by the execution context environment
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY?: string;
    readonly VITE_GOOGLE_CLIENT_ID?: string;
    [key: string]: string | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}