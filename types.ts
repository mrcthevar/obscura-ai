
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
  /**
   * Consolidating global augmentations into a single location.
   * Removing the explicit 'var process' declaration to avoid "Cannot redeclare block-scoped variable" 
   * when process is already provided by environment types or shims.
   */
  interface Window {
    /**
     * Augmenting window with process for the runtime shim access.
     */
    process: any;
    
    /**
     * Augmenting window with aistudio to satisfy TS2339.
     */
    aistudio: AIStudio;
    
    /**
     * Google Identity Services (GSI) global.
     */
    google: any;

    /**
     * html2canvas for PDF export.
     */
    html2canvas: any;

    /**
     * jspdf for PDF export.
     */
    jspdf: any;
  }

  /**
   * Augmenting ImportMeta to align with Vite's expected environment types.
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
