
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

// Fixed: Defined AIStudio interface centrally to ensure consistent usage in global declarations.
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Fixed: Updated process definition to match the shim implemented in index.tsx.
    process: {
      env: {
        API_KEY?: string;
        [key: string]: string | undefined;
      };
    };
    // Fixed: Assigned AIStudio interface to ensure identical property types across all declarations.
    aistudio: AIStudio;
  }
  
  // Fixed: Extended ImportMeta globally to include the 'env' property for Vite compatibility.
  interface ImportMeta {
    readonly env: Record<string, string | undefined>;
  }
  
  // Fixed: Used any for process to avoid block-scoped redeclaration conflicts in environments with pre-existing process types.
  var process: any;
}
