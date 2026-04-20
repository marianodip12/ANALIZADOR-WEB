"use client";

/**
 * EventPanel.tsx
 * Panel derecho: lista dinámica de eventos con edición inline.
 * UI UX Pro Max: Drill-Down Analytics — cada evento es expandible y editable.
 */

import React, { useState, useCallback } from "react";
import {
  Clock, Trash2, ChevronDown, ChevronRight,
  User, CheckCircle2, XCircle, Search,
} from "lucide-react";
import type { SportEvent, EventSubtype, EventResult } from "@/types";
import { getEventConfig } from "@/types";

interface Props {
  events:       SportEvent[];
  activeEvent:  string | null;
  currentTime:  number;
  onSelectEvent:(id: string) => void;
  onDelete:     (id: string) => void;
  onUpdate:     (id: string, patch: Partial<SportEvent>) => void;
  onSeek:       (time: number) => void;
}

const RESULT_OPTIONS: { value: EventResult; label: string; cls: string }[] = [
  { value: "correcto",   label: "Correcto",   cls: "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30" },
  { value: "incorrecto", label: "Incorrecto", cls: "text-[#f43f5e] bg-[#f43f5e]/10 border-[#f43f5e]/30" },
];

const SUBTYPE_OPTIONS: { value: EventSubtype; label: string }[] = [
  { value: "ofensivo",   label: "Ofensivo"  },
  { value: "defensivo",  label: "Defensivo" },
];

