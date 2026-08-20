/**
 * Draws animated video frames onto an offscreen canvas for sample clips.
 * Ensures 100% reliable sample video playback across all network environments.
 */

export function renderSampleSportFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sportId: string,
  timeSec: number
) {
  // Clear canvas
  ctx.fillStyle = '#0f172a'; // Dark court / stadium background
  ctx.fillRect(0, 0, width, height);

  // Draw Sport Field / Court Background
  if (sportId === 'sprinting') {
    // Red running track with lane lines
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, height * (i * 0.22));
      ctx.lineTo(width, height * (i * 0.22));
      ctx.stroke();
    }
  } else if (sportId === 'soccer') {
    // Green pitch grass
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 100, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Clean athletic floor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw Athlete Silhouette / Motion Frame
  const t = timeSec % 3; // 3-second movement loop
  const cycle = (t / 3) * Math.PI * 2;

  ctx.save();
  ctx.translate(width * 0.5, height * 0.45);

  // Draw Animated Athlete Avatar
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';

  // Running / Action posture
  const swing = Math.sin(cycle * 2) * 25;

  // Head
  ctx.beginPath();
  ctx.arc(0, -100, 18, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -82);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-20 - swing, 50);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(20 + swing, 50);
  ctx.stroke();

  ctx.restore();
}
