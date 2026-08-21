import { MediaPipeLandmark, SportRule } from '../types';

/**
 * Calculates the angle (in degrees 0-180) at vertex point p2 formed by lines p1-p2 and p3-p2.
 */
export function calculateAngle(
  p1: MediaPipeLandmark,
  p2: MediaPipeLandmark,
  p3: MediaPipeLandmark
): number {
  if (!p1 || !p2 || !p3) return 0;

  // Vectors from vertex p2 to p1 and p3 (supporting 3D coordinates x, y, z)
  const v1x = p1.x - p2.x;
  const v1y = p1.y - p2.y;
  const v1z = (p1.z || 0) - (p2.z || 0);

  const v2x = p3.x - p2.x;
  const v2y = p3.y - p2.y;
  const v2z = (p3.z || 0) - (p2.z || 0);

  // Dot product and magnitudes for Law of Cosines
  const dotProduct = v1x * v2x + v1y * v2y + v1z * v2z;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

  if (mag1 === 0 || mag2 === 0) return 0;

  let cosTheta = dotProduct / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));

  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180.0) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Evaluates left-right symmetry (0 - 100%) across shoulders, elbows, hips, and knees.
 */
export function calculateSymmetry(landmarks: MediaPipeLandmark[]): number {
  if (!landmarks || landmarks.length < 29) return 90;

  // Key pairs: Left Shoulder (11) vs Right Shoulder (12)
  // Left Elbow (13) vs Right Elbow (14)
  // Left Hip (23) vs Right Hip (24)
  // Left Knee (25) vs Right Knee (26)
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 88;

  // Levelness of shoulder axis
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  // Levelness of hip axis
  const hipTilt = Math.abs(leftHip.y - rightHip.y);

  // Arm flex balance if available
  let armDiff = 0;
  if (leftElbow && rightElbow && landmarks[15] && landmarks[16]) {
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, landmarks[15]);
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, landmarks[16]);
    armDiff = Math.abs(leftArmAngle - rightArmAngle) / 180;
  }

  const tiltPenalty = (shoulderTilt + hipTilt) * 150;
  const score = Math.max(50, Math.min(100, Math.round(100 - tiltPenalty - armDiff * 25)));

  return score;
}

/**
 * Calculates Knee Valgus Safety Index (0-100%).
 * Valgus occurs when knees buckle inward relative to the line connecting hip and ankle.
 */
export function calculateKneeValgusScore(landmarks: MediaPipeLandmark[]): number {
  if (!landmarks || landmarks.length < 29) return 92;

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return 90;

  // Check inward displacement ratio
  // Normal stance: knee X is between hip X and ankle X (or close to midpoint)
  const leftMidX = (leftHip.x + leftAnkle.x) / 2;
  const rightMidX = (rightHip.x + rightAnkle.x) / 2;

  // Left knee buckling inward towards center (towards right)
  const leftInward = leftKnee.x - leftMidX; 
  // Right knee buckling inward towards center (towards left)
  const rightInward = rightMidX - rightKnee.x;

  const maxInward = Math.max(0, leftInward, rightInward);
  const penalty = maxInward * 300;

  return Math.max(40, Math.min(100, Math.round(100 - penalty)));
}