function fmt(s: number) {
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms  = Math.floor((s % 1) * 10);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${ms}`;
}

// ─────────────────────────────────────────────────────────────────────────────

function EventRow({
  event, isActive, onSelect, onDelete, onUpdate,
}: {
  event:    SportEvent;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<SportEvent>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getEventConfig(event.tipo);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(x => !x);
  };

  const handleTimeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parts = e.target.value.split(":").map(Number);
      if (parts.length === 2) {
        const t = parts[0] * 60 + parts[1];
        if (!isNaN(t)) onUpdate({ time: t, clip_start: Math.max(0, t - 5), clip_end: t });
      }
    },
    [onUpdate],
  );

  // colour dot derived from config
  const dotColor = cfg.ringColor.replace("ring-", "");

  return (
    <div
      className={`group border-b border-[#21262d] transition-colors ${
        isActive ? "bg-[#161b22]" : "hover:bg-[#161b22]/50"
      }`}
    >
      {/* ── Row header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={onSelect}
      >
        {/* Color dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: cfg.borderColor.includes("green") ? "#00ff88" : "#38bdf8" }}
        />

        {/* tipo */}
        <span className={`text-xs font-semibold flex-1 truncate ${cfg.color}`}>
          {cfg.emoji} {event.tipo}
        </span>

        {/* result badge */}
        {event.result && (
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              event.result === "correcto"
                ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20"
                : "text-[#f43f5e] bg-[#f43f5e]/10 border-[#f43f5e]/20"
            }`}
          >
            {event.result === "correcto" ? "✓" : "✗"}
          </span>
        )}

        {/* time */}
        <span className="font-mono text-[10px] text-[#484f58] tabular-nums shrink-0">
          {fmt(event.time)}
        </span>

        {/* expand / collapse */}
        <button
          onClick={toggleExpand}
          className="p-0.5 rounded hover:bg-[#30363d] text-[#484f58] hover:text-[#8b949e] transition-colors shrink-0"
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>

        {/* delete (visible on hover) */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 rounded hover:bg-[#f43f5e]/10 text-[#30363d] hover:text-[#f43f5e] transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* ── Expanded edit form ── */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-[#21262d] pt-2.5">

          {/* Time input */}
          <div className="flex items-center gap-2">
            <Clock size={11} className="text-[#484f58] shrink-0" />
            <label className="text-[10px] text-[#8b949e] w-16 shrink-0">Tiempo</label>
            <input
              type="text"
              defaultValue={`${Math.floor(event.time / 60)}:${Math.floor(event.time % 60).toString().padStart(2, "0")}`}
              onBlur={handleTimeInput}
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[11px] font-mono text-[#e2e8f0] focus:border-[#00ff88]/40 focus:outline-none transition-colors"
              placeholder="0:00"
            />
          </div>

          {/* Player */}
          <div className="flex items-center gap-2">
            <User size={11} className="text-[#484f58] shrink-0" />
            <label className="text-[10px] text-[#8b949e] w-16 shrink-0">Jugador</label>
            <input
              type="text"
              defaultValue={event.player_name ?? ""}
              onBlur={e => onUpdate({ player_name: e.target.value || null })}
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#e2e8f0] focus:border-[#00ff88]/40 focus:outline-none transition-colors"
              placeholder="Nombre…"
            />
          </div>

          {/* Subtype */}
          {event.subtype !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[#484f58] w-[11px] shrink-0 text-[11px]">⇄</span>
              <label className="text-[10px] text-[#8b949e] w-16 shrink-0">Subtipo</label>
              <div className="flex gap-1">
                {SUBTYPE_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => onUpdate({ subtype: event.subtype === o.value ? null : o.value })}
                    className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                      event.subtype === o.value
                        ? "bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8]"
                        : "bg-transparent border-[#30363d] text-[#484f58] hover:border-[#484f58]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          <div className="flex items-center gap-2">
            <CheckCircle2 size={11} className="text-[#484f58] shrink-0" />
            <label className="text-[10px] text-[#8b949e] w-16 shrink-0">Resultado</label>
            <div className="flex gap-1">
              {RESULT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => onUpdate({ result: event.result === o.value ? null : o.value })}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                    event.result === o.value ? o.cls : "bg-transparent border-[#30363d] text-[#484f58] hover:border-[#484f58]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clip range */}
          <div className="flex items-center gap-2">
            <span className="text-[#484f58] w-[11px] shrink-0 text-[11px]">✂</span>
            <label className="text-[10px] text-[#8b949e] w-16 shrink-0">Clip</label>
            <span className="font-mono text-[10px] text-[#484f58]">
              {fmt(event.clip_start)} → {fmt(event.clip_end)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EventPanel({
  events, activeEvent, currentTime, onSelectEvent, onDelete, onUpdate, onSeek,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "correcto" | "incorrecto">("all");

  const filtered = events.filter(ev => {
    if (filter === "correcto"   && ev.result !== "correcto")   return false;
    if (filter === "incorrecto" && ev.result !== "incorrecto") return false;
    if (search && !ev.tipo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total:    events.length,
    ok:       events.filter(e => e.result === "correcto").length,
    bad:      events.filter(e => e.result === "incorrecto").length,
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col border-l border-[#21262d] bg-[#0d1117]">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#21262d]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-[11px] font-semibold tracking-widest text-[#8b949e] uppercase">
            Eventos
          </span>
          <span className="font-mono text-[10px] text-[#484f58]">
            {events.length}
          </span>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-1 mb-2.5">
          {[
            { label: "Total", val: stats.total, cls: "text-[#e2e8f0]" },
            { label: "OK",    val: stats.ok,    cls: "text-[#00ff88]" },
            { label: "Err",   val: stats.bad,   cls: "text-[#f43f5e]" },
          ].map(s => (
            <div key={s.label} className="bg-[#161b22] rounded px-1.5 py-1 text-center border border-[#21262d]">
              <div className={`font-mono text-sm font-bold ${s.cls}`}>{s.val}</div>
              <div className="text-[9px] text-[#484f58]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#484f58]" />
          <input
            type="text"
            placeholder="Buscar evento…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#161b22] border border-[#21262d] rounded px-2 py-1.5 pl-6 text-[11px] text-[#e2e8f0] placeholder-[#30363d] focus:border-[#00ff88]/30 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(["all", "correcto", "incorrecto"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-[9px] font-semibold py-1 rounded border transition-colors ${
                filter === f
                  ? f === "all"
                    ? "bg-[#30363d] border-[#484f58] text-[#e2e8f0]"
                    : f === "correcto"
                    ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                    : "bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]"
                  : "bg-transparent border-[#21262d] text-[#484f58] hover:border-[#30363d]"
              }`}
            >
              {f === "all" ? "Todos" : f === "correcto" ? "✓ OK" : "✗ Error"}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <XCircle size={20} className="text-[#30363d]" />
            <span className="text-[11px] text-[#30363d]">Sin eventos</span>
          </div>
        ) : (
          filtered.map(ev => (
            <EventRow
              key={ev.id}
              event={ev}
              isActive={ev.id === activeEvent}
              onSelect={() => onSelectEvent(ev.id)}
              onDelete={() => onDelete(ev.id)}
              onUpdate={patch => onUpdate(ev.id, patch)}
            />
          ))
        )}
      </div>

      {/* Current time display */}
      <div className="px-3 py-2 border-t border-[#21262d] flex items-center justify-between">
        <span className="text-[10px] text-[#484f58]">Tiempo actual</span>
        <span className="font-mono text-[11px] text-[#00ff88]">{fmt(currentTime)}</span>
      </div>
    </aside>
  );
}
