import type { ReactNode, ComponentProps } from 'react';

/** MindAR image-target Controller (imported from mind-ar internals) */
export interface MindARController {
  inputWidth: number;
  inputHeight: number;
  onUpdate: ((data: TrackingUpdateData) => void) | null;
  addImageTargets: (src: string) => Promise<{ dimensions: [number, number][] }>;
  dummyRun: (video: HTMLVideoElement) => Promise<void>;
  processVideo: (video: HTMLVideoElement) => void;
  stopProcessVideo: () => void;
  getProjectionMatrix: () => number[];
  dispose?: () => void;
  processingVideo?: boolean;
}

export interface MindARControllerConstructor {
  new (options: {
    inputWidth: number;
    inputHeight: number;
    maxTrack?: number;
    filterMinCF?: number | null;
    filterBeta?: number | null;
    warmupTolerance?: number | null;
    missTolerance?: number | null;
    onUpdate?: ((data: TrackingUpdateData) => void) | null;
    debugMode?: boolean;
  }): MindARController;
}

export interface TrackingUpdateData {
  type: 'updateMatrix' | 'processDone';
  targetIndex?: number;
  worldMatrix?: number[] | null;
}

export interface AnchorState {
  matrix: number[] | null;
  visible: boolean;
}

export interface ARContextValue {
  anchors: Map<number, AnchorState>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  switchCamera: () => void;
  isTracking: boolean;
  isReady: boolean;
}

export interface ARProviderProps {
  children?: ReactNode;
  /** URL to the .mind image target file */
  imageTargets: string;
  /** Maximum number of simultaneous targets to track (default: 1) */
  maxTrack?: number;
  /** One Euro Filter min cutoff frequency */
  filterMinCF?: number | null;
  /** One Euro Filter beta */
  filterBeta?: number | null;
  /** Number of frames to wait before showing a target */
  warmupTolerance?: number | null;
  /** Number of frames to wait before hiding a lost target */
  missTolerance?: number | null;
  /** Auto-start tracking when ready (default: true) */
  autoplay?: boolean;
  /** Use user-facing camera (default: false for image tracking) */
  flipUserCamera?: boolean;
  /** Callback when AR is ready */
  onReady?: () => void;
  /** Callback on error */
  onError?: (error: Error | DOMException) => void;
}

export interface ARViewProps extends ARProviderProps {
  /** Additional props passed to R3F Canvas */
  canvasProps?: Record<string, unknown>;
}

export interface ARAnchorProps extends Omit<ComponentProps<'group'>, 'visible'> {
  children?: ReactNode;
  /** Target index to anchor to (default: 0) */
  target?: number;
  /** Callback when target is found */
  onAnchorFound?: () => void;
  /** Callback when target is lost */
  onAnchorLost?: () => void;
}
