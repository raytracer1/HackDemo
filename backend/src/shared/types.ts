// ── Extension upload payload ──

export interface Highlight {
  type: string;
  elementText: string;
  elementRole: string;
  boundingRect: {
    x: number; y: number;
    width: number; height: number;
    top: number; left: number;
  } | null;
}

export interface UploadStep {
  index: number;
  description: string;
  actionType: string;
  pageContext: {
    title: string;
    url: string;
  };
  startTime: number;
  endTime: number;
  highlights?: Highlight[];
}

export interface CreateDemoInput {
  title: string;
  steps: UploadStep[];
}

// ── Database row types ──

export type DemoStatus =
  | 'uploading'
  | 'processing_narration'
  | 'processing_audio'
  | 'completed'
  | 'failed';

export interface DemoRow {
  id: string;
  title: string;
  status: DemoStatus;
  created_at: Date;
  updated_at: Date;
}

export interface StepRow {
  id: string;
  demo_id: string;
  index: number;
  description: string;
  narration: string | null;
  screenshot_key: string;
  audio_key: string | null;
  duration_ms: number | null;
  start_time: number;
  end_time: number;
  page_url: string;
  page_title: string;
  highlights: Highlight[];
  created_at: Date;
}

// ── API response types ──

export interface DemoResponse {
  id: string;
  title: string;
  status: string;
  steps: StepResponse[];
}

export interface StepResponse {
  index: number;
  description: string;
  narration: string | null;
  screenshotUrl: string;
  audioUrl: string | null;
  durationMs: number | null;
  startTime: number;
  endTime: number;
  pageUrl: string;
  pageTitle: string;
  highlights: Highlight[];
}
