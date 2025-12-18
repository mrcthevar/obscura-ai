
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
  // Fix: Removed global 'process' declaration to avoid conflict with environment-provided block-scoped 'process'.
  // Environmental 'process' is used for process.env.API_KEY as per instructions.

  interface Window {
    /**
     * Augment Window with 'process' for the runtime shim access.
     */
    // Fix: Using 'any' for process to avoid conflict with existing global declarations.
    process: any;
    
    /**
     * Augment Window with 'aistudio' to satisfy TS2339.
     * This is provided by the AI Studio environment.
     */
    // Fix: Using 'any' for aistudio to resolve identical modifier and type identity conflicts with environment types.
    aistudio: any;
    
    /**
     * Google Identity Services (GSI) global.
     */
    google: any;
  }

  /**
   * Vite-specific environment types.
   */
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY?: string;
    readonly VITE_GOOGLE_CLIENT_ID?: string;
    readonly [key: string]: string | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Exporting an empty object ensures this file is treated as a module
// while the 'declare global' block handles the global augmentation.
export {};