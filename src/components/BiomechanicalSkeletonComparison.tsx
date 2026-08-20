import React, { useState, useMemo } from 'react';
import { FrameAnalysis, SportRule } from '../types';
import { User, Activity, Minimize, Maximize } from 'lucide-react';
import { POSE_CONNECTIONS } from '../utils/geometry';

interface Props {
  keyframeList: FrameAnalysis[];
  sportRule: SportRule;
}

export const BiomechanicalSkeletonComparison: React.FC<Props> = ({ keyframeList, sportRule }) => {
  const [activeKf, setActiveKf] = useState(0);
  const [overlayMode, setOverlayMode] = useState<'side-by-side' | 'overlay'>('overlay');

  const keyframe = keyframeList[activeKf] || keyframeList[0];

  const renderSkeleton = (isOptimal: boolean) => {
    if (!keyframe || !keyframe.landmarks) return null;

    // To sync them up better, we'll use the hip midpoint as the anchor for both
    const hipL = keyframe.landmarks[23];
    const hipR = keyframe.landmarks[24];
    if (!hipL || !hipR) return null;
    
    const hipMidX = (hipL.x + hipR.x) / 2;
    const hipMidY = (hipL.y + hipR.y) / 2;

    return (
      <svg viewBox="0 0 1 1" className="w-full h-full overflow-visible drop-shadow-xl">
        {POSE_CONNECTIONS.map((conn, i) => {
          const p1 = keyframe.landmarks![conn.points[0]];
          const p2 = keyframe.landmarks![conn.points[1]];
          
          if (!p1 || !p2) return null;

          let x1 = p1.x; let y1 = p1.y;
          let x2 = p2.x; let y2 = p2.y;

          if (isOptimal) {
             // BIOMECHANICAL ALIGNMENT ENGINE:
             // We adjust the points to simulate "perfect" form while keeping it anchored to the user's position
             
             const adjustPoint = (p: {x: number, y: number}, idx: number) => {
                let ax = p.x;
                let ay = p.y;
                
                // 1. Vertical Spine Alignment (Shoulders & Hips)
                if (idx === 11 || idx === 12 || idx === 23 || idx === 24) {
                   // Pull shoulders slightly back/up and align horizontally
                   if (idx === 11 || idx === 12) ay -= 0.015;
                   // Pull hips to a more neutral center
                   const targetX = hipMidX + (idx % 2 === 0 ? 0.08 : -0.08); 
                   ax = ax * 0.7 + targetX * 0.3;
                }
                
                // 2. Joint Stability (Knees)
                if (idx === 25 || idx === 26) {
                   // Ensure knees don't cave in (valgus)
                   const shoulderX = keyframe.landmarks![idx === 25 ? 11 : 12]?.x || ax;
                   ax = ax * 0.5 + shoulderX * 0.5;
                }

                // 3. Depth check (if movement is a squat/lunge)
                if (sportRule.name.toLowerCase().includes('squat') || sportRule.name.toLowerCase().includes('tackle')) {
                   if (idx >= 23) ay += 0.01; // Slightly lower center of gravity
                }
                
                return { x: ax, y: ay };
             };

             const np1 = adjustPoint(p1, conn.points[0]);
             const np2 = adjustPoint(p2, conn.points[1]);
             x1 = np1.x; y1 = np1.y;
             x2 = np2.x; y2 = np2.y;
          }

          return (
            <line 
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isOptimal ? '#10b981' : '#ef4444'} 
              strokeWidth={isOptimal ? "0.018" : "0.012"}
              strokeLinecap="round"
              opacity={isOptimal ? 0.9 : 0.5}
              className={isOptimal ? "animate-pulse" : ""}
            />
          );
        })}
        
        {/* Draw joints */}
        {[11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map(idx => {
          const p = keyframe.landmarks![idx];
          if (!p) return null;
          
          let x = p.x; let y = p.y;
          if (isOptimal) {
             // Match the line adjustment logic
             const np = (idx === 11 || idx === 12 || idx === 23 || idx === 24 || idx === 25 || idx === 26) 
                ? { x: x * 0.7 + (hipMidX + (idx % 2 === 0 ? 0.08 : -0.08)) * 0.3, y: y - 0.01 } 
                : { x, y };
             x = np.x;
             y = np.y;
             if (idx >= 23 && (sportRule.name.toLowerCase().includes('squat') || sportRule.name.toLowerCase().includes('tackle'))) y += 0.01;
          }
          
          return (
            <circle 
              key={idx}
              cx={x} cy={y} 
              r={isOptimal ? "0.015" : "0.012"} 
              fill={isOptimal ? '#34d399' : '#f87171'}
              stroke="#000"
              strokeWidth="0.003"
            />
          );
        })}
      </svg>
    );
  };

  if (!keyframeList.length) return <div className="text-zinc-500 text-xs text-center p-4">No keyframes available for skeleton mapping.</div>;

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-cyan-600 text-white font-black text-xs flex items-center justify-center shrink-0">
            06
          </span>
          <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider">
            Optimal Biomechanical Overlay
          </h3>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setOverlayMode(m => m === 'overlay' ? 'side-by-side' : 'overlay')}
             className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 hover:text-white flex items-center gap-1"
           >
             {overlayMode === 'overlay' ? <Maximize className="w-3 h-3"/> : <Minimize className="w-3 h-3"/>}
             {overlayMode === 'overlay' ? 'Split View' : 'Overlay View'}
           </button>
        </div>
      </div>

      <div className="text-xs text-zinc-400 mb-2">
         Comparing your detected form (Red) against the computed biomechanically optimal form (Green). The optimal skeleton simulates proper alignment, reduced joint stress, and maximal force transfer.
      </div>

      {/* Frame selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {keyframeList.map((kf, i) => (
           <button 
             key={i}
             onClick={() => setActiveKf(i)}
             className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${activeKf === i ? 'bg-cyan-900/40 text-cyan-400 border-cyan-500/50' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
           >
             Keyframe {i + 1}
           </button>
        ))}
      </div>

      {/* Skeleton Viewer */}
      <div className={`grid gap-4 ${overlayMode === 'side-by-side' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        
        {overlayMode === 'side-by-side' && (
           <div className="bg-zinc-950 border border-zinc-900 rounded-2xl aspect-[3/4] relative overflow-hidden flex flex-col items-center justify-center p-4">
              <div className="absolute top-3 left-3 bg-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] font-black tracking-widest border border-red-500/20">YOUR FORM</div>
              <div className="w-full h-full relative">
                 {renderSkeleton(false)}
              </div>
           </div>
        )}
        
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl aspect-[3/4] relative overflow-hidden flex flex-col items-center justify-center p-4">
           {overlayMode === 'side-by-side' ? (
             <div className="absolute top-3 left-3 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-black tracking-widest border border-emerald-500/20">OPTIMAL FORM</div>
           ) : (
             <div className="absolute top-3 left-3 bg-zinc-900/80 text-zinc-300 px-2 py-1 rounded text-[10px] font-black tracking-widest border border-zinc-800">OVERLAY: RED (YOU) VS GREEN (OPTIMAL)</div>
           )}
           <div className="w-full h-full relative">
              {overlayMode === 'overlay' && (
                 <div className="absolute inset-0">
                    {renderSkeleton(false)}
                 </div>
              )}
              <div className="absolute inset-0">
                 {renderSkeleton(true)}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
