import React, { useRef, useEffect } from 'react';
import { FrameAnalysis } from '../types';

interface KineticHeatmapOverlayProps {
  currentFrame?: FrameAnalysis;
  videoDimensions: { width: number; height: number };
}

export const KineticHeatmapOverlay: React.FC<KineticHeatmapOverlayProps> = ({
  currentFrame,
  videoDimensions
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !currentFrame || !currentFrame.landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { width, height } = canvas;
    const landmarks = currentFrame.landmarks;
    const velocities = currentFrame.jointVelocities || {};
    const angularVelocities = currentFrame.velocity || {};

    // Kinetic exertion is often highest at the extremities and core during explosion
    // We'll map joint IDs to some common names if possible, but let's just use indices
    // and intensities based on any velocity we have.
    
    landmarks.forEach((lm, idx) => {
      if (lm.visibility !== undefined && lm.visibility < 0.5) return;

      // Calculate intensity from velocity
      let intensity = 0;
      
      const jointVel = velocities[idx.toString()];
      if (jointVel !== undefined) {
        // Normalized distance per second. 0.5 screen-widths per second is quite fast.
        intensity = Math.min(1, Math.abs(jointVel) / 0.8); 
      } else {
        // Fallback: Global angular exertion if no joint-specific data
        const globalVel = (Object.values(angularVelocities) as number[]).reduce((acc: number, v: number) => acc + Math.abs(v), 0);
        intensity = Math.min(0.8, globalVel / 2000); 
      }

      if (intensity < 0.05) return;

      const x = lm.x * width;
      const y = lm.y * height;

      // Draw heat spot
      const radius = 30 + (Number(intensity) * 40);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      // Color scale: Blue -> Yellow -> Red
      const color = (intensity as number) > 0.7 ? `rgba(244, 63, 94, ${(intensity as number) * 0.4})` : // rose-500
                    (intensity as number) > 0.4 ? `rgba(234, 179, 8, ${(intensity as number) * 0.3})` : // yellow-500
                    `rgba(14, 165, 233, ${(intensity as number) * 0.2})`; // sky-500

      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Add a global "glow" to the video if exertion is very high
    const globalExertion = (Object.values(angularVelocities) as number[]).reduce((acc: number, v: number) => acc + Math.abs(v), 0);
    if (globalExertion > 1500) {
       ctx.fillStyle = `rgba(244, 63, 94, ${Math.min(0.15, (globalExertion - 1500) / 5000)})`;
       ctx.fillRect(0, 0, width, height);
    }

  }, [currentFrame, videoDimensions]);

  return (
    <canvas
      ref={canvasRef}
      width={videoDimensions.width}
      height={videoDimensions.height}
      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-15 mix-blend-screen opacity-70"
    />
  );
};