// MediaPipe Pose Skeleton Connection Indices with associated joint keys
export const POSE_CONNECTIONS: { points: [number, number]; jointName?: string }[] = [
  // Torso & Shoulders
  { points: [11, 12] },
  { points: [11, 23], jointName: 'shoulder_hip' },
  { points: [12, 24], jointName: 'shoulder_hip' },
  { points: [23, 24] },
  // Left Arm
  { points: [11, 13], jointName: 'elbow' },
  { points: [13, 15], jointName: 'elbow' },
  // Right Arm
  { points: [12, 14], jointName: 'elbow' },
  { points: [14, 16], jointName: 'elbow' },
  // Left Leg
  { points: [23, 25], jointName: 'hip' },
  { points: [25, 27], jointName: 'knee' },
  { points: [27, 29], jointName: 'ankle' },
  { points: [29, 31] },
  // Right Leg
  { points: [24, 26], jointName: 'hip' },
  { points: [26, 28], jointName: 'knee' },
  { points: [28, 30], jointName: 'ankle' },
  { points: [30, 32] },
  // Face & Neck
  { points: [0, 1] }, { points: [1, 2] }, { points: [2, 3] }, { points: [3, 7] },
  { points: [0, 4] }, { points: [4, 5] }, { points: [5, 6] }, { points: [6, 8] }, { points: [9, 10] }
];

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
  shouldClear = true,
  overlayMode: 'sleek' | 'minimal' | 'off' = 'sleek'
) {
  if (shouldClear) {
    ctx.clearRect(0, 0, width, height);
  }

  if (overlayMode === 'off') {
    return;
  }

  if (!landmarks || landmarks.length === 0) return;

  // HIGH-TECH BIOMECHANICAL VOLUMETRIC ATHLETE SILHOUETTE UNDERLAY (Ultra-subtle, non-obtrusive)
  const sportId = (sportRule?.id as string) || 'rugby';
  const activeThemeColor = sportId === 'rugby' ? 'rgba(239, 68, 68, 0.15)' 
                        : sportId === 'swim' ? 'rgba(56, 189, 248, 0.15)' 
                        : 'rgba(245, 158, 11, 0.15)'; // fallback to gold

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Only draw very subtle faint torso frame if in sleek mode
  if (overlayMode === 'sleek') {
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
      ctx.fillStyle = activeThemeColor.replace('0.15', '0.03'); // faint inner volume
      ctx.fill();
      ctx.strokeStyle = activeThemeColor.replace('0.15', '0.08');
      ctx.lineWidth = 1;
      ctx.stroke();
    }
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

  // 1. Draw Sleek Skeleton Connection Lines (1.5px width - crisp and thin)
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
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  });

  // 2. Draw Keypoint Joint Dots (Small micro-dots: 2.2px)
  landmarks.forEach((pt, idx) => {
    if (pt && (pt.visibility === undefined || pt.visibility > 0.35)) {
      const cx = pt.x * width;
      const cy = pt.y * height;

      const jointStatus = issueKeypointMap[idx] || 'optimal';
      const color = getColorForStatus(jointStatus);

      if (jointStatus === 'error' || jointStatus === 'warning') {
        // Delicate micro target ring for warning/error joints
        ctx.beginPath();
        ctx.arc(cx, cy, jointStatus === 'error' ? 5.5 : 4.5, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        // Solid micro-dot for optimal / good joints
        ctx.beginPath();
        ctx.arc(cx, cy, 2.2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.lineWidth = 0.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
      }
    }
  });

  // 3. Draw Angle Arcs & Biometric Labels (Ultra-compact, delicate micro-labels out of the way)
  if (sportRule && sportRule.jointRules) {
    // Prioritize active phase rules or flagged deviations
    let visibleRules = sportRule.jointRules.filter((rule) => {
      if (!activePhase || activePhase === 'Auto-Detect' || activePhase === 'All') return true;
      const isRulePhase = rule.phase === activePhase;
      const isFlagged = ruleResults[rule.id] !== 'optimal';
      return isRulePhase || isFlagged;
    });

    // In minimal mode show at most 1 primary angle; in sleek mode show at most 2 small micro-angles
    const maxVisibleAngles = overlayMode === 'minimal' ? 1 : 2;

    if (visibleRules.length > maxVisibleAngles) {
      visibleRules.sort((a, b) => {
        const sA = statusPriority[ruleResults[a.id] || 'optimal'];
        const sB = statusPriority[ruleResults[b.id] || 'optimal'];
        return sB - sA;
      });
      visibleRules = visibleRules.slice(0, maxVisibleAngles);
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

        // Micro-Arc (radius 7px, delicate 1px stroke)
        ctx.beginPath();
        const startAngle = Math.atan2((p1.y - vertex.y) * height, (p1.x - vertex.x) * width);
        const endAngle = Math.atan2((p3.y - vertex.y) * height, (p3.x - vertex.x) * width);
        ctx.arc(vx, vy, 7, startAngle, endAngle);
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Short compact joint name
        let shortJoint = 'Joint';
        const nameLower = rule.name.toLowerCase();
        if (nameLower.includes('knee')) shortJoint = 'Knee';
        else if (nameLower.includes('elbow')) shortJoint = 'Elbow';
        else if (nameLower.includes('hip') || nameLower.includes('hinge')) shortJoint = 'Hip';
        else if (nameLower.includes('shoulder')) shortJoint = 'Shldr';
        else if (nameLower.includes('ankle') || nameLower.includes('plant')) shortJoint = 'Ankle';
        else if (nameLower.includes('spine') || nameLower.includes('torso') || nameLower.includes('back')) shortJoint = 'Spine';
        else if (nameLower.includes('wrist')) shortJoint = 'Wrist';
        else {
          shortJoint = rule.name.split(' ')[0] || 'Ang';
        }

        const labelText = `${shortJoint} ${Math.round(angleVal)}°`;
        ctx.font = 'bold 7.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const textWidth = ctx.measureText(labelText).width;

        const pillX = vx + 5;
        const pillY = vy - 6;

        // Ultra-compact, non-intrusive micro pill (height 10.5px)
        ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
        ctx.beginPath();
        ctx.roundRect(pillX - 2, pillY - 7.5, textWidth + 8, 10.5, 2.5);
        ctx.fill();
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Mini status dot (1.2px)
        ctx.beginPath();
        ctx.arc(pillX + 1.2, pillY - 2.2, 1.2, 0, 2 * Math.PI);
        ctx.fillStyle = statusColor;
        ctx.fill();

        // Crisp readable micro text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, pillX + 5, pillY);
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

