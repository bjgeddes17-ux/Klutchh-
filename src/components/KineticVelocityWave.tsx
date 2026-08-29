import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { FrameAnalysis } from '../types';
import { Zap, Activity, AlertTriangle, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface KineticSequenceStep {
  name: string;
  timestamp: number;
  score: number;
  status: 'optimal' | 'good' | 'warning' | 'error';
}

interface KineticSequence {
  steps: KineticSequenceStep[];
  firingOrder?: any[];
  isCorrectOrder?: boolean;
  sequenceEfficiency?: number;
}

interface KineticVelocityWaveProps {
  allFrames: FrameAnalysis[];
  kineticSequence?: KineticSequence;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export const KineticVelocityWave: React.FC<KineticVelocityWaveProps> = ({ 
  allFrames, 
  kineticSequence,
  currentTime = 0,
  onSeek
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoveredData, setHoveredData] = useState<{ timestamp: number; value: number; phase?: string } | null>(null);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Prepare data for D3
  const chartData = useMemo(() => {
    if (!allFrames || allFrames.length === 0) return [];

    return allFrames.map(f => {
      const totalVelocity = f.velocity 
        ? Object.values(f.velocity).reduce((acc: number, v: number) => acc + Math.abs(v), 0)
        : 0;
      
      return {
        timestamp: f.timestamp,
        value: totalVelocity,
        phase: f.detectedPhase,
        frame: f
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames]);

  const peakVelocity = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.value));
  }, [chartData]);

  const energyLeaksCount = useMemo(() => {
    let leaks = 0;
    for (let i = 1; i < chartData.length - 1; i++) {
      if (chartData[i].value < chartData[i - 1].value * 0.7 && chartData[i].value < chartData[i + 1].value * 0.8) {
        leaks++;
      }
    }
    return leaks;
  }, [chartData]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || chartData.length === 0 || width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const height = 140;
    const margin = { top: 25, right: 20, bottom: 25, left: 30 };

    const x = d3.scaleLinear()
      .domain([0, d3.max(chartData as any[], (d: any) => d.timestamp) || 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, (d3.max(chartData as any[], (d: any) => d.value) || 1) * 1.1])
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    const yTicks = y.ticks(4);
    svg.selectAll("g.grid-line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#27272a")
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.5);

    // Gradient
    const gradientId = "velocity-gradient-advanced";
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#09090b");
    gradient.append("stop").attr("offset", "50%").attr("stop-color", "#0284c7"); // sky-600
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#f43f5e"); // rose-500

    // Area
    const area = d3.area<any>()
      .x(d => x(d.timestamp))
      .y0(y(0))
      .y1(d => y(d.value))
      .curve(d3.curveBasis);

    svg.append("path")
      .datum(chartData)
      .attr("fill", `url(#${gradientId})`)
      .attr("fill-opacity", 0.45)
      .attr("d", area);

    // Line
    const line = d3.line<any>()
      .x(d => x(d.timestamp))
      .y(d => y(d.value))
      .curve(d3.curveBasis);

    svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Energy Leak Callouts
    for (let i = 1; i < chartData.length - 1; i++) {
      const prev = chartData[i - 1].value;
      const curr = chartData[i].value;
      const next = chartData[i + 1].value;

      if (curr < prev * 0.7 && curr < next * 0.8 && curr > 0) {
        const dropX = x(chartData[i].timestamp);
        const dropY = y(curr);

        svg.append("circle")
          .attr("cx", dropX)
          .attr("cy", dropY)
          .attr("r", 5)
          .attr("fill", "#ef4444")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2);

        svg.append("text")
          .attr("x", dropX)
          .attr("y", dropY - 10)
          .attr("text-anchor", "middle")
          .attr("fill", "#ef4444")
          .attr("font-size", "9px")
          .attr("font-weight", "900")
          .text("⚠️ ENERGY LEAK");
      }
    }

    // Keyframe sequence markers
    if (kineticSequence?.steps) {
      kineticSequence.steps.forEach((step) => {
        const stepX = x(step.timestamp);
        
        svg.append("line")
          .attr("x1", stepX)
          .attr("x2", stepX)
          .attr("y1", margin.top)
          .attr("y2", height - margin.bottom)
          .attr("stroke", step.status === 'optimal' ? '#10b981' : '#f59e0b')
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,4")
          .attr("opacity", 0.9);

        svg.append("circle")
          .attr("cx", stepX)
          .attr("cy", margin.top - 6)
          .attr("r", 6)
          .attr("fill", step.status === 'optimal' ? '#10b981' : '#f59e0b')
          .attr("class", "cursor-pointer")
          .on("click", () => onSeek?.(step.timestamp));
      });
    }

    // Playback scrubber line
    svg.append("line")
      .attr("x1", x(currentTime))
      .attr("x2", x(currentTime))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#fbbf24")
      .attr("stroke-width", 2.5)
      .style("pointer-events", "none");

    // Interactive overlay for seeking and tooltip
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("mousemove", (event) => {
        const [mouseX] = d3.pointer(event);
        const t = x.invert(mouseX);
        // Find closest point
        const closest = chartData.reduce((prev, curr) => 
          Math.abs(curr.timestamp - t) < Math.abs(prev.timestamp - t) ? curr : prev
        );
        if (closest) {
          setHoveredData(closest);
        }
      })
      .on("mouseleave", () => setHoveredData(null))
      .on("click", (event) => {
        const [mouseX] = d3.pointer(event);
        const clickedTime = x.invert(mouseX);
        onSeek?.(clickedTime);
      });

  }, [chartData, kineticSequence, currentTime, width, onSeek]);

  return (
    <div ref={containerRef} className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
      
      {/* Header telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-sky-500 animate-ping" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              Kinetic Velocity & Energy Transfer Waveform
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">
              Proximal-to-distal sequencing, force acceleration peaks, and energy leak diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-right">
            <div className="text-[9px] text-zinc-500 font-bold uppercase">Peak Velocity</div>
            <div className="text-xs font-mono font-black text-sky-400">{Math.round(peakVelocity)} deg/s</div>
          </div>
          <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-right">
            <div className="text-[9px] text-zinc-500 font-bold uppercase">Energy Leaks</div>
            <div className={`text-xs font-mono font-black ${energyLeaksCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {energyLeaksCount} Flagged
            </div>
          </div>
          <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-right">
            <div className="text-[9px] text-zinc-500 font-bold uppercase">Sequence Efficiency</div>
            <div className="text-xs font-mono font-black text-emerald-450">
              {kineticSequence?.sequenceEfficiency ?? 88}%
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Waveform SVG */}
      <div className="relative w-full bg-zinc-900/40 rounded-2xl p-2 border border-zinc-800/80">
        <svg 
          ref={svgRef} 
          width="100%" 
          height="140" 
          className="cursor-crosshair block overflow-visible"
        />

        {hoveredData && (
          <div className="absolute top-3 right-3 bg-zinc-950/95 border border-cyan-500/50 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-xl text-xs font-mono pointer-events-none flex items-center gap-3">
            <div>
              <span className="text-zinc-500">Time:</span> <strong className="text-white">{hoveredData.timestamp.toFixed(2)}s</strong>
            </div>
            <div>
              <span className="text-zinc-500">Velocity:</span> <strong className="text-cyan-400">{Math.round(hoveredData.value)} deg/s</strong>
            </div>
            {hoveredData.phase && (
              <div>
                <span className="text-zinc-500">Phase:</span> <strong className="text-amber-400">{hoveredData.phase}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kinetic Firing Order & Sequence Steps Info Bar */}
      {kineticSequence?.steps && kineticSequence.steps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mt-1">
          {kineticSequence.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => onSeek?.(step.timestamp)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                step.status === 'optimal'
                  ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500'
                  : step.status === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500'
                  : 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-mono">Step #{idx + 1}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  step.status === 'optimal' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-amber-900/50 text-amber-300'
                }`}>
                  {step.timestamp.toFixed(2)}s
                </span>
              </div>
              <div className="text-xs font-black text-white uppercase tracking-tight">
                {step.name}
              </div>
            </button>
          ))}
        </div>
      )}

    </div>
  );
};
