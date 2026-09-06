import { MediaPipeLandmark } from '../types';

/**
 * Anatomical Kinematic Bone Constraint and Stabilization Engine
 * 
 * Locks segment lengths (femur, tibia, humerus, radius, torso) to prevent
 * single-frame joint spikes, perspective exploding, or "giant skeletons".
 */

export interface BoneSegment {
  p1: number;
  p2: number;
  name: string;
}

export const ANATOMICAL_BONES: BoneSegment[] = [
  // Torso
  { p1: 11, p2: 12, name: 'shoulders' },
  { p1: 23, p2: 24, name: 'hips' },
  { p1: 11, p2: 23, name: 'left_torso' },
  { p1: 12, p2: 24, name: 'right_torso' },

  // Left Arm
  { p1: 11, p2: 13, name: 'left_upper_arm' },
  { p1: 13, p2: 15, name: 'left_forearm' },

  // Right Arm
  { p1: 12, p2: 14, name: 'right_upper_arm' },
  { p1: 14, p2: 16, name: 'right_forearm' },

  // Left Leg
  { p1: 23, p2: 25, name: 'left_femur' },
  { p1: 25, p2: 27, name: 'left_tibia' },

  // Right Leg
  { p1: 24, p2: 26, name: 'right_femur' },
  { p1: 26, p2: 28, name: 'right_tibia' },
];

export class KinematicBoneStabilizer {
  private baselineBoneLengths: Map<string, number> = new Map();
  private calibrationFramesCount: number = 0;
  private maxCalibrationFrames: number = 8;

  /**
   * Calculates 3D or 2D Euclidean distance between two keypoints
   */
  private getDistance(ptA: MediaPipeLandmark, ptB: MediaPipeLandmark): number {
    const dx = ptA.x - ptB.x;
    const dy = ptA.y - ptB.y;
    const dz = (ptA.z || 0) - (ptB.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Stabilizes incoming landmarks by clamping bone lengths to anatomical baseline.
   */
  stabilize(landmarks: MediaPipeLandmark[]): MediaPipeLandmark[] {
    if (!landmarks || landmarks.length < 33) return landmarks;

    // Clone landmarks so we don't mutate input by reference
    const stabilized = landmarks.map(lm => ({ ...lm }));

    // 1. Calibration Phase (First N valid frames establish the athlete's anatomical proportions)
    if (this.calibrationFramesCount < this.maxCalibrationFrames) {
      ANATOMICAL_BONES.forEach(bone => {
        const p1 = stabilized[bone.p1];
        const p2 = stabilized[bone.p2];
        if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
          const dist = this.getDistance(p1, p2);
          const currentAvg = this.baselineBoneLengths.get(bone.name);
          if (currentAvg === undefined) {
            this.baselineBoneLengths.set(bone.name, dist);
          } else {
            // Running average
            this.baselineBoneLengths.set(bone.name, (currentAvg * 0.7) + (dist * 0.3));
          }
        }
      });
      this.calibrationFramesCount++;
      return stabilized;
    }

    // 2. Active Inverse Kinematics Bone Length Clamping
    // Hierarchical pass: Root (Torso) -> Upper Limbs -> Lower Limbs
    const enforceBone = (parentIdx: number, childIdx: number, boneName: string, maxStretch = 0.20) => {
      const parent = stabilized[parentIdx];
      const child = stabilized[childIdx];
      const baseLen = this.baselineBoneLengths.get(boneName);

      if (!parent || !child || !baseLen || baseLen === 0) return;

      const currentDist = this.getDistance(parent, child);
      if (currentDist === 0) return;

      // In perspective, a bone can foreshorten (appear shorter), but it CANNOT physically stretch longer
      const maxAllowedDist = baseLen * (1 + maxStretch);
      const minAllowedDist = baseLen * 0.25; // extreme foreshortening limit

      if (currentDist > maxAllowedDist) {
        // Clamp child joint back along the ray from parent to child
        const scale = maxAllowedDist / currentDist;
        child.x = parent.x + (child.x - parent.x) * scale;
        child.y = parent.y + (child.y - parent.y) * scale;
        if (child.z !== undefined && parent.z !== undefined) {
          child.z = parent.z + (child.z - parent.z) * scale;
        }
      } else if (currentDist < minAllowedDist) {
        const scale = minAllowedDist / currentDist;
        child.x = parent.x + (child.x - parent.x) * scale;
        child.y = parent.y + (child.y - parent.y) * scale;
      }
    };

    // Upper Body
    enforceBone(11, 13, 'left_upper_arm');
    enforceBone(13, 15, 'left_forearm');
    enforceBone(12, 14, 'right_upper_arm');
    enforceBone(14, 16, 'right_forearm');

    // Lower Body
    enforceBone(23, 25, 'left_femur');
    enforceBone(25, 27, 'left_tibia');
    enforceBone(24, 26, 'right_femur');
    enforceBone(26, 28, 'right_tibia');

    return stabilized;
  }

  reset() {
    this.baselineBoneLengths.clear();
    this.calibrationFramesCount = 0;
  }
}

export class TemporalSmoother {
  private history: MediaPipeLandmark[][] = [];
  private maxHistory = 3;

  smooth(landmarks: MediaPipeLandmark[]): MediaPipeLandmark[] {
    if (!landmarks || landmarks.length < 33) return landmarks;
    
    const smoothed = landmarks.map(lm => ({ ...lm }));
    
    if (this.history.length === 0) {
      this.history.push(smoothed);
      return smoothed;
    }

    const prev = this.history[this.history.length - 1];
    const prev2 = this.history.length > 1 ? this.history[this.history.length - 2] : prev;

    for (let i = 0; i < smoothed.length; i++) {
      if (smoothed[i].visibility && smoothed[i].visibility! < 0.3) {
        continue;
      }
      // Simple Kalman-like alpha-beta filter or Savitzky-Golay inspired
      // Smoothed = 0.5 * current + 0.3 * prev + 0.2 * prev2
      smoothed[i].x = (smoothed[i].x * 0.5) + (prev[i].x * 0.3) + (prev2[i].x * 0.2);
      smoothed[i].y = (smoothed[i].y * 0.5) + (prev[i].y * 0.3) + (prev2[i].y * 0.2);
      if (smoothed[i].z !== undefined && prev[i].z !== undefined && prev2[i].z !== undefined) {
        smoothed[i].z = (smoothed[i].z! * 0.5) + (prev[i].z! * 0.3) + (prev2[i].z! * 0.2);
      }
    }

    this.history.push(smoothed);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return smoothed;
  }

  reset() {
    this.history = [];
  }
}
