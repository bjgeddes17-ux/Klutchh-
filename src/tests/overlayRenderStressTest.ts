import { MediaPipeLandmark } from '../types';
import { mapLandmarkToScreen, getVideoRenderRect, normalizeLandmarks, POSE_CONNECTIONS } from '../utils/geometry';

export interface OverlayTestResult {
  testCase: string;
  category: string;
  passed: boolean;
  maxPixelError: number;
  details: string;
}

export function runOverlayRenderStressSuite(): {
  totalPassed: number;
  totalTests: number;
  successRate: number;
  results: OverlayTestResult[];
} {
  const results: OverlayTestResult[] = [];

  // 1. Boundary Coordinate Stress Test (Corners 0,0 1,0 0,1 1,1)
  {
    const containerW = 393; // iPhone 14 Pro
    const containerH = 852;
    const videoW = 720;     // 9:16 Portrait
    const videoH = 1280;

    const rect = getVideoRenderRect(containerW, containerH, videoW, videoH);

    const corners: MediaPipeLandmark[] = [
      { x: 0.0, y: 0.0, visibility: 0.99 }, // Top-Left
      { x: 1.0, y: 0.0, visibility: 0.99 }, // Top-Right
      { x: 0.0, y: 1.0, visibility: 0.99 }, // Bottom-Left
      { x: 1.0, y: 1.0, visibility: 0.99 }, // Bottom-Right
    ];

    const pTL = mapLandmarkToScreen(corners[0], containerW, containerH, videoW, videoH);
    const pTR = mapLandmarkToScreen(corners[1], containerW, containerH, videoW, videoH);
    const pBL = mapLandmarkToScreen(corners[2], containerW, containerH, videoW, videoH);
    const pBR = mapLandmarkToScreen(corners[3], containerW, containerH, videoW, videoH);

    const errTL = Math.abs(pTL.x - rect.x) + Math.abs(pTL.y - rect.y);
    const errTR = Math.abs(pTR.x - (rect.x + rect.width)) + Math.abs(pTR.y - rect.y);
    const errBL = Math.abs(pBL.x - rect.x) + Math.abs(pBL.y - (rect.y + rect.height));
    const errBR = Math.abs(pBR.x - (rect.x + rect.width)) + Math.abs(pBR.y - (rect.y + rect.height));

    const maxErr = Math.max(errTL, errTR, errBL, errBR);
    const pass = maxErr <= 1.0; // Sub-pixel precision

    results.push({
      testCase: 'Boundary Corners (0,0 -> 1,1) Align to Video Rect',
      category: 'Pixel Precision',
      passed: pass,
      maxPixelError: maxErr,
      details: `Corner error: ${maxErr.toFixed(2)}px (Video Rect: ${rect.width}x${rect.height} at ${rect.x},${rect.y})`,
    });
  }

  // 2. Pillarbox Screen Test (16:9 Landscape Video in 9:16 Mobile Viewport)
  {
    const containerW = 360;
    const containerH = 740;
    const videoW = 1920; // 16:9 Landscape
    const videoH = 1080;

    const rect = getVideoRenderRect(containerW, containerH, videoW, videoH);
    // Expected height = 360 / (16/9) = 202.5 -> 202px
    // Top black bar offsetY = (740 - 202) / 2 = 269px

    const centerLandmark = { x: 0.5, y: 0.5, visibility: 0.95 };
    const pt = mapLandmarkToScreen(centerLandmark, containerW, containerH, videoW, videoH);

    const expectedX = rect.x + 0.5 * rect.width;
    const expectedY = rect.y + 0.5 * rect.height;
    const err = Math.abs(pt.x - expectedX) + Math.abs(pt.y - expectedY);

    results.push({
      testCase: 'Pillarbox Center Point Projection (16:9 in 9:16)',
      category: 'Aspect Offset',
      passed: err <= 0.5,
      maxPixelError: err,
      details: `Projected Center (${pt.x}, ${pt.y}) matches Render Rect (${expectedX}, ${expectedY})`,
    });
  }

  // 3. Letterbox Screen Test (9:16 Portrait Video in 16:9 Tablet Viewport)
  {
    const containerW = 1024; // iPad Landscape
    const containerH = 768;
    const videoW = 720;      // 9:16 Portrait
    const videoH = 1280;

    const rect = getVideoRenderRect(containerW, containerH, videoW, videoH);
    // Expected width = 768 * (9/16) = 432px
    // Side black bar offsetX = (1024 - 432) / 2 = 296px

    const handLandmark = { x: 0.7, y: 0.3, visibility: 0.95 };
    const pt = mapLandmarkToScreen(handLandmark, containerW, containerH, videoW, videoH);

    const expectedX = rect.x + 0.7 * rect.width;
    const expectedY = rect.y + 0.3 * rect.height;
    const err = Math.abs(pt.x - expectedX) + Math.abs(pt.y - expectedY);

    results.push({
      testCase: 'Letterbox Off-Center Point Projection (9:16 in 16:9)',
      category: 'Aspect Offset',
      passed: err <= 0.5,
      maxPixelError: err,
      details: `Projected Hand (${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) matches Render Rect (${expectedX.toFixed(1)}, ${expectedY.toFixed(1)})`,
    });
  }

  // 4. Front Camera Mirroring (`isMirrored = true`)
  {
    const lmLeftShoulder = { x: 0.3, y: 0.4, visibility: 0.95 };
    const ptNormal = mapLandmarkToScreen(lmLeftShoulder, 400, 600, 9, 16, undefined, 0, false);
    const ptMirrored = mapLandmarkToScreen(lmLeftShoulder, 400, 600, 9, 16, undefined, 0, true);

    // X position should be mirrored around center (x' = 1 - x)
    const expectedMirroredX = 400 - ptNormal.x;
    const err = Math.abs(ptMirrored.x - expectedMirroredX);

    results.push({
      testCase: 'Front Camera Mirror Transform (isMirrored=true)',
      category: 'Transform Accuracy',
      passed: err <= 1.0,
      maxPixelError: err,
      details: `Mirrored X (${ptMirrored.x.toFixed(1)}px) is mirror inverse of Normal X (${ptNormal.x.toFixed(1)}px)`,
    });
  }

  // 5. Sensor Rotation Transform (90° Sideways Recording)
  {
    const lmNose = { x: 0.5, y: 0.2, visibility: 0.95 };
    const ptRotated = mapLandmarkToScreen(lmNose, 400, 600, 9, 16, undefined, 90);
    const pass = ptRotated.visible && !isNaN(ptRotated.x) && !isNaN(ptRotated.y);

    results.push({
      testCase: '90° Sensor Rotation Geometry Shift',
      category: 'Rotation Handling',
      passed: pass,
      maxPixelError: 0,
      details: `90° Rotated Point: (${ptRotated.x.toFixed(1)}, ${ptRotated.y.toFixed(1)})`,
    });
  }

  // 6. Skeleton Bone Segment Geometry Integrity (All 36 POSE_CONNECTIONS)
  {
    const dummyLandmarks: MediaPipeLandmark[] = new Array(33).fill(0).map((_, i) => ({
      x: 0.2 + (i % 5) * 0.12,
      y: 0.1 + Math.floor(i / 5) * 0.12,
      visibility: 0.95,
    }));

    let validConnections = 0;
    POSE_CONNECTIONS.forEach((conn) => {
      const p1 = mapLandmarkToScreen(dummyLandmarks[conn.points[0]], 360, 640, 9, 16);
      const p2 = mapLandmarkToScreen(dummyLandmarks[conn.points[1]], 360, 640, 9, 16);

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (!isNaN(len) && len > 0) validConnections++;
    });

    const pass = validConnections === POSE_CONNECTIONS.length;
    results.push({
      testCase: 'All 36 SVG Bone Connection Line Segments Valid',
      category: 'SVG Rendering Integrity',
      passed: pass,
      maxPixelError: 0,
      details: `${validConnections}/${POSE_CONNECTIONS.length} bone connections calculated without NaN or zero-length collapse`,
    });
  }

  // 7. Multi-Viewport Device Stress Matrix (8 Viewports)
  const viewports = [
    { name: 'iPhone SE', w: 375, h: 667 },
    { name: 'iPhone 14 Pro', w: 393, h: 852 },
    { name: 'Samsung S23 Ultra', w: 412, h: 915 },
    { name: 'iPad Portrait', w: 768, h: 1024 },
    { name: 'iPad Landscape', w: 1024, h: 768 },
    { name: 'Laptop HD', w: 1280, h: 720 },
    { name: 'Desktop 1080p', w: 1920, h: 1080 },
    { name: 'Ultrawide 21:9', w: 2560, h: 1080 },
  ];

  viewports.forEach((vp, idx) => {
    const rect = getVideoRenderRect(vp.w, vp.h, 9, 16);
    const pass = rect.width > 0 && rect.height > 0 && rect.width <= vp.w && rect.height <= vp.h;

    results.push({
      testCase: `Viewport Scaling: ${vp.name} (${vp.w}x${vp.h})`,
      category: 'Device Responsiveness',
      passed: pass,
      maxPixelError: 0,
      details: `Render Rect: ${rect.width}x${rect.height}px at (${rect.x}, ${rect.y})`,
    });
  });

  const totalPassed = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const successRate = (totalPassed / totalTests) * 100;

  return {
    totalPassed,
    totalTests,
    successRate,
    results,
  };
}
