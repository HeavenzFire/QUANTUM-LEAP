export interface ChartDataPoint {
  label: string;
  value: number;
  unit?: string;
}

export interface LeapManifest {
  summary: string;
  chartTitle: string;
  chartData: ChartDataPoint[];
  imagePrompt: string;
  audioScript: string;
  colors: string[];
}

export interface LeapState {
  status: 'idle' | 'analyzing' | 'generating_media' | 'complete' | 'error';
  manifest: LeapManifest | null;
  imageData: string | null; // Base64
  audioBuffer: AudioBuffer | null;
  error?: string;
}

export enum ModelNames {
  TEXT = 'gemini-2.5-flash',
  IMAGE = 'gemini-2.5-flash-image',
  AUDIO = 'gemini-2.5-flash-preview-tts'
}