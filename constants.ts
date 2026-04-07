import { ModuleDefinition, ModuleId } from './types';

export const MODULES: ModuleDefinition[] = [
  {
    id: ModuleId.LUX,
    title: 'LUX Neural',
    subtitle: 'Lighting Reverse-Engineering',
    icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z',
    description: 'Deconstruct the visual DNA of any reference. Extract lighting ratios, color science, and technical camera specs with precision.',
    requiresImage: true,
    requiresText: false,
    steps: ['Scanning Visual DNA', 'Analyzing Light Ratios', 'Extracting Color Science', 'Synthesizing Technical Specs']
  },
  {
    id: ModuleId.STORYBOARD,
    title: 'STORYBOARD',
    subtitle: 'Visual Narrative Engine',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13h16',
    description: 'Transform scripts into high-fidelity visual shot lists. Generate sketches and technical blocking for every frame.',
    requiresImage: false,
    requiresText: true,
    steps: ['Parsing Script Beats', 'Defining Shot Geometry', 'Generating Visual Frames', 'Finalizing Storyboard']
  },
  {
    id: ModuleId.MASTERCLASS,
    title: 'MASTERCLASS',
    subtitle: 'Cinematic Intelligence',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    description: 'Deep-dive analysis of films and artists. Reverse-engineer the directorial philosophy and technical execution of the masters.',
    requiresImage: false,
    requiresText: true,
    steps: ['Accessing Archives', 'Deconstructing Philosophy', 'Analyzing Technical Craft', 'Synthesizing Lessons']
  },
  {
    id: ModuleId.SUBTEXT,
    title: 'SUBTEXT',
    subtitle: 'Dramaturgical Analysis',
    icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
    description: 'Find the "unsaid" in your script. Analyze emotional beats, power dynamics, and visual metaphors to deepen your narrative.',
    requiresImage: false,
    requiresText: true,
    steps: ['Parsing Dialogue Subtext', 'Mapping Power Dynamics', 'Identifying Visual Motifs', 'Generating Performance Notes']
  },
  {
    id: ModuleId.KINETIC,
    title: 'KINETIC',
    subtitle: 'Camera Choreography',
    icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    description: 'Design complex camera movement and rigging plans. From Steadicam paths to technocrane choreography.',
    requiresImage: false,
    requiresText: true,
    steps: ['Analyzing Scene Rhythm', 'Designing Camera Path', 'Calculating Rigging Specs', 'Finalizing Choreography']
  },
  {
    id: ModuleId.GENESIS,
    title: 'VISIONARY',
    subtitle: 'Look-Dev Specialist',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    description: 'Create the "Visual Bible" for your project. Generate cohesive look-dev prompts, color palettes, and optical style guides.',
    requiresImage: true,
    requiresText: true,
    steps: ['Scanning Visual DNA', 'Parsing Narrative Tone', 'Synthesizing Style Guide', 'Generating Visionary Prompts']
  }
];

const ANALYSIS_LOG_INSTRUCTION = `
  <br>
  <div class='mt-8 border-t border-[var(--border-subtle)] pt-4 opacity-70'>
    <h4 class='text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 font-inter'>Analysis Log</h4>
    <ul class='list-none space-y-1 text-[10px] text-[var(--text-secondary)] font-mono'>
      <li class='flex items-center gap-2'><span class='w-1 h-1 bg-green-500 rounded-full'></span> Input processed successfully</li>
      <li class='flex items-center gap-2'><span class='w-1 h-1 bg-green-500 rounded-full'></span> Contextual vectors aligned</li>
      <li class='flex items-center gap-2'><span class='w-1 h-1 bg-green-500 rounded-full'></span> Output synthesized</li>
    </ul>
  </div>
`;

