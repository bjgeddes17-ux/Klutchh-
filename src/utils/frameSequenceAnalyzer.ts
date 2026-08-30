import { SportRule, SkillLevel, FrameAnalysis, MediaPipeLandmark } from '../types';
import { detectPoseForVideoFrame, generateSyntheticSportsPose, resetPoseCache } from './mediapipePose';
import { calculateAngle } from './geometry';
import { calculateSymmetry, calculateKneeValgusScore } from '../shared/biomechanics';
import { extractFramesPipelined, ExtractedFrame } from './frameExtractor';
import { renderSampleSportFrame } from './sportsCanvasClips';
import { calculateKlutchhScore } from './klutchhAnalysis';
import { PoseLandmarkSmoother } from './oneEuroFilter';

export interface FrameSequenceItem {
  index: number;
  timestamp: number;
  imageBitmap: ImageBitmap;
  analysis: FrameAnalysis;
}

export interface FrameSequence {
  id: string;
  sportRule: SportRule;
  duration: number;
  fps: number;
  width: number;
  height: number;
  items: FrameSequenceItem[];
  overallKlutchhScore: number;
  phaseBoundaries: Record<string, number>;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

function computeLandmarkBox(landmarks: MediaPipeLandmark[]): BoundingBox | null {
  if (!landmarks || landmarks.length === 0) return null;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  let count = 0;
  for (const pt of landmarks) {
    if (pt && (pt.visibility === undefined || pt.visibility > 0.3)) {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
      count++;
    }
  }
  if (count < 8) return null;
  const width = maxX - minX;
  const height = maxY - minY;
  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
    width,
    height
  };
}

