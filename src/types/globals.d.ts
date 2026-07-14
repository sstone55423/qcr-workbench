// Ambient declarations for browser APIs not yet in TypeScript's dom lib and
// for Vite's import suffixes. Type-checking support only — no runtime effect.

// File System Access API (Chromium; feature-detected before use)
interface Window {
  showSaveFilePicker?: (options?: any) => Promise<any>;
  showDirectoryPicker?: (options?: any) => Promise<any>;
}

// WebGPU (feature-detected in localAI.js before use)
interface Navigator {
  gpu?: any;
}

// Vite import suffixes
declare module '*?url' {
  const url: string;
  export default url;
}
declare module '*.md?raw' {
  const content: string;
  export default content;
}

// Vite's glob import (used for lazy-loaded translated docs)
interface ImportMeta {
  glob: (pattern: string, options?: { query?: string; import?: string; eager?: boolean }) =>
    Record<string, () => Promise<string>>;
}
