"use client";

/**
 * AnalyzerPage.tsx
 * Anala · Video Editor & Analyzer
 * Design system: UI UX Pro Max Skill — Real-Time Monitoring / Dark Mode (OLED)
 * Stack: Next.js 14 App Router · Tailwind CSS · Lucide React
 */

import React, {
  useRef, useState, useCallback, useEffect, useReducer,
} from "react";
import { Activity, ChevronLeft, Download, Layers } from "lucide-react";

import VideoSection, { VideoHandle } from "./VideoSection";
import Timeline       from "./Timeline";
import EventPanel     from "./EventPanel";
import TaggingBar     from "./TaggingBar";

import type {
  SportEvent, EventTipo, EventSubtype, EventResult,
} from "@/types";
import { EVENT_CONFIGS, getEventCategory } from "@/types";

// ─── State ────────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD";    event: SportEvent }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE"; id: string; patch: Partial<SportEvent> };

function eventsReducer(state: SportEvent[], action: Action): SportEvent[] {
  switch (action.type) {
    case "ADD":    return [action.event, ...state].sort((a, b) => a.time - b.time);
    case "DELETE": return state.filter(e => e.id !== action.id);
    case "UPDATE": return state.map(e => e.id === action.id ? { ...e, ...action.patch } : e);
    default:       return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyzerPage() {
  const videoRef                          = useRef<VideoHandle>(null);
  const [events, dispatch]                = useReducer(eventsReducer, []);
  const [duration, setDuration]           = useState(0);
  const [currentTime, setCurrentTime]     = useState(0);
  const [activeEvent, setActiveEvent]     = useState<string | null>(null);
  const [drawMode, setDrawMode]           = useState(false);
  const [pendingTipo, setPendingTipo]     = useState<EventTipo | null>(null);

  // ── tick ──
  useEffect(() => {
    const id = setInterval(() => {
      const t = videoRef.current?.getCurrentTime() ?? 0;
      setCurrentTime(t);
    }, 200);
    return () => clearInterval(id);
  }, []);

  // ── add event ──
  const handleTag = useCallback(
    (tipo: EventTipo, subtype: EventSubtype, result: EventResult) => {
      const time = videoRef.current?.getCurrentTime() ?? 0;
      const id   = crypto.randomUUID();
      const ev: SportEvent = {
        id, time, tipo,
        subtype, result,
        player_id:   null,
        player_name: null,
        clip_start:  Math.max(0, time - 5),
        clip_end:    time,
        createdAt:   Date.now(),
      };
      dispatch({ type: "ADD", event: ev });
      setActiveEvent(id);
    },
    [],
  );

  // ── seek on click ──
  const handleSeek = useCallback((time: number) => {
    videoRef.current?.seekTo(time);
  }, []);

  // ── delete / update ──
  const handleDelete = useCallback((id: string) => {
    dispatch({ type: "DELETE", id });
    setActiveEvent(prev => (prev === id ? null : prev));
  }, []);

  const handleUpdate = useCallback(
    (id: string, patch: Partial<SportEvent>) =>
      dispatch({ type: "UPDATE", id, patch }),
    [],
  );

  // ── export JSON ──
  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = `anala_events_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  return (
    <div className="flex flex-col h-screen bg-[#080b0f] text-[#e2e8f0] overflow-hidden font-body select-none">

      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-4 h-11 border-b border-[#21262d] shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#e2e8f0] transition-colors text-xs">
            <ChevronLeft size={14} />
            <span>Partidos</span>
          </button>
          <span className="text-[#30363d]">·</span>
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-[#00ff88]" />
            <span className="font-display text-sm font-semibold tracking-widest text-[#e2e8f0] uppercase">
              Anala
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 tracking-wider">
              BETA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawMode(d => !d)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-all ${
              drawMode
                ? "bg-[#38bdf8]/10 border-[#38bdf8]/40 text-[#38bdf8]"
                : "bg-transparent border-[#30363d] text-[#8b949e] hover:border-[#484f58] hover:text-[#e2e8f0]"
            }`}
          >
            <Layers size={12} />
            Dibujo {drawMode ? "ON" : "OFF"}
          </button>

          <button
            onClick={handleExport}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border border-[#30363d] text-[#8b949e] hover:border-[#00ff88]/40 hover:text-[#00ff88] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <Download size={12} />
            Exportar
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Tagging bar ── */}
        <TaggingBar
          onTag={handleTag}
          pendingTipo={pendingTipo}
          setPendingTipo={setPendingTipo}
        />

        {/* ── Center: Video + Timeline ── */}
        <main className="flex flex-col flex-1 overflow-hidden">

          {/* Video */}
          <div className="flex-1 relative overflow-hidden bg-black">
            <VideoSection
              ref={videoRef}
              drawMode={drawMode}
              onDurationChange={setDuration}
            />
          </div>

          {/* Timeline */}
          <Timeline
            events={events}
            duration={duration}
            currentTime={currentTime}
            activeEvent={activeEvent}
            onSeek={handleSeek}
            onSelectEvent={setActiveEvent}
          />
        </main>

        {/* ── Right: Event panel ── */}
        <EventPanel
          events={events}
          activeEvent={activeEvent}
          currentTime={currentTime}
          onSelectEvent={(id) => {
            setActiveEvent(id);
            const ev = events.find(e => e.id === id);
            if (ev) handleSeek(ev.time);
          }}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onSeek={handleSeek}
        />
      </div>
    </div>
  );
}
