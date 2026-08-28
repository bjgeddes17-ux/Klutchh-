import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { FrameAnalysis } from '../types';

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
      // Sum up all velocities to get a "total movement energy" value
      const totalVelocity = f.velocity 
        ? Object.values(f.velocity).reduce((acc: number, v: number) => acc + Math.abs(v), 0)
        : 0;
      
      return {
        timestamp: f.timestamp,
        value: totalVelocity,
        frame: f
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || chartData.length === 0 || width === 0) return;

    // Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const height = 120;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    const x = d3.scaleLinear()
      .domain([0, d3.max(chartData as any[], (d: any) => d.timestamp) || 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData as any[], (d: any) => d.value) || 1])
      .range([height - margin.bottom, margin.top]);

    // Create the gradient for the wave
    const gradientId = "velocity-gradient";
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#18181b"); // zinc-900
    gradient.append("stop").attr("offset", "40%").attr("stop-color", "#0ea5e9"); // sky-500
    gradient.append("stop").attr("offset", "75%").attr("stop-color", "#8b5cf6"); // violet-500
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#f43f5e"); // rose-500

    // Area generator
    const area = d3.area<any>()
      .x(d => x(d.timestamp))
      .y0(y(0))
      .y1(d => y(d.value))
      .curve(d3.curveBasis);

    // Append the area path
    svg.append("path")
      .datum(chartData)
      .attr("fill", `url(#${gradientId})`)
      .attr("fill-opacity", 0.5)
      .attr("d", area);

    // Line generator
    const line = d3.line<any>()
      .x(d => x(d.timestamp))
      .y(d => y(d.value))
      .curve(d3.curveBasis);

    // Append the stroke path
    svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.4)
      .attr("d", line);

    // Add Keyframes from kineticSequence
    if (kineticSequence?.steps) {
      kineticSequence.steps.forEach((step, idx) => {
        const stepX = x(step.timestamp);
        
        // Vertical line for keyframe
        svg.append("line")
          .attr("x1", stepX)
          .attr("x2", stepX)
          .attr("y1", margin.top)
          .attr("y2", height - margin.bottom)
          .attr("stroke", step.status === 'optimal' ? '#10b981' : step.status === 'warning' ? '#f59e0b' : '#ef4444')
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,2")
          .attr("opacity", 0.8);

        // Circle marker
        svg.append("circle")
          .attr("cx", stepX)
          .attr("cy", margin.top - 5)
          .attr("r", 5)
          .attr("fill", step.status === 'optimal' ? '#10b981' : step.status === 'warning' ? '#f59e0b' : '#ef4444')
          .attr("class", "cursor-pointer transition-all hover:scale-125")
          .on("click", () => onSeek?.(step.timestamp));

        // Label
        if (width > 300) {
           svg.append("text")
            .attr("x", stepX)
            .attr("y", margin.top - 12)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "9px")
            .attr("font-weight", "900")
            .attr("class", "uppercase tracking-tighter")
            .text(step.name.split(' ')[0]);
        }
      });
    }

    // Playback scrubber line
    svg.append("line")
      .attr("class", "scrubber-line")
      .attr("x1", x(currentTime))
      .attr("x2", x(currentTime))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#fbbf24") // amber-400
      .attr("stroke-width", 2)
      .style("pointer-events", "none");

    // Interaction overlay
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("click", (event) => {
        const [mouseX] = d3.pointer(event);
        const clickedTime = x.invert(mouseX);
        onSeek?.(clickedTime);
      });

  }, [chartData, kineticSequence, currentTime, width, onSeek]);

  return (
    <div ref={containerRef} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-3 relative group">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Kinetic Velocity Waveform</span>
            <span className="text-[7px] font-mono text-zinc-500 uppercase mt-0.5 tracking-tighter">Proximal-to-Distal Energy Transfer Pattern</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Load</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Explosion</span>
          </div>
        </div>
      </div>
      
      <svg 
        ref={svgRef} 
        width="100%" 
        height="120" 
        className="cursor-crosshair block overflow-visible"
      />
      
      <div className="absolute bottom-2 right-4 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
        <span className="text-[40px] font-black text-white italic tracking-tighter leading-none select-none">D3.JS</span>
      </div>
    </div>
  );
};
