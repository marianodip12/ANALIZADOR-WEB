"use client";

/**
 * VideoSection.tsx
 * Video player + Canvas drawing overlay
 * UI UX Pro Max: Real-Time Monitoring — dark, high-contrast, zero chrome
 */

import React, {
  useRef, useState, useEffect, useCallback,
  forwardRef, useImperativeHandle,
} from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize2,
  RotateCcw, Upload, Eraser, Pen,
} from "lucide-react";

export interface VideoHandle {
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
}

interface Props {
  drawMode: boolean;
  onDurationChange: (d: number) => void;
}

type DrawColor = "#00ff88" | "#f43f5e" | "#38bdf8" | "#fbbf24" | "#ffffff";

const DRAW_COLORS: { color: DrawColor; label: string }[] = [
  { color: "#00ff88", label: "Verde"  },
  { color: "#f43f5e", label: "Rojo"   },
  { color: "#38bdf8", label: "Azul"   },
  { color: "#fbbf24", label: "Amarillo"},
  { color: "#ffffff", label: "Blanco" },
];

// ─────────────────────────────────────────────────────────────────────────────

const VideoSection = forwardRef<VideoHandle, Props>(function VideoSection(
  { drawMode, onDurationChange },
  ref,
) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [src, setSrc]            = useState<string | null>(null);
  const [playing, setPlaying]    = useState(false);
  const [muted, setMuted]        = useState(false);
  const [volume, setVolume]      = useState(1);
  const [progress, setProgress]  = useState(0);
  const [duration, setDuration]  = useState(0);
  const [drawColor, setDrawColor] = useState<DrawColor>("#00ff88");
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Expose handle
  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    seekTo: (t) => { if (videoRef.current) videoRef.current.currentTime = t; },
  }));

  // File upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("video/")) return;
    setSrc(URL.createObjectURL(file));
  }, []);

  // Playback controls
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
    setPlaying(!playing);
  }, [playing]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  const handleVolumeChange = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
  }, []);

  const handleSeekBar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * duration;
  }, [duration]);

  const skip = useCallback((sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + sec));
  }, [duration]);

  // Video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime     = () => setProgress(v.currentTime / (v.duration || 1));
    const onDuration = () => {
      setDuration(v.duration);
      onDurationChange(v.duration);
    };
    const onEnded = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDuration);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDuration);
      v.removeEventListener("ended", onEnded);
    };
  }, [onDurationChange]);

  // Canvas drawing
  const getCanvasPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect  = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top)  * scaleY,
      };
    },
    [],
  );

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawMode) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    if (!pos) return;
    setIsDrawing(true);
    lastPos.current = pos;
  }, [drawMode, getCanvasPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawMode || !isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    const pos    = getCanvasPos(e);
    if (!ctx || !pos || !lastPos.current) return;

    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth   = brushSize;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [drawMode, isDrawing, drawColor, brushSize, getCanvasPos]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── No video uploaded ──
  if (!src) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[#21262d] hover:border-[#00ff88]/30 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById("video-input")?.click()}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
          <Upload size={22} className="text-[#484f58]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[#8b949e]">Arrastrá tu video o hacé clic para subir</p>
          <p className="text-xs text-[#484f58] mt-1">MP4, MOV, WebM · máx 4GB</p>
        </div>
        <input
          id="video-input"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black">

      {/* Video + Canvas stack */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          className="absolute inset-0 w-full h-full object-contain"
          onClick={togglePlay}
        />

        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className={`absolute inset-0 w-full h-full ${
            drawMode ? "cursor-crosshair" : "pointer-events-none"
          }`}
          style={{ opacity: 1 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        {/* Draw toolbar (top-right, only when drawMode) */}
        {drawMode && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-[#0d1117]/90 backdrop-blur-sm border border-[#30363d] rounded-lg px-2.5 py-2">
            {DRAW_COLORS.map(({ color, label }) => (
              <button
                key={color}
                title={label}
                onClick={() => setDrawColor(color)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{
                  background: color,
                  outline: drawColor === color ? `2px solid ${color}` : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
            <div className="w-px h-4 bg-[#30363d] mx-1" />
            <input
              type="range" min={1} max={12} value={brushSize} step={1}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-16 accent-[#00ff88] cursor-pointer"
            />
            <button
              onClick={clearCanvas}
              title="Limpiar canvas"
              className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f43f5e] transition-colors"
            >
              <Eraser size={13} />
            </button>
          </div>
        )}

        {/* Center play/pause overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          {!playing && (
            <div className="w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center opacity-80">
              <Play size={22} className="text-white ml-1" />
            </div>
          )}
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="shrink-0 bg-[#0d1117] border-t border-[#21262d] px-4 py-2 space-y-2">

        {/* Progress bar */}
        <div
          className="relative h-1.5 bg-[#21262d] rounded-full cursor-pointer group"
          onClick={handleSeekBar}
        >
          <div
            className="absolute left-0 top-0 h-full bg-[#00ff88] rounded-full transition-none"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00ff88] border-2 border-[#0d1117] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress * 100}% - 6px)` }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => skip(-10)}
              className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e2e8f0] transition-colors"
              title="-10s"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-md bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/20 transition-colors"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e2e8f0] transition-colors"
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                className="w-16 accent-[#00ff88] cursor-pointer"
              />
            </div>
          </div>

          <span className="font-mono text-[11px] text-[#484f58] tabular-nums">
            {formatTime(progress * duration)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-1">
            {drawMode && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/20 px-2 py-0.5 rounded">
                <Pen size={9} /> DRAW
              </span>
            )}
            <button
              className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e2e8f0] transition-colors"
              onClick={() => videoRef.current?.requestFullscreen?.()}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VideoSection;
