import { MediaPipeLandmark, SportRule } from '../types';
import { calculateAngle, POSE_CONNECTIONS } from '../shared/biomechanics';

export { calculateAngle, POSE_CONNECTIONS };

/**
 * Draws pose skeleton and biometric annotations on 2D canvas.
 * Uses skinny lines (2.5px) and explicit color coding:
 * - Green (#22c55e): Optimal form
 * - Amber (#f59e0b): Warning / slight deviation
 * - Red (#ef4444): Severe form error / High issue
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: MediaPipeLandmark[],
  ruleResults: Record<string, 'optimal' | 'good' | 'warning' | 'error'> = {},
  angles: Record<string, number> = {},
  sportRule?: SportRule,
  activePhase?: string,
  shouldClear = true
) {
  if (shouldClear) {
    ctx.clearRect(0, 0, width, height);
  }

  if (!landmarks || landmarks.length === 0) return;

  // 1. Draw stylized torso polygon frame (11=L Shoulder, 12=R Shoulder, 24=R Hip, 23=L Hip)
  const activeThemeColor = 'rgba(250, 204, 21, 0.3)'; // High-tech electric yellow

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Draw stylized torso polygon frame (11=L Shoulder, 12=R Shoulder, 24=R Hip, 23=L Hip)
  const p11 = landmarks[11];
  const p12 = landmarks[12];
  const p24 = landmarks[24];
  const p23 = landmarks[23];

  if (p11 && p12 && p24 && p23) {
    ctx.beginPath();
    ctx.moveTo(p11.x * width, p11.y * height);
    ctx.lineTo(p12.x * width, p12.y * height);
    ctx.lineTo(p24.x * width, p24.y * height);
    ctx.lineTo(p23.x * width, p23.y * height);
    ctx.closePath();
    ctx.fillStyle = activeThemeColor.replace('0.3', '0.08'); // light inner body volume
    ctx.fill();
    ctx.strokeStyle = activeThemeColor.replace('0.3', '0.15');
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 2. Thick volumetric "athletic muscle tubes" for limbs
  const limbPairs = [
    [11, 13], [13, 15], // Left Arm
    [12, 14], [14, 16], // Right Arm
    [23, 25], [25, 27], // Left Leg
    [24, 26], [26, 28], // Right Leg
    [11, 23], [12, 24]  // Side torso lines
  ];

  limbPairs.forEach(([i1, i2]) => {
    const pt1 = landmarks[i1];
    const pt2 = landmarks[i2];
    if (pt1 && pt2 && (pt1.visibility === undefined || pt1.visibility > 0.3)) {
      ctx.beginPath();
      ctx.moveTo(pt1.x * width, pt1.y * height);
      ctx.lineTo(pt2.x * width, pt2.y * height);
      ctx.strokeStyle = activeThemeColor.replace('0.3', '0.12');
      ctx.lineWidth = 5; // Sleeker volumetric bone outline (reduced from 14 to 5)
      ctx.stroke();

      // Additional center core glow
      ctx.beginPath();
      ctx.moveTo(pt1.x * width, pt1.y * height);
      ctx.lineTo(pt2.x * width, pt2.y * height);
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.05;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Sharp HUD Core
      ctx.beginPath();
      ctx.moveTo(pt1.x * width, pt1.y * height);
      ctx.lineTo(pt2.x * width, pt2.y * height);
      ctx.strokeStyle = '#facc15';
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  });

  // 3. Glowing helmet/head capsule (centered around Nose 0)
  const nose = landmarks[0];
  if (nose) {
    ctx.beginPath();
    ctx.arc(nose.x * width, nose.y * height - 8, 12, 0, 2 * Math.PI);
    ctx.fillStyle = activeThemeColor.replace('0.3', '0.1');
    ctx.fill();
    ctx.strokeStyle = activeThemeColor.replace('0.3', '0.2');
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();

  // Identify keypoints that have flagged status to color them explicitly
  const statusPriority = { error: 4, warning: 3, good: 2, optimal: 1 };
  const issueKeypointMap: Record<number, 'optimal' | 'good' | 'warning' | 'error'> = {};

  if (sportRule && sportRule.jointRules) {
    sportRule.jointRules.forEach((rule) => {
      const res = ruleResults[rule.id] || 'optimal';
      rule.keypoints.forEach((kp) => {
        const currentRes = issueKeypointMap[kp] || 'optimal';
        if (statusPriority[res] > statusPriority[currentRes]) {
          issueKeypointMap[kp] = res;
        }
      });
    });
  }

  const getColorForStatus = (status: 'optimal' | 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'optimal':
        return '#22c55e'; // Green
      case 'good':
        return '#3b82f6'; // Blue
      case 'warning':
        return '#a855f7'; // Purple
      case 'error':
        return '#ef4444'; // Red
      default:
        return '#22c55e';
    }
  };

  // 1. Draw Skeleton Connection Lines (2.5px width)
  POSE_CONNECTIONS.forEach(({ points: [i1, i2] }) => {
    const pt1 = landmarks[i1];
    const pt2 = landmarks[i2];

    if (pt1 && pt2 && (pt1.visibility === undefined || pt1.visibility > 0.35)) {
      ctx.beginPath();
      ctx.moveTo(pt1.x * width, pt1.y * height);
      ctx.lineTo(pt2.x * width, pt2.y * height);

      const s1 = issueKeypointMap[i1] || 'optimal';
      const s2 = issueKeypointMap[i2] || 'optimal';
      const lineStatus = statusPriority[s1] > statusPriority[s2] ? s1 : s2;

      ctx.strokeStyle = getColorForStatus(lineStatus);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  });

  // 2. Draw Keypoint Joint Dots & Target Rings
  landmarks.forEach((pt, idx) => {
    if (pt && (pt.visibility === undefined || pt.visibility > 0.35)) {
      const cx = pt.x * width;
      const cy = pt.y * height;

      const jointStatus = issueKeypointMap[idx] || 'optimal';
      const color = getColorForStatus(jointStatus);

      if (jointStatus === 'error' || jointStatus === 'warning') {
        // Glowing target ring for warning/error joints
        ctx.beginPath();
        ctx.arc(cx, cy, jointStatus === 'error' ? 9 : 7, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, jointStatus === 'error' ? 4 : 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        // Solid dot for optimal / good joints
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();
      }
    }
  });

  // 3. Draw Angle Arcs & Biometric Labels
  if (sportRule && sportRule.jointRules) {
    let visibleRules = sportRule.jointRules.filter((rule) => {
      if (!activePhase || activePhase === 'Auto-Detect' || activePhase === 'All') return true;
      const isRulePhase = rule.phase === activePhase;
      const isFlagged = ruleResults[rule.id] !== 'optimal';
      return isRulePhase || isFlagged;
    });

    if (visibleRules.length > 4) {
      visibleRules = visibleRules.slice(0, 4);
    }

    visibleRules.forEach((rule) => {
      const [kp1, kp2, kp3] = rule.keypoints;
      const p1 = landmarks[kp1];
      const vertex = landmarks[kp2];
      const p3 = landmarks[kp3];

      if (p1 && vertex && p3) {
        const vx = vertex.x * width;
        const vy = vertex.y * height;
        const angleVal = angles[rule.id] ?? calculateAngle(p1, vertex, p3);
        const status = ruleResults[rule.id] || 'optimal';
        const statusColor = getColorForStatus(status);

        // Draw Arc
        ctx.beginPath();
        const startAngle = Math.atan2((p1.y - vertex.y) * height, (p1.x - vertex.x) * width);
        const endAngle = Math.atan2((p3.y - vertex.y) * height, (p3.x - vertex.x) * width);
        ctx.arc(vx, vy, 20, startAngle, endAngle);
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Biometric Angle Pill Label
        const displayAngle = typeof angleVal === 'number' ? angleVal.toFixed(1) : angleVal;
        const labelText = `${rule.name}: ${displayAngle}${rule.unit}`;
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        const textWidth = ctx.measureText(labelText).width;

        const pillX = vx + 8;
        const pillY = vy - 12;

        // Background pill
        ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
        ctx.beginPath();
        ctx.roundRect(pillX - 4, pillY - 11, textWidth + 16, 18, 5);
        ctx.fill();
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Indicator dot
        ctx.beginPath();
        ctx.arc(pillX + 2, pillY - 2, 3, 0, 2 * Math.PI);
        ctx.fillStyle = statusColor;
        ctx.fill();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, pillX + 9, pillY + 1);
      }
    });
  }
}

/**
 * Renders a visual heatmap of joint trajectory stability on the canvas,
 * highlighting motion paths and glowing red heat zones where the athlete deviates from optimal paths.
 */
