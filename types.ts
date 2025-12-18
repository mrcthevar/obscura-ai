
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

declare global {
  /**
   * GLOBAL PROCESS DECLARATION
   * Using NodeJS namespace augmentation to define process.env properties.
   * This avoids "Cannot redeclare block-scoped variable 'process'" errors
   * when process is already defined by the environment or other type definitions.
   */
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
      API_KEY?: string;
      VITE_GOOGLE_CLIENT_ID?: string;
    }
    interface Process {
      env: ProcessEnv;
    }
  }

  // The global 'process' variable should be picked up from the environment.
  // We use augmentation instead of a new 'var process' to avoid block-scope conflicts.

  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    process: any;
    aistudio?: AIStudio;
    google: any;
    html2canvas: any;
    jspdf: any;
  }
}
