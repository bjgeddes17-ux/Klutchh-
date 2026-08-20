const fs = require('fs');
let code = fs.readFileSync('src/components/VideoCropAndScrubber.tsx', 'utf8');

// Add cropBox state and refs
code = code.replace(
  "  const [isProcessing, setIsProcessing] = useState(false);",
  "  const [isProcessing, setIsProcessing] = useState(false);\n  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);\n  const [isDragging, setIsDragging] = useState(false);\n  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });"
);

// Add crop box drag handlers
code = code.replace(
  "  useEffect(() => {\n    const video = videoRef.current;",
  `  const handleCropStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setIsDragging(true);
    setDragStart({ x, y });
    setCropBox({ x, y, width: 0, height: 0 });
  };

  const handleCropMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    let currentX = (clientX - rect.left) / rect.width;
    let currentY = (clientY - rect.top) / rect.height;
    
    // clamp
    currentX = Math.max(0, Math.min(1, currentX));
    currentY = Math.max(0, Math.min(1, currentY));

    setCropBox({
      x: Math.min(dragStart.x, currentX),
      y: Math.min(dragStart.y, currentY),
      width: Math.abs(currentX - dragStart.x),
      height: Math.abs(currentY - dragStart.y),
    });
  };

  const handleCropEnd = () => {
    setIsDragging(false);
    if (cropBox && (cropBox.width < 0.05 || cropBox.height < 0.05)) {
      setCropBox(undefined);
    }
  };

  useEffect(() => {
    const video = videoRef.current;`
);

// Pass cropBox to MagicProcessingScreen
code = code.replace(
  "        targetAthleteAnchor={targetAthleteAnchor}",
  "        targetAthleteAnchor={targetAthleteAnchor}\n        cropBox={cropBox}"
);

// Update Video Container to accept mouse events and render cropBox
code = code.replace(
  '      <div\n        ref={containerRef}\n        className="relative w-full max-h-[62vh] bg-black rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl select-none flex items-center justify-center mb-5 mx-auto"\n        style={{ aspectRatio: videoAspect }}\n      >\n        <video\n          ref={videoRef}\n          src={videoUrl}\n          playsInline\n          muted\n          className="w-full h-full object-fill pointer-events-none"\n        />\n      </div>',
  `      <div
        ref={containerRef}
        className="relative w-full max-h-[62vh] bg-black rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl select-none flex items-center justify-center mb-5 mx-auto cursor-crosshair touch-none"
        style={{ aspectRatio: videoAspect }}
        onMouseDown={handleCropStart}
        onMouseMove={handleCropMove}
        onMouseUp={handleCropEnd}
        onMouseLeave={handleCropEnd}
        onTouchStart={handleCropStart}
        onTouchMove={handleCropMove}
        onTouchEnd={handleCropEnd}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted
          className="w-full h-full object-fill pointer-events-none"
        />
        {/* Spatial Crop Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-black/40">
          {cropBox ? (
            <div 
              className="absolute border-2 border-amber-400 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              style={{
                left: \`\${cropBox.x * 100}%\`,
                top: \`\${cropBox.y * 100}%\`,
                width: \`\${cropBox.width * 100}%\`,
                height: \`\${cropBox.height * 100}%\`
              }}
            >
              <div className="absolute top-1 left-1 bg-amber-400 text-zinc-950 font-black text-[10px] px-1.5 py-0.5 rounded shadow">CROP AREA</div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/60 px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center gap-2 backdrop-blur-md">
                <Scissors className="w-4 h-4 text-emerald-400" />
                Drag to draw a crop box around the athlete
              </div>
            </div>
          )}
        </div>
      </div>`
);

// Add Clear Crop Box button in the UI
code = code.replace(
  '          <div className="text-xs font-mono text-zinc-400 flex items-center gap-3">\n            <span className="text-white font-bold bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">\n              Current: {currentTime.toFixed(2)}s\n            </span>\n            <span>Duration: {duration.toFixed(2)}s</span>\n          </div>',
  `          <div className="flex items-center gap-2">
            {cropBox && (
              <button 
                onClick={() => setCropBox(undefined)}
                className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900 border border-red-500/30 text-red-200 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all"
              >
                Clear Crop Box
              </button>
            )}
            <div className="text-xs font-mono text-zinc-400 flex items-center gap-3">
              <span className="text-white font-bold bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                Current: {currentTime.toFixed(2)}s
              </span>
              <span>Duration: {duration.toFixed(2)}s</span>
            </div>
          </div>`
);

fs.writeFileSync('src/components/VideoCropAndScrubber.tsx', code);
console.log("Updated VideoCropAndScrubber.tsx");
