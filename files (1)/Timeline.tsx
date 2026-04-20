"use client";

/**
 * Timeline.tsx
 * Barra de tiempo interactiva con marcadores de eventos.
 * UI UX Pro Max: Data-Dense Dashboard pattern — cada píxel comunica algo.
 */

import React, { useRef, useCallback, useMemo } from "react";
import type { SportEvent } from "@/types";
import { getEventConfig } from "@/types";

interface Props {
  events:      SportEvent[];
  duration:    number;
  currentTime: number;
  activeEvent: string | null;
  onSeek:         (time: number) => void;
  onSelectEvent:  (id: string)   => void;
}

const RULER_HEIGHT = 18;
const TRACK_HEIGHT = 48;

export default function Timeline({
  events, duration, currentTime, activeEvent, onSeek, onSelectEvent,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? currentTime / duration : 0;

  // Click en la barra → seek
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  // Ticks de la regla
  const ticks = useMemo(() => {
    if (!duration) return [];
    const step  = duration <= 120 ? 10 : duration <= 600 ? 30 : 60;
    const count = Math.ceil(duration / step);
    return Array.from({ length: count + 1 }, (_, i) => ({
      t: i * step,
      pct: Math.min(1, (i * step) / duration) * 100,
    }));
  }, [duration]);

  const fmt = (s: number) => {
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  return (
    <div className="shrink-0 bg-[#0d1117] border-t border-[#21262d]" style={{ height: RULER_HEIGHT + TRACK_HEIGHT + 16 }}>

      {/* ── Ruler ── */}
      <div
        className="relative border-b border-[#21262d] cursor-pointer"
        style={{ height: RULER_HEIGHT }}
        onClick={handleClick}
      >
        {ticks.map(({ t, pct }) => (
          <div
            key={t}
            className="absolute top-0 flex flex-col items-center pointer-events-none"
            style={{ left: `${pct}%` }}
          >
            <div className="w-px h-2 bg-[#30363d]" />
            <span className="font-mono text-[9px] text-[#484f58] -translate-x-1/2 mt-0.5 whitespace-nowrap">
              {fmt(t)}
            </span>
          </div>
        ))}

        {/* Playhead on ruler */}
        <div
          className="absolute top-0 w-px h-full bg-[#00ff88] pointer-events-none"
          style={{ left: `${progress * 100}%` }}
        />
      </div>

      {/* ── Track ── */}
      <div
        className="relative mx-3 my-2 rounded-md bg-[#161b22] border border-[#21262d] cursor-pointer overflow-hidden"
        style={{ height: TRACK_HEIGHT }}
        onClick={handleClick}
      >
        {/* Elapsed fill */}
        <div
          className="absolute left-0 top-0 h-full bg-[#00ff88]/5 pointer-events-none transition-none"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Event markers */}
        {events.map(ev => {
          const cfg    = getEventConfig(ev.tipo);
          const pct    = duration > 0 ? (ev.time / duration) * 100 : 0;
          const isActive = ev.id === activeEvent;

          return (
            <button
              key={ev.id}
              onClick={e => { e.stopPropagation(); onSelectEvent(ev.id); onSeek(ev.time); }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-10 focus:outline-none"
              style={{ left: `${pct}%` }}
              title={`${ev.tipo} · ${fmt(ev.time)}`}
            >
              {/* Clip range band */}
              {isActive && duration > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-6 rounded pointer-events-none"
                  style={{
                    left:  `${((ev.clip_start - ev.time) / duration) * 10000}%`,
                    width: `${((ev.clip_end - ev.clip_start) / duration) * 10000}%`,
                    background: cfg.color.replace("text-", "").includes("green")
                      ? "rgba(0,255,136,0.08)" : "rgba(56,189,248,0.08)",
                    borderLeft:  `1px solid ${cfg.color}`,
                    borderRight: `1px solid ${cfg.color}`,
                  }}
                />
              )}

              {/* Marker dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 transition-transform ${
                  isActive
                    ? "scale-125 border-white"
                    : "group-hover:scale-110 border-[#0d1117]"
                }`}
                style={{ background: cfg.bgColor.includes("green") ? "#00ff88" : "#38bdf8" }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                <div className="bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-[10px] font-mono whitespace-nowrap">
                  <span className="font-semibold text-[#e2e8f0]">{ev.tipo}</span>
                  <span className="text-[#484f58] ml-1.5">{fmt(ev.time)}</span>
                </div>
                <div className="w-px h-1.5 bg-[#30363d] mx-auto" />
              </div>
            </button>
          );
        })}

        {/* Playhead line */}
        <div
          className="absolute top-0 w-0.5 h-full bg-[#00ff88] pointer-events-none z-20"
          style={{ left: `${progress * 100}%` }}
        >
          <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00ff88]" />
        </div>

        {/* Empty state */}
        {events.length === 0 && duration > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] text-[#30363d] font-mono">
              Marcá eventos con los botones de la izquierda
            </span>
          </div>
        )}

        {!duration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] text-[#30363d] font-mono">
              Cargá un video para comenzar
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