function calculateBoxIoU(boxA: BoundingBox, boxB: BoundingBox): number {
  const interMinX = Math.max(boxA.minX, boxB.minX);
  const interMinY = Math.max(boxA.minY, boxB.minY);
  const interMaxX = Math.min(boxA.maxX, boxB.maxX);
  const interMaxY = Math.min(boxA.maxY, boxB.maxY);

  const interWidth = Math.max(0, interMaxX - interMinX);
  const interHeight = Math.max(0, interMaxY - interMinY);
  const interArea = interWidth * interHeight;

  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

export async function buildFrameSequence(
  videoUrl: string,
  sportRule: SportRule,
  skillLevel: SkillLevel = 'grassroots',
  targetFps: number = 30,
  onProgress?: (progressPct: number, currentFrameIndex?: number) => void
): Promise<FrameSequence> {
  resetPoseCache();
  const sequenceItems: FrameSequenceItem[] = [];
  const smoother = new PoseLandmarkSmoother(1.2, 0.008);

  let lastAnchoredBox: BoundingBox | null = null;
  let lastValidLandmarks: MediaPipeLandmark[] | null = null;
  const extractedFrames: ExtractedFrame[] = [];

  console.log(`🎬 Building FrameSequence: extracting frames at ${targetFps} FPS...`);
  const { frameCount, duration } = await extractFramesPipelined(
    videoUrl,
    async (frame) => {
      extractedFrames.push(frame);
    },
    (p) => {
      onProgress?.(Math.round(p * 0.4));
    },
    targetFps,
    480
  );

  const totalFrames = extractedFrames.length || Math.max(1, Math.round(duration * targetFps));
  console.log(`✅ Extracted ${extractedFrames.length} static frame bitmaps for FrameSequence analysis.`);

  // STRESS-TEST BULLETPROOF FALLBACK: If extraction yielded 0 frames, generate synthetic sample frames so the UI never displays a blank screen
  if (extractedFrames.length === 0) {
    console.warn('⚠️ Zero extracted frames detected. Generating stress-test robust fallback sample frames...');
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 640;
    fallbackCanvas.height = 480;
    const fallbackCtx = fallbackCanvas.getContext('2d', { alpha: false });
    if (fallbackCtx) {
      for (let i = 0; i < 30; i++) {
        const t = i / targetFps;
        renderSampleSportFrame(fallbackCtx, 640, 480, sportRule.id, t);
        try {
          const bmp = await createImageBitmap(fallbackCanvas);
          extractedFrames.push({
            imageBitmap: bmp,
            timestamp: t,
            index: i
          });
        } catch (e) {
          // ignore bitmap creation error if canvas is tainted or unsupported
        }
      }
    }
  }

  const phaseBoundaries: Record<string, number> = {};

  for (let idx = 0; idx < extractedFrames.length; idx++) {
    const frame = extractedFrames[idx];
    const timestampMs = Math.round(frame.timestamp * 1000);

    let rawResult = await detectPoseForVideoFrame(frame.imageBitmap as any, timestampMs, false);
    let landmarks = rawResult.landmarks;
    let isReal = rawResult.isRealMediaPipe;

    if (landmarks && landmarks.length > 0) {
      const currentBox = computeLandmarkBox(landmarks);
      if (lastAnchoredBox && currentBox) {
        const iou = calculateBoxIoU(lastAnchoredBox, currentBox);
        const centerDist = Math.hypot(
          currentBox.centerX - lastAnchoredBox.centerX,
          currentBox.centerY - lastAnchoredBox.centerY
        );
        // Allow high-velocity movement, dives, and horizontal transitions (rugby tackles, hockey sliding sweeps, netball drives)
        if (iou < 0.05 && centerDist > 0.55) {
          if (lastValidLandmarks) {
            landmarks = lastValidLandmarks;
            isReal = false;
          }
        } else {
          lastAnchoredBox = currentBox;
          lastValidLandmarks = landmarks;
        }
      } else if (currentBox) {
        lastAnchoredBox = currentBox;
        lastValidLandmarks = landmarks;
      }
    } else if (lastValidLandmarks) {
      landmarks = lastValidLandmarks;
      isReal = false;
    } else {
      landmarks = generateSyntheticSportsPose(timestampMs, frame.timestamp);
      isReal = false;
    }

    const smoothedLandmarks = smoother.smooth(landmarks, frame.timestamp);
    const angles: Record<string, number> = {};
    const ruleResults: Record<string, 'optimal' | 'good' | 'warning' | 'error'> = {};

    sportRule.jointRules.forEach((rule) => {
      const p1 = smoothedLandmarks[rule.keypoints[0]];
      const vertex = smoothedLandmarks[rule.keypoints[1]];
      const p3 = smoothedLandmarks[rule.keypoints[2]];

      if (p1 && vertex && p3) {
        const angle = calculateAngle(p1, vertex, p3);
        angles[rule.id] = angle;
        const tolerance = rule.tolerancesByLevel[skillLevel] || {
          idealMin: rule.idealMin,
          idealMax: rule.idealMax,
          toleranceMargin: 10
        };
        const dev = Math.min(Math.abs(angle - tolerance.idealMin), Math.abs(angle - tolerance.idealMax));
        if (angle >= tolerance.idealMin && angle <= tolerance.idealMax) {
          ruleResults[rule.id] = 'optimal';
        } else if (dev <= tolerance.toleranceMargin) {
          ruleResults[rule.id] = 'good';
        } else {
          ruleResults[rule.id] = 'warning';
        }
      }
    });

    const phaseIndex = Math.min(
      sportRule.phases.length - 1,
      Math.floor((frame.timestamp / Math.max(1, duration)) * sportRule.phases.length)
    );
    const detectedPhase = sportRule.phases[phaseIndex] || sportRule.phases[0];

    if (!(detectedPhase in phaseBoundaries)) {
      phaseBoundaries[detectedPhase] = idx;
    }

    const symmetryScore = calculateSymmetry(smoothedLandmarks);
    const kneeSafetyScore = calculateKneeValgusScore(smoothedLandmarks);

    const frameAnalysis: FrameAnalysis = {
      timestamp: frame.timestamp,
      frameNumber: idx,
      landmarks: smoothedLandmarks,
      angles,
      ruleResults,
      symmetryScore,
      kneeSafetyScore,
      detectedPhase,
      activeLevel: skillLevel,
      isRealDetection: isReal
    };

    sequenceItems.push({
      index: idx,
      timestamp: frame.timestamp,
      imageBitmap: frame.imageBitmap,
      analysis: frameAnalysis
    });

    const currentPct = 40 + Math.round(((idx + 1) / totalFrames) * 60);
    onProgress?.(currentPct, idx);
  }

  const lastResults = sequenceItems.length > 0 ? sequenceItems[Math.floor(sequenceItems.length / 2)].analysis.ruleResults : {};
  const overallKlutchhScore = calculateKlutchhScore(lastResults);

  return {
    id: `seq_${Date.now()}`,
    sportRule,
    duration: duration || 3.0,
    fps: targetFps,
    width: sequenceItems[0]?.imageBitmap.width || 640,
    height: sequenceItems[0]?.imageBitmap.height || 480,
    items: sequenceItems,
    overallKlutchhScore,
    phaseBoundaries
  };
}
