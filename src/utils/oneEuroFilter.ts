import { MediaPipeLandmark } from '../types';

/**
 * 1-Euro Filter for Biomechanical Landmark Smoothing
 *
 * An adaptive low-pass filter specifically designed for noisy human motion tracking.
 * - At low speeds: high smoothing (eliminates landmark jitter/tremor).
 * - At high speeds: low smoothing (zero lag on fast athletic strikes, swings, and leaps).
 *
 * Reference: Casiez, Roussel, Vogel (CHI 2012) - "1 € Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Human-Computer Interaction"
 */
class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.y = value;
    this.s = alpha * value + (1 - alpha) * (this.s as number);
    return this.s;
  }

  hasLastRawValue(): boolean {
    return this.y !== null;
  }

  lastRawValue(): number {
    return this.y || 0;
  }

  reset() {
    this.y = null;
    this.s = null;
  }
}

class OneEuroFilter1D {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilt: LowPassFilter;
  private dxFilt: LowPassFilter;
  private lastTime: number | null = null;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilt = new LowPassFilter();
    this.dxFilt = new LowPassFilter();
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(value: number, timestampSec: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampSec;
      return this.xFilt.filter(value, 1.0);
    }

    const dt = Math.max(0.001, timestampSec - this.lastTime);
    this.lastTime = timestampSec;

    // Estimate derivative (speed)
    const dx = this.xFilt.hasLastRawValue()
      ? (value - this.xFilt.lastRawValue()) / dt
      : 0;
    const edx = this.dxFilt.filter(dx, this.alpha(this.dCutoff, dt));

    // Adapt cutoff frequency based on speed
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilt.filter(value, this.alpha(cutoff, dt));
  }

  reset() {
    this.xFilt.reset();
    this.dxFilt.reset();
    this.lastTime = null;
  }
}

export class PoseLandmarkSmoother {
  private filters: Map<number, { x: OneEuroFilter1D; y: OneEuroFilter1D; z: OneEuroFilter1D }> = new Map();
  private lastValidLandmarks: MediaPipeLandmark[] | null = null;
  private lastTimestamp: number = 0;

  constructor(
    private minCutoff: number = 1.0, // Tighter base cutoff for anti-jitter
    private beta: number = 0.005     // Adaptive smoothing for fast sports velocity
  ) {}

  smooth(landmarks: MediaPipeLandmark[], timestampSec: number): MediaPipeLandmark[] {
    if (!landmarks || landmarks.length === 0) return [];

    const dt = Math.max(0.001, timestampSec - (this.lastTimestamp || timestampSec));
    this.lastTimestamp = timestampSec;

    const smoothed = landmarks.map((lm, index) => {
      if (!this.filters.has(index)) {
        this.filters.set(index, {
          x: new OneEuroFilter1D(this.minCutoff, this.beta),
          y: new OneEuroFilter1D(this.minCutoff, this.beta),
          z: new OneEuroFilter1D(this.minCutoff, this.beta)
        });
      }

      const f = this.filters.get(index)!;
      let rawX = lm.x;
      let rawY = lm.y;
      let rawZ = lm.z || 0;

      // AWKWARD ANGLE & OCCLUSION CLAMPING:
      // If previous frame exists, clamp velocity to prevent erratic snaps during awkward joint rotations
      if (this.lastValidLandmarks && this.lastValidLandmarks[index]) {
        const prev = this.lastValidLandmarks[index];
        const maxDeltaPerSec = 4.5; // Maximum realistic joint speed in normalized screen space per second
        const maxDelta = maxDeltaPerSec * dt;

        const dx = rawX - prev.x;
        const dy = rawY - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDelta && dt < 0.2) {
          // Velocity violation (awkward occlusion jump) -> gently clamp towards previous position
          rawX = prev.x + (dx / dist) * maxDelta;
          rawY = prev.y + (dy / dist) * maxDelta;
        }
      }

      const smoothedX = f.x.filter(rawX, timestampSec);
      const smoothedY = f.y.filter(rawY, timestampSec);
      const smoothedZ = f.z.filter(rawZ, timestampSec);

      return {
        x: smoothedX,
        y: smoothedY,
        z: smoothedZ,
        visibility: lm.visibility
      };
    });

    this.lastValidLandmarks = smoothed;
    return smoothed;
  }

  reset() {
    this.filters.clear();
    this.lastValidLandmarks = null;
    this.lastTimestamp = 0;
  }
}
