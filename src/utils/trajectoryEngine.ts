import { FrameAnalysis, MediaPipeLandmark } from '../types';
import { PoseLandmarkSmoother } from './oneEuroFilter';

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  frameNumber: number;
}

export class KineticPathProcessor {
  private smoother: PoseLandmarkSmoother;

  constructor() {
    // Tighter smoothing for trajectories specifically
    this.smoother = new PoseLandmarkSmoother(0.8, 0.005);
  }

  smoothTrajectoryHistory(history: { landmarks: MediaPipeLandmark[]; ruleResults: any }[]): { landmarks: MediaPipeLandmark[]; ruleResults: any }[] {
    this.smoother.reset();
    return history.map((item, index) => ({
      ...item,
      landmarks: this.smoother.smooth(item.landmarks, index * (1/30)) // Assuming 30FPS
    }));
  }

  extractAndSmoothTrajectory(frames: FrameAnalysis[], jointIndex: number): TrajectoryPoint[] {
    this.smoother.reset();
    
    // Smooth the entire sequence of landmarks first to get stable trajectories
    const smoothedFrames = frames.map(frame => {
      return {
        ...frame,
        landmarks: this.smoother.smooth(frame.landmarks, frame.timestamp)
      };
    });

    return smoothedFrames
      .filter(frame => frame.landmarks[jointIndex] !== undefined)
      .map(frame => {
        const lm = frame.landmarks[jointIndex];
        return {
          x: lm.x,
          y: lm.y,
          z: lm.z || 0,
          timestamp: frame.timestamp,
          frameNumber: frame.frameNumber
        };
      });
  }
}
