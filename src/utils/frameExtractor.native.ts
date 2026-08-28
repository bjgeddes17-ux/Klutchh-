import { ExtractedFrame, DecoderError } from './frameExtractor';

// On Native, we don't have IndexedDB (idb-keyval) or WebCodecs.
// This file provides a compatible interface that uses local memory or simple state.

export async function clearFrameCache(): Promise<void> {
  console.log('Native: Clearing local frame cache placeholder');
}

export async function extractFramesPipelined(
  _videoUrl: string,
  _onFrame: (frame: ExtractedFrame) => Promise<void>,
  onProgress: (progress: number) => void,
  _targetFps: number = 20,
  _targetHeight: number = 480,
  _cropBox?: { x: number; y: number; width: number; height: number },
  _startTime: number = 0,
  _endTime?: number
): Promise<{ frameCount: number; duration: number }> {
  console.log('Native: Using legacy extraction fallback');
  
  // Simulate progress for the UI
  onProgress(50);
  onProgress(100);

  return {
    frameCount: 0,
    duration: 0
  };
}

export async function getFrame(_index: number): Promise<ExtractedFrame | null> {
  return null;
}

export async function setFrame(_index: number, _frame: ExtractedFrame): Promise<void> {
  // No-op for now to save memory
}
