"use client";

/**
 * TaggingBar.tsx
 * Botonera vertical izquierda para marcar eventos rápidos.
 * UI UX Pro Max: Real-Time Monitoring — acción inmediata, feedback visual claro.
 */

import React, { useState, useCallback } from "react";
import type { EventTipo, EventSubtype, EventResult } from "@/types";
import {
  EVENT_CONFIGS, DOUBLE_EVENTS, SIMPLE_EVENTS,
  getEventCategory, getEventConfig,
} from "@/types";

interface Props {
  onTag:          (tipo: EventTipo, subtype: EventSubtype, result: EventResult) => void;
  pendingTipo:    EventTipo | null;
  setPendingTipo: (t: EventTipo | null) => void;
}

// Sólo mostramos los que no son legacy en la botonera
const QUICK_EVENTOS = EVENT_CONFIGS.filter(c => c.category !== "legacy");

// ─────────────────────────────────────────────────────────────────────────────

export default function TaggingBar({ onTag, pendingTipo, setPendingTipo }: Props) {
  const [subtypeStep, setSubtypeStep] = useState<EventSubtype | null>(null);
  const [stepFor, setStepFor]         = useState<EventTipo | null>(null);

  const handleButtonClick = useCallback((tipo: EventTipo) => {
    const cat = getEventCategory(tipo);

    if (cat === "binary") {
      // Confirmar directo
      onTag(tipo, null, null);
      flashFeedback(tipo);
      return;
    }

    if (cat === "simple") {
      // Necesita result → abrir mini picker
      setPendingTipo(tipo);
      setStepFor(tipo);
      setSubtypeStep(null);
      return;
    }

    if (cat === "double") {
      // Necesita subtype → result
      setPendingTipo(tipo);
      setStepFor(tipo);
      setSubtypeStep(null);
    }
  }, [onTag, setPendingTipo]);

  const handleSubtype = useCallback((sub: EventSubtype) => {
    setSubtypeStep(sub);
  }, []);

  const handleResult = useCallback((result: EventResult) => {
    if (!stepFor) return;
    onTag(stepFor, subtypeStep, result);
    flashFeedback(stepFor);
    setPendingTipo(null);
    setStepFor(null);
    setSubtypeStep(null);
  }, [stepFor, subtypeStep, onTag, setPendingTipo]);

  const cancelPending = useCallback(() => {
    setPendingTipo(null);
    setStepFor(null);
    setSubtypeStep(null);
  }, [setPendingTipo]);

  // flash de confirmación visual (DOM directo para velocidad)
  const flashFeedback = (tipo: EventTipo) => {
    const el = document.getElementById(`tag-btn-${tipo.replace(/\s/g, "_")}`);
    if (!el) return;
    el.classList.add("scale-95", "opacity-60");
    setTimeout(() => el.classList.remove("scale-95", "opacity-60"), 150);
  };

  const cat        = stepFor ? getEventCategory(stepFor) : null;
  const needsSub   = cat === "double";
  const needsResult= cat === "double" || cat === "simple";

  return (
    <aside className="w-[72px] shrink-0 flex flex-col items-center border-r border-[#21262d] bg-[#0d1117] py-2 gap-1 overflow-y-auto custom-scroll">

      {/* Label */}
      <span className="font-display text-[9px] tracking-widest text-[#484f58] uppercase mb-1">
        TAG
      </span>

      {/* Quick buttons */}
      {QUICK_EVENTOS.map(cfg => (
        <button
          id={`tag-btn-${cfg.tipo.replace(/\s/g, "_")}`}
          key={cfg.tipo}
          onClick={() => handleButtonClick(cfg.tipo)}
          title={cfg.tipo}
          className={`
            w-14 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border
            transition-all duration-100 active:scale-95
            ${pendingTipo === cfg.tipo
              ? `${cfg.bgColor} ${cfg.borderColor}`
              : `bg-transparent ${cfg.borderColor.split(" ")[0]} hover:${cfg.bgColor.split(" ")[0]}`
            }
          `}
        >
          <span className="text-base leading-none">{cfg.emoji}</span>
          <span className={`text-[8px] font-bold leading-tight text-center ${cfg.color}`}>
            {cfg.shortLabel}
          </span>
        </button>
      ))}

      {/* ── Inline picker overlay (bottom of bar) ── */}
      {pendingTipo && (
        <div className="fixed left-[72px] top-auto bottom-12 z-30 ml-1">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-3 w-48 space-y-3 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#e2e8f0]">
                {getEventConfig(pendingTipo).emoji} {pendingTipo}
              </span>
              <button
                onClick={cancelPending}
                className="text-[#484f58] hover:text-[#f43f5e] text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Step 1: subtype (only double) */}
            {needsSub && !subtypeStep && (
              <>
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Subtipo</p>
                <div className="flex gap-2">
                  {(["ofensivo", "defensivo"] as EventSubtype[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleSubtype(s)}
                      className="flex-1 py-1.5 rounded-lg border border-[#30363d] text-[10px] font-medium text-[#8b949e] hover:border-[#38bdf8]/40 hover:text-[#38bdf8] hover:bg-[#38bdf8]/5 transition-colors capitalize"
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSubtype(null)}
                    className="px-2 py-1.5 rounded-lg border border-[#21262d] text-[10px] text-[#30363d] hover:text-[#484f58] transition-colors"
                  >
                    —
                  </button>
                </div>
              </>
            )}

            {/* Step 2: result */}
            {needsResult && (cat === "simple" || subtypeStep !== undefined) && (
              <>
                {subtypeStep && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[#484f58]">Subtipo:</span>
                    <span className="text-[9px] font-semibold text-[#38bdf8] capitalize">{subtypeStep}</span>
                  </div>
                )}
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Resultado</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResult("correcto")}
                    className="flex-1 py-2 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-[11px] font-bold hover:bg-[#00ff88]/20 transition-colors"
                  >
                    ✓ OK
                  </button>
                  <button
                    onClick={() => handleResult("incorrecto")}
                    className="flex-1 py-2 rounded-lg bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] text-[11px] font-bold hover:bg-[#f43f5e]/20 transition-colors"
                  >
                    ✗ Error
                  </button>
                </div>
                <button
                  onClick={() => handleResult(null)}
                  className="w-full py-1.5 rounded-lg border border-[#21262d] text-[10px] text-[#484f58] hover:text-[#8b949e] transition-colors"
                >
                  Sin resultado
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
