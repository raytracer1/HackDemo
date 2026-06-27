export interface DemoData {
  id: string;
  title: string;
  status: string;
  videoUrl?: string;
  steps: StepData[];
}

export interface Highlight {
  type: string;
  elementText: string;
  elementRole: string;
  boundingRect: {
    x: number; y: number;
    width: number; height: number;
    top: number; left: number;
  } | null;
  viewport?: { width: number; height: number };
}

export interface StepData {
  index: number;
  description: string;
  narration: string | null;
  screenshotUrl: string;
  audioUrl: string | null;
  durationMs: number | null;
  startTime: number;
  endTime: number;
  stableTime: number | null;
  pageUrl: string;
  pageTitle: string;
  highlights: Highlight[];
}

export type SynthesisStatus =
  | 'idle'
  | 'loading_assets'
  | 'synthesizing'
  | 'completed'
  | 'error';