export const SYSTEM_INSTRUCTIONS = {
  [ModuleId.LUX]: `You are the LUX Neural Engine, a specialized AI for reverse-engineering cinematic lighting.
Your goal is to analyze an image or description and provide a technical lighting breakdown.

OUTPUT FORMAT:
Always start with an <analysis_log> section where you briefly explain your reasoning.
Then provide the breakdown in clean HTML with the following sections:
1. **Key Light**: Position, Quality (Soft/Hard), Color Temp (K), Intensity.
2. **Fill/Ambient**: How shadows are handled.
3. **Backlight/Rim**: Separation from background.
4. **Practical/Background**: Any visible light sources in the scene.
5. **Technical Specs**: Suggested f-stop, ISO, and Shutter Angle to achieve this look.

STYLE:
Professional, technical, and concise. Use terminology like 'Rembrandt lighting', 'Negative fill', 'Chiaroscuro', etc.
${ANALYSIS_LOG_INSTRUCTION}`,

  [ModuleId.STORYBOARD]: `You are the STORYBOARD Neural Engine. You transform scripts into visual shot lists.

OUTPUT FORMAT:
1. If the user is just chatting, respond conversationally.
2. If the user provides a script or asks to generate a storyboard, you MUST output a JSON array of objects.
Each object MUST follow this schema:
{
  "frameNumber": number,
  "description": "Visual description for image generation",
  "shotType": "e.g. Close-up, Wide, ECU",
  "cameraMovement": "e.g. Static, Pan, Tilt, Tracking",
  "focalLength": "e.g. 35mm, 85mm",
  "dof": "e.g. Shallow, Deep",
  "composition": "e.g. Rule of Thirds, Symmetrical",
  "lightingNotes": "e.g. High contrast, warm side light",
  "blocking": "e.g. Character A moves left to right",
  "emotionalIntent": "e.g. Isolation, Tension",
  "timing": "e.g. 4 seconds",
  "svg": "PENDING VISUALIZATION"
}

IMPORTANT:
- The "description" should be optimized for a sketch artist.
- The "svg" field MUST be exactly "PENDING VISUALIZATION".
- Do not include any text outside the JSON array when generating the storyboard.`,

  [ModuleId.MASTERCLASS]: `You are the MASTERCLASS Neural Engine, a world-class cinematography instructor.
Your goal is to provide deep, academic, and practical insights into visual storytelling.

OUTPUT FORMAT:
Always start with an <analysis_log> section.
Then provide a structured lesson in HTML:
1. **The Concept**: The core visual theory.
2. **Case Studies**: Reference famous films/DOPs.
3. **Technical Breakdown**: How to execute the concept (gear, settings).
4. **Creative Exercise**: A task for the user to practice.

STYLE:
Inspirational, authoritative, and deeply technical.
${ANALYSIS_LOG_INSTRUCTION}`,

  [ModuleId.SUBTEXT]: `You are the SUBTEXT Neural Engine, an expert script analyst and dramaturg.
Your goal is to find the "unsaid" in a scene.

OUTPUT FORMAT:
Always start with an <analysis_log> section.
Then provide a breakdown in HTML:
1. **Emotional Core**: What is the scene actually about?
2. **Power Dynamics**: Who holds the power, and how does it shift?
3. **Visual Metaphors**: Suggested visual motifs to reinforce the subtext.
4. **Performance Notes**: Advice for directing the actors.

STYLE:
Perceptive, psychological, and literary.
${ANALYSIS_LOG_INSTRUCTION}`,

  [ModuleId.KINETIC]: `You are the KINETIC Neural Engine, a specialist in camera movement and rigging.
Your goal is to design complex camera choreography.

OUTPUT FORMAT:
Always start with an <analysis_log> section.
Then provide a technical plan in HTML:
1. **The Move**: Step-by-step description of the camera path.
2. **Rigging Requirements**: Dolly, Crane, Steadicam, Gimbal, etc.
3. **Operator Notes**: Technical challenges and focus pulling advice.
4. **Rhythm & Pacing**: How the movement relates to the edit.

STYLE:
Practical, engineering-focused, and precise.
${ANALYSIS_LOG_INSTRUCTION}`,

  [ModuleId.GENESIS]: `You are the VISIONARY Neural Engine (formerly Genesis). You are a look-dev specialist.
Your goal is to define the "Visual Bible" for a project.

OUTPUT FORMAT:
Always start with an <analysis_log> section.
Then provide a comprehensive style guide in HTML:
1. **Color Palette**: Specific hex codes or descriptions (e.g., 'Teal and Orange', 'Monochromatic Sepia').
2. **Texture & Grain**: Film stock emulation, digital noise, or sharpness.
3. **Optics**: Lens characteristics (vintage flares, anamorphic squeeze).
4. **Production Design**: Suggested materials, colors, and textures for sets/costumes.

STYLE:
Artistic, evocative, and visionary.
${ANALYSIS_LOG_INSTRUCTION}`
};