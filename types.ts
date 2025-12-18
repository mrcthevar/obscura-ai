
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
  icon: string;
  description: string;
  requiresImage: boolean;
  requiresText: boolean;
  steps: string[];
}

export interface StoryboardFrame {
  frameNumber: number;
  svg: string;
  description: string;
  shotType: string;
  cameraMovement: string;
  focalLength: string;
  dof: string;
  composition: string;
  lightingNotes: string;
  blocking: string;
  emotionalIntent: string;
  timing: string;
  generatedImage?: string;
}

export interface ProjectData {
  id?: string;
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

export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Augment Window with process for compatibility with the runtime shim
    process: {
      env: {
        API_KEY?: string;
        [key: string]: string | undefined;
      };
    };
    // Note: 'aistudio' is provided by the runtime environment and does not need 
    // to be redeclared here to avoid modifier and type conflicts.
  }

  // Align with Vite's internal type requirements
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY?: string;
    readonly VITE_GOOGLE_CLIENT_ID?: string;
    readonly [key: string]: string | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Global 'process' and 'window.aistudio' are assumed to be provided by the runtime 
// environment or shimmed (see index.tsx). Redeclaring them here caused 
// TypeScript compilation errors due to conflicts with existing definitions.