export function drawTrajectoryHeatmap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  trajectoryHistory: { landmarks: MediaPipeLandmark[]; ruleResults: Record<string, 'optimal' | 'good' | 'warning' | 'error'> }[],
  sportRule?: SportRule
) {
  if (!trajectoryHistory || trajectoryHistory.length === 0) return;

  // Key tracking joint indices: Wrists (15, 16), Knees (25, 26), Ankles (27, 28)
  const trackIndices = [15, 16, 25, 26, 27, 28];

  trackIndices.forEach((jointIdx) => {
    const points = trajectoryHistory.map((item) => {
      const lm = item.landmarks[jointIdx];
      const hasError = sportRule?.jointRules.some((rule) => {
        return rule.keypoints.includes(jointIdx) && (item.ruleResults[rule.id] === 'error' || item.ruleResults[rule.id] === 'warning');
      });
      return {
        x: lm ? lm.x * width : 0,
        y: lm ? lm.y * height : 0,
        visibility: lm?.visibility ?? 1,
        status: hasError ? 'error' : 'optimal'
      };
    }).filter(p => p.visibility > 0.35 && p.x > 0);

    if (points.length < 2) return;

    // Draw fading trajectory trail
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const progress = i / points.length;
      
      // Calculate segment distance as proxy for velocity
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      // Map distance to thickness: higher speed = thinner line (taper effect)
      // Assume max speed dist ~ 50px, min speed ~ 5px
      const lineWidth = Math.max(1, Math.min(8, 10 - (dist / 5)));

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (p2.status === 'error') {
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.35 + progress * 0.65})`;
        ctx.lineWidth = lineWidth + 2;
      } else {
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.2 + progress * 0.5})`;
        ctx.lineWidth = lineWidth;
      }
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Highlight deviation heat spots (glowing radial heat blobs)
    points.forEach((p) => {
      if (p.status === 'error') {
        const gradient = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 22);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
        gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  });
}

