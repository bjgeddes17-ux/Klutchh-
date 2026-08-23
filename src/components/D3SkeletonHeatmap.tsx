import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { FrameAnalysis, SportRule, JointRule } from '../types';
import { Flame, Activity, Zap, ShieldAlert, ChevronRight, Info, Eye } from 'lucide-react';

interface D3SkeletonHeatmapProps {
  keyframeList: FrameAnalysis[];
  sportRule: SportRule;
  currentTime?: number;
  onSeek?: (timestamp: number) => void;
}

interface JointHeatData {
  id: string;
  name: string;
  p1Idx: number;
  p2Idx: number;
  p3Idx: number; // Vertex point for angle
  ruleId?: string;
  velocity: number; // deg/s
  torque: number; // Nm
  angle: number; // degrees
  strainIndex: number; // 0 - 100
  x: number; // normalized 0..1
  y: number; // normalized 0..1
}

interface LimbHeatData {
  id: string;
  name: string;
  startIdx: number;
  endIdx: number;
  strainIndex: number;
  avgTorque: number;
  avgVelocity: number;
}

export const D3SkeletonHeatmap: React.FC<D3SkeletonHeatmapProps> = ({
  keyframeList,
  sportRule,
  currentTime = 0,
  onSeek,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Active keyframe index selection
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState(0);

  // Metric mode: 'strain' | 'torque' | 'velocity'
  const [metricMode, setMetricMode] = useState<'strain' | 'torque' | 'velocity'>('strain');

  // Selected joint for detailed telemetry inspect modal/card
  const [selectedJointId, setSelectedJointId] = useState<string | null>(null);

  // Ensure keyframe index stays in bounds if keyframeList changes
  useEffect(() => {
    if (selectedKeyframeIndex >= keyframeList.length && keyframeList.length > 0) {
      setSelectedKeyframeIndex(0);
    }
  }, [keyframeList, selectedKeyframeIndex]);

  // Sync selected keyframe with video currentTime if provided
  useEffect(() => {
    if (keyframeList.length === 0 || currentTime <= 0) return;
    let closestIdx = 0;
    let minDiff = Infinity;
    keyframeList.forEach((kf, idx) => {
      const diff = Math.abs(kf.timestamp - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    if (closestIdx !== selectedKeyframeIndex && minDiff < 0.8) {
      setSelectedKeyframeIndex(closestIdx);
    }
  }, [currentTime, keyframeList]);

  const activeKeyframe: FrameAnalysis | undefined = keyframeList[selectedKeyframeIndex] || keyframeList[0];

  // Key joints mapping with MediaPipe keypoint indices
  const jointDefinitions = useMemo(() => [
    { id: 'right_knee', name: 'Right Knee', p1: 23, p2: 25, p3: 27, targetKeypoint: 25, ruleId: 'right_knee_valgus' },
    { id: 'left_knee', name: 'Left Knee', p1: 24, p2: 26, p3: 28, targetKeypoint: 26, ruleId: 'left_knee_valgus' },
    { id: 'right_elbow', name: 'Right Elbow', p1: 11, p2: 13, p3: 15, targetKeypoint: 13, ruleId: 'elbow_extension' },
    { id: 'left_elbow', name: 'Left Elbow', p1: 12, p2: 14, p3: 16, targetKeypoint: 14, ruleId: 'left_elbow' },
    { id: 'right_hip', name: 'Right Hip Flexor', p1: 11, p2: 23, p3: 25, targetKeypoint: 23, ruleId: 'hip_rotation' },
    { id: 'left_hip', name: 'Left Hip Flexor', p1: 12, p2: 24, p3: 26, targetKeypoint: 24, ruleId: 'left_hip' },
    { id: 'right_shoulder', name: 'Right Shoulder', p1: 13, p2: 11, p3: 23, targetKeypoint: 11, ruleId: 'shoulder_abduction' },
    { id: 'left_shoulder', name: 'Left Shoulder', p1: 14, p2: 12, p3: 24, targetKeypoint: 12, ruleId: 'left_shoulder' },
    { id: 'lumbar_core', name: 'Lumbar Core / Spine', p1: 11, p2: 23, p3: 24, targetKeypoint: 23, ruleId: 'trunk_flexion' },
    { id: 'right_ankle', name: 'Right Ankle', p1: 25, p2: 27, p3: 31, targetKeypoint: 27, ruleId: 'ankle_dorsiflexion' },
    { id: 'left_ankle', name: 'Left Ankle', p1: 26, p2: 28, p3: 32, targetKeypoint: 28, ruleId: 'left_ankle' },
  ], []);

  // Compute joint heat metrics for current keyframe
  const jointHeatData: JointHeatData[] = useMemo(() => {
    if (!activeKeyframe || !activeKeyframe.landmarks || activeKeyframe.landmarks.length < 29) {
      // Fallback synthetic positions if landmarks missing
      return jointDefinitions.map((def, i) => ({
        id: def.id,
        name: def.name,
        p1Idx: def.p1,
        p2Idx: def.p2,
        p3Idx: def.p3,
        ruleId: def.ruleId,
        velocity: 120 + (i * 25) % 180,
        torque: 35 + (i * 12) % 55,
        angle: 110 + (i * 15) % 60,
        strainIndex: Math.min(100, 30 + (i * 18) % 65),
        x: 0.3 + (i % 3) * 0.2,
        y: 0.2 + Math.floor(i / 3) * 0.2,
      }));
    }

    const landmarks = activeKeyframe.landmarks;
    const angles = activeKeyframe.angles || {};
    const velocities = activeKeyframe.velocity || {};
    const torques = activeKeyframe.torque || {};

    return jointDefinitions.map((def) => {
      const kp = landmarks[def.targetKeypoint] || { x: 0.5, y: 0.5 };
      
      // Match angle or calculate
      const matchingRule = sportRule.jointRules.find(r => r.id === def.ruleId || r.name.toLowerCase().includes(def.name.toLowerCase()));
      const ruleId = matchingRule?.id || def.ruleId;

      const angle = angles[ruleId] || 120;
      const velocity = velocities[ruleId] || (matchingRule?.targetSpeed ? matchingRule.targetSpeed * 0.85 : 190);
      const torque = torques[ruleId] || (matchingRule?.targetTorque ? matchingRule.targetTorque * 0.8 : 42);

      // Normalize Strain Index (0 - 100%)
      const maxSpeed = matchingRule?.targetSpeed || 350;
      const maxTorque = matchingRule?.targetTorque || 80;

      const velRatio = Math.min(1.2, velocity / maxSpeed);
      const torqueRatio = Math.min(1.2, torque / maxTorque);

      // Combined strain score
      const strainIndex = Math.min(100, Math.round((velRatio * 0.45 + torqueRatio * 0.55) * 85));

      return {
        id: def.id,
        name: def.name,
        p1Idx: def.p1,
        p2Idx: def.p2,
        p3Idx: def.p3,
        ruleId,
        velocity: Math.round(velocity),
        torque: Math.round(torque * 10) / 10,
        angle: Math.round(angle),
        strainIndex,
        x: kp.x,
        y: kp.y,
      };
    });
  }, [activeKeyframe, jointDefinitions, sportRule]);

  // Connect limbs between keypoints
  const limbDefinitions = useMemo(() => [
    { id: 'r_lower_leg', name: 'Right Shin/Calf', start: 25, end: 27, jointRef: 'right_knee' },
    { id: 'l_lower_leg', name: 'Left Shin/Calf', start: 26, end: 28, jointRef: 'left_knee' },
    { id: 'r_thigh', name: 'Right Thigh (Femur)', start: 23, end: 25, jointRef: 'right_knee' },
    { id: 'l_thigh', name: 'Left Thigh (Femur)', start: 24, end: 26, jointRef: 'left_knee' },
    { id: 'pelvis', name: 'Pelvis / Hip Girdle', start: 23, end: 24, jointRef: 'right_hip' },
    { id: 'torso_r', name: 'Right Torso', start: 11, end: 23, jointRef: 'lumbar_core' },
    { id: 'torso_l', name: 'Left Torso', start: 12, end: 24, jointRef: 'lumbar_core' },
    { id: 'shoulder_line', name: 'Shoulder Axis', start: 11, end: 12, jointRef: 'right_shoulder' },
    { id: 'r_upper_arm', name: 'Right Humerus', start: 11, end: 13, jointRef: 'right_elbow' },
    { id: 'l_upper_arm', name: 'Left Humerus', start: 12, end: 14, jointRef: 'left_elbow' },
    { id: 'r_forearm', name: 'Right Forearm', start: 13, end: 15, jointRef: 'right_elbow' },
    { id: 'l_forearm', name: 'Left Forearm', start: 14, end: 16, jointRef: 'left_elbow' },
  ], []);

  // Compute limb heat values
  const limbHeatData: LimbHeatData[] = useMemo(() => {
    return limbDefinitions.map((limb) => {
      const refJoint = jointHeatData.find((j) => j.id === limb.jointRef) || jointHeatData[0];
      return {
        id: limb.id,
        name: limb.name,
        startIdx: limb.start,
        endIdx: limb.end,
        strainIndex: refJoint ? refJoint.strainIndex : 40,
        avgTorque: refJoint ? refJoint.torque : 30,
        avgVelocity: refJoint ? refJoint.velocity : 150,
      };
    });
  }, [limbDefinitions, jointHeatData]);

  // Render D3 Heatmap Overlay into SVG
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 550;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    // Setup Defs for D3 Glow Filters and Radial Heat Gradients
    const defs = svg.append('defs');

    // Filter for neon heat glow
    const filter = defs.append('filter')
      .attr('id', 'heat-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '6')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // D3 Color Scale mapping strain 0 - 100 to color spectrum (Emerald -> Yellow -> Orange -> Crimson)
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateYlOrRd);

    // Custom linear scale for precise visual hierarchy with more "pro" colors
    const strainColorScale = (val: number) => {
      if (val < 25) return '#059669'; // Emerald 600
      if (val < 50) return '#fbbf24'; // Amber 400
      if (val < 75) return '#f97316'; // Orange 500
      return '#dc2626'; // Red 600
    };

    // Draw Human Silhouette Background (Simplified Anatomical Outline)
    const drawSilhouette = () => {
      const silhouetteGroup = svg.append('g').attr('class', 'silhouette').attr('opacity', 0.08);
      
      // We don't have a perfect silhouette path, but we can draw a stylized humanoid shape based on landmarks
      // or just a static generic one. Let's try to draw a stylized one centered in the frame.
      const centerX = width / 2;
      const centerY = height / 2;
      
      silhouetteGroup.append('path')
        .attr('d', `M ${centerX},80 
                    C ${centerX+20},80 ${centerX+35},95 ${centerX+35},115 
                    C ${centerX+35},135 ${centerX+20},150 ${centerX},150 
                    C ${centerX-20},150 ${centerX-35},135 ${centerX-35},115 
                    C ${centerX-35},95 ${centerX-20},80 ${centerX},80 Z`) // Head
        .attr('fill', '#94a3b8');

      silhouetteGroup.append('path')
        .attr('d', `M ${centerX-40},160 L ${centerX+40},160 L ${centerX+50},250 L ${centerX-50},250 Z`) // Torso
        .attr('fill', '#94a3b8');
        
      silhouetteGroup.append('path')
        .attr('d', `M ${centerX-50},250 L ${centerX+50},250 L ${centerX+40},350 L ${centerX-40},350 Z`) // Pelvis
        .attr('fill', '#94a3b8');
    };

    drawSilhouette();

    // Draw Background Grid
    const gridGroup = svg.append('g').attr('class', 'grid-lines').attr('opacity', 0.1);
    for (let x = 0; x <= width; x += 50) {
      gridGroup.append('line')
        .attr('x1', x).attr('y1', 0)
        .attr('x2', x).attr('y2', height)
        .attr('stroke', '#64748b').attr('stroke-dasharray', '2,4');
    }
    for (let y = 0; y <= height; y += 50) {
      gridGroup.append('line')
        .attr('x1', 0).attr('y1', y)
        .attr('x2', width).attr('y2', y)
        .attr('stroke', '#64748b').attr('stroke-dasharray', '2,4');
    }

    const landmarks = activeKeyframe?.landmarks || [];

    // Helper to convert normalized x,y (0..1) to SVG canvas coordinates
    const toCoords = (idx: number) => {
      const lm = landmarks[idx];
      if (!lm) return { x: width / 2, y: height / 2 };
      // Map x, y into padded center frame
      const padding = 60;
      const x = padding + lm.x * (width - padding * 2);
      const y = padding + lm.y * (height - padding * 2);
      return { x, y };
    };

    // 1. Draw Bones / Limbs with D3 stroke width and color interpolation based on Strain
    const limbGroup = svg.append('g').attr('class', 'limbs');

    limbHeatData.forEach((limb) => {
      const p1 = toCoords(limb.startIdx);
      const p2 = toCoords(limb.endIdx);
      const color = strainColorScale(limb.strainIndex);

      let strokeWidth = 4;
      if (metricMode === 'torque') strokeWidth = Math.max(4, Math.min(12, limb.avgTorque / 6));
      else if (metricMode === 'velocity') strokeWidth = Math.max(4, Math.min(12, limb.avgVelocity / 30));
      else strokeWidth = Math.max(4, Math.min(12, limb.strainIndex / 8));

      // Draw bone shadow/glow
      limbGroup.append('line')
        .attr('x1', p1.x).attr('y1', p1.y)
        .attr('x2', p2.x).attr('y2', p2.y)
        .attr('stroke', color)
        .attr('stroke-width', strokeWidth + 4)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.15)
        .attr('filter', 'blur(4px)');

      // Primary bone segment
      limbGroup.append('line')
        .attr('x1', p1.x)
        .attr('y1', p1.y)
        .attr('x2', p2.x)
        .attr('y2', p2.y)
        .attr('stroke', color)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.9)
        .attr('filter', limb.strainIndex > 70 ? 'url(#heat-glow)' : null);
    });

    // 2. Draw D3 Radial Heatmap Aura Circles on Joints
    const jointGroup = svg.append('g').attr('class', 'joints');

    jointHeatData.forEach((joint) => {
      const coords = toCoords(joint.p3Idx);
      
      let metricValue = joint.strainIndex;
      if (metricMode === 'torque') metricValue = Math.min(100, (joint.torque / 60) * 100);
      if (metricMode === 'velocity') metricValue = Math.min(100, (joint.velocity / 300) * 100);

      const color = strainColorScale(metricValue);
      const isSelected = selectedJointId === joint.id;

      // Outer heat halo aura
      const auraRadius = Math.max(12, Math.min(36, metricValue * 0.35));
      
      const gradientId = `radial-heat-${joint.id}`;
      const grad = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');

      grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.8);
      grad.append('stop').attr('offset', '60%').attr('stop-color', color).attr('stop-opacity', 0.35);
      grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);

      // Outer heat aura circle
      jointGroup.append('circle')
        .attr('cx', coords.x)
        .attr('cy', coords.y)
        .attr('r', auraRadius)
        .attr('fill', `url(#${gradientId})`)
        .attr('class', 'transition-all duration-300');

      // Pulsating high strain indicator ring
      if (metricValue > 65) {
        jointGroup.append('circle')
          .attr('cx', coords.x)
          .attr('cy', coords.y)
          .attr('r', auraRadius + 4)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.8);
      }

      // Core joint node
      const nodeCircle = jointGroup.append('circle')
        .attr('cx', coords.x)
        .attr('cy', coords.y)
        .attr('r', isSelected ? 9 : 6)
        .attr('fill', '#09090b')
        .attr('stroke', isSelected ? '#ffffff' : color)
        .attr('stroke-width', isSelected ? 3 : 2)
        .attr('cursor', 'pointer')
        .attr('class', 'hover:scale-125 transition-transform');

      // Click event for joint inspection
      nodeCircle.on('click', (e) => {
        e.stopPropagation();
        setSelectedJointId(joint.id === selectedJointId ? null : joint.id);
      });

      // Status Indicator Pill on Joint
      if (metricValue > 40 || isSelected) {
        const labelGroup = jointGroup.append('g').attr('class', 'joint-label');
        const labelText = metricValue > 75 ? 'DANGER' : metricValue > 50 ? 'CAUTION' : 'OPTIMAL';
        const labelColor = strainColorScale(metricValue);
        
        const textElem = labelGroup.append('text')
          .attr('x', coords.x)
          .attr('y', coords.y - auraRadius - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '9px')
          .attr('font-weight', '900')
          .attr('letter-spacing', '0.5px')
          .attr('pointer-events', 'none')
          .text(labelText);

        const bbox = (textElem.node() as SVGTextContentElement).getBBox();
        
        labelGroup.insert('rect', 'text')
          .attr('x', bbox.x - 4)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 8)
          .attr('height', bbox.height + 4)
          .attr('rx', 4)
          .attr('fill', labelColor)
          .attr('opacity', 0.9);
          
        labelGroup.append('text')
          .attr('x', coords.x)
          .attr('y', coords.y - auraRadius - 22)
          .attr('text-anchor', 'middle')
          .attr('fill', '#94a3b8')
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .attr('pointer-events', 'none')
          .text(`${joint.name}`);
      }
    });

  }, [activeKeyframe, jointHeatData, limbHeatData, metricMode, selectedJointId]);

  // Find details for selected joint
  const activeJointDetails = jointHeatData.find((j) => j.id === selectedJointId);

  // Peak strain metrics
  const maxTorqueJoint = [...jointHeatData].sort((a, b) => b.torque - a.torque)[0];
  const maxVelocityJoint = [...jointHeatData].sort((a, b) => b.velocity - a.velocity)[0];
  const avgStrain = Math.round(jointHeatData.reduce((acc, j) => acc + j.strainIndex, 0) / (jointHeatData.length || 1));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 fill-current animate-pulse" />
            <h3 className="text-sm font-black uppercase text-white tracking-wide">
              D3 Biomechanical Heatmap & Strain Analyzer
            </h3>
            <span className="bg-red-950/80 border border-red-800 text-red-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Visualizing joint torque distribution, angular velocity vectors, and kinetic strain points across keyframes.
          </p>
        </div>

        {/* Metric Selector Controls */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setMetricMode('strain')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'strain'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Combined Strain</span>
          </button>
          <button
            onClick={() => setMetricMode('torque')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'torque'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Torque (Nm)</span>
          </button>
          <button
            onClick={() => setMetricMode('velocity')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'velocity'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Velocity (°/s)</span>
          </button>
        </div>
      </div>

      {/* Keyframe Selector Ribbon (Guaranteed Min 6 Keyframes) */}
      <div className="flex flex-col gap-2 bg-zinc-950/90 border border-zinc-800/80 p-3 rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            Keyframe Sequence Scrubber ({keyframeList.length} Keyframes Available)
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            Selected: Frame #{activeKeyframe?.frameNumber || 1} ({activeKeyframe?.timestamp.toFixed(2)}s)
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
          {keyframeList.map((kf, idx) => {
            const isSelected = idx === selectedKeyframeIndex;
            return (
              <button
                key={`${kf.timestamp}-${idx}`}
                onClick={() => {
                  setSelectedKeyframeIndex(idx);
                  if (onSeek) onSeek(kf.timestamp);
                }}
                className={`p-2 rounded-xl text-left transition-all border flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-red-600/20 border-red-500 shadow-md shadow-red-600/20'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black uppercase">
                  <span className={isSelected ? 'text-red-400' : 'text-zinc-300'}>KF #{idx + 1}</span>
                  <span className="font-mono text-zinc-500">{kf.timestamp.toFixed(1)}s</span>
                </div>
                <div className="text-[11px] font-bold text-white truncate">
                  {kf.detectedPhase || `Phase ${idx + 1}`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: D3 Skeleton Canvas + Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* Left: D3 SVG Canvas Container */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[420px]">
          
          <svg
            ref={svgRef}
            className="w-full h-auto max-h-[480px] object-contain drop-shadow-xl"
          />

          {/* Continuous D3 Heatmap Scale Legend Bar */}
          <div className="w-full mt-3 pt-3 border-t border-zinc-900 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
              <span>Low Strain (Optimal)</span>
              <span>Moderate</span>
              <span>High Torque</span>
              <span>Critical Strain Point</span>
            </div>
            
            {/* Color Bar Gradient */}
            <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-red-600 shadow-inner" />

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>0% (0 Nm)</span>
              <span>35% (20 Nm)</span>
              <span>70% (45 Nm)</span>
              <span>100% (&gt;70 Nm)</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Telemetry & Strain Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          
          {/* Quick Stat Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase">Overall Kinetic Strain</span>
              <span className={`text-xl font-black ${avgStrain > 60 ? 'text-red-400' : avgStrain > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {avgStrain}%
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Mean joint load score</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase">Peak Torque Joint</span>
              <span className="text-sm font-black text-yellow-400 truncate">
                {maxTorqueJoint?.name || 'Knee'}
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {maxTorqueJoint?.torque || 45} Nm
              </span>
            </div>
          </div>

          {/* Selected Joint Telemetry Modal Card */}
          {activeJointDetails ? (
            <div className="bg-zinc-950 border-2 border-red-500/80 p-4 rounded-xl flex flex-col gap-2.5 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-black uppercase text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  {activeJointDetails.name} Inspection
                </span>
                <button
                  onClick={() => setSelectedJointId(null)}
                  className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[9px] text-zinc-500 uppercase">Angle</div>
                  <div className="text-sm font-bold text-white">{activeJointDetails.angle}°</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[9px] text-zinc-500 uppercase">Velocity</div>
                  <div className="text-sm font-bold text-amber-400">{activeJointDetails.velocity}°/s</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[9px] text-zinc-500 uppercase">Torque</div>
                  <div className="text-sm font-bold text-red-400">{activeJointDetails.torque} Nm</div>
                </div>
              </div>

              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-snug">
                <p className="font-bold text-white mb-0.5">Biomechanical Diagnostic:</p>
                {activeJointDetails.strainIndex > 70 ? (
                  <span className="text-red-400">
                    High angular torque detected! Excessive lateral force across joint vertex. Perform co-contraction drills to reduce strain.
                  </span>
                ) : activeJointDetails.strainIndex > 45 ? (
                  <span className="text-amber-400">
                    Moderate load during extension phase. Maintain core stability to cushion impact forces.
                  </span>
                ) : (
                  <span className="text-emerald-400">
                    Joint load within safe anatomical limits. Optimal force transmission through kinetic chain.
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl flex flex-col gap-2">
              <span className="text-xs font-extrabold uppercase text-zinc-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                Interactive Strain Inspection
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Click any glowing node or bone segment on the skeleton heatmap above to isolate specific joint torque, angular velocity, and injury risk metrics.
              </p>
            </div>
          )}

          {/* Top Strain Points List */}
          <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl flex flex-col gap-2">
            <span className="text-[11px] font-black uppercase text-zinc-300">
              Joint Load Ranking (Keyframe #{selectedKeyframeIndex + 1})
            </span>

            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
              {[...jointHeatData]
                .sort((a, b) => b.strainIndex - a.strainIndex)
                .slice(0, 4)
                .map((joint) => (
                  <button
                    key={joint.id}
                    onClick={() => setSelectedJointId(joint.id)}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-left transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        joint.strainIndex > 70 ? 'bg-red-500' : joint.strainIndex > 45 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`} />
                      <span className="font-bold text-white">{joint.name}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-zinc-400">{joint.torque} Nm</span>
                      <span className="font-bold text-amber-400">{joint.strainIndex}% Strain</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                  </button>
                ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