/**
 * Checks landmark visibility for shoulders, arms, and legs.
 * If visibility is below threshold (0.45), marks them as occluded so the app can show a clear message.
 */
export function checkJointVisibilityOcclusion(landmarks: MediaPipeLandmark[] | undefined): {
  hasOcclusion: boolean;
  occludedLimbs: string[];
} {
  if (!landmarks || landmarks.length === 0) return { hasOcclusion: false, occludedLimbs: [] };
  const occluded: string[] = [];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  if ((leftShoulder?.visibility !== undefined && leftShoulder.visibility < 0.45) ||
      (rightShoulder?.visibility !== undefined && rightShoulder.visibility < 0.45)) {
    occluded.push('Shoulders');
  }
  const leftArm = landmarks[13] || landmarks[15];
  const rightArm = landmarks[14] || landmarks[16];
  if ((leftArm?.visibility !== undefined && leftArm.visibility < 0.45) ||
      (rightArm?.visibility !== undefined && rightArm.visibility < 0.45)) {
    occluded.push('Arms / Elbows');
  }
  const leftLeg = landmarks[25] || landmarks[27];
  const rightLeg = landmarks[26] || landmarks[28];
  if ((leftLeg?.visibility !== undefined && leftLeg.visibility < 0.45) ||
      (rightLeg?.visibility !== undefined && rightLeg.visibility < 0.45)) {
    occluded.push('Legs / Knees');
  }
  return { hasOcclusion: occluded.length > 0, occludedLimbs: occluded };
}

/**
 * Ensures landmarks are properly normalized to [0, 1] relative coordinate space.
 * Prevents giant skeleton rendering errors if raw pixel coordinates are received.
 */
export function normalizeLandmarks(landmarks: MediaPipeLandmark[]): MediaPipeLandmark[] {
  if (!landmarks || landmarks.length === 0) return [];
  let maxX = 1;
  let maxY = 1;
  landmarks.forEach(pt => {
    if (pt) {
      if (Math.abs(pt.x) > maxX) maxX = Math.abs(pt.x);
      if (Math.abs(pt.y) > maxY) maxY = Math.abs(pt.y);
    }
  });

  const isPixelSpace = maxX > 1.5 || maxY > 1.5;
  const scaleX = isPixelSpace ? maxX : 1;
  const scaleY = isPixelSpace ? maxY : 1;

  return landmarks.map(pt => {
    if (!pt) return pt;
    return {
      ...pt,
      x: Math.max(0, Math.min(1, pt.x / scaleX)),
      y: Math.max(0, Math.min(1, pt.y / scaleY))
    };
  });
}


