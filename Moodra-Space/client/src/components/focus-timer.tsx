import { useState, useEffect, useRef, useCallback } from "react";
import { Pause, Play, X, Timer } from "lucide-react";
import { useLang } from "@/contexts/language-context";

const LABELS: Record<string, {
  start: string; pause: string; resume: string; stop: string; deep: string;
}> = {
  en: { start: "Focus", pause: "Pause", resume: "Resume", stop: "Stop", deep: "In flow" },
  ru: { start: "Фокус", pause: "Пауза", resume: "Продолжить", stop: "Стоп", deep: "В потоке" },
  ua: { start: "Фокус", pause: "Пауза", resume: "Продовжити", stop: "Стоп", deep: "У потоці" },
  de: { start: "Fokus", pause: "Pause", resume: "Fortsetzen", stop: "Stop", deep: "Im Fluss" },
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ArcProgress({ seconds, size = 22 }: { seconds: number; size?: number }) {
  const totalSession = 25 * 60;
  const progress = Math.min(seconds / totalSession, 1);
  const r = (size - 3) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * progress;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(249,109,28,0.15)" strokeWidth="1.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F96D1C" strokeWidth="1.5"
        strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s linear" }} />
    </svg>
  );
}

export function FocusTimer() {
  const { lang } = useLang();
  const L = LABELS[lang] || LABELS.en;

  const [active, setActive] = useState(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setActive(true);
    setRunning(true);
    setSeconds(0);
  }, []);

  const togglePause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRunning(r => !r);
  }, []);

  const stop = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActive(false);
    setRunning(false);
    setSeconds(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  if (!active) {
    return (
      <button
        onClick={start}
        title={L.start}
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "4px 9px", borderRadius: "8px",
          background: "transparent", border: "1px solid rgba(249,109,28,0.0)",
          color: "#8a7a70", fontSize: "11px", fontWeight: 500,
          cursor: "pointer", transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = "rgba(249,109,28,0.07)";
          b.style.color = "#F96D1C";
          b.style.borderColor = "rgba(249,109,28,0.15)";
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = "transparent";
          b.style.color = "#8a7a70";
          b.style.borderColor = "rgba(249,109,28,0.0)";
        }}
      >
        <Timer style={{ width: 12, height: 12 }} />
        <span>{L.start}</span>
      </button>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: "3px",
        padding: "3px 6px 3px 5px", borderRadius: "10px",
        background: running ? "rgba(249,109,28,0.08)" : "rgba(0,0,0,0.04)",
        border: "1px solid",
        borderColor: running ? "rgba(249,109,28,0.22)" : "rgba(0,0,0,0.08)",
        transition: "all 0.3s",
      }}
    >
      <ArcProgress seconds={seconds} size={22} />
      <span
        className="font-mono tabular-nums"
        style={{
          fontSize: "11px", letterSpacing: "0.04em", fontWeight: 600,
          color: running ? "#F96D1C" : "#888",
          minWidth: "38px",
          transition: "color 0.3s",
        }}
      >
        {formatTime(seconds)}
      </span>
      {running && (
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#F96D1C", flexShrink: 0, boxShadow: "0 0 6px rgba(249,109,28,0.8)", animation: "timerPulse 2s ease-in-out infinite" }} />
      )}
      <div style={{ width: "1px", height: "12px", background: "rgba(0,0,0,0.08)", margin: "0 1px", flexShrink: 0 }} />
      <button
        onClick={togglePause}
        title={running ? L.pause : L.resume}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "20px", height: "20px", borderRadius: "6px",
          background: "transparent", border: "none",
          color: running ? "#F96D1C" : "#888",
          cursor: "pointer", transition: "all 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(249,109,28,0.12)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        {running ? <Pause style={{ width: 10, height: 10 }} /> : <Play style={{ width: 10, height: 10 }} />}
      </button>
      <button
        onClick={stop}
        title={L.stop}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "20px", height: "20px", borderRadius: "6px",
          background: "transparent", border: "none",
          color: "#aaa", cursor: "pointer", transition: "all 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = "rgba(239,68,68,0.10)";
          b.style.color = "#ef4444";
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = "transparent";
          b.style.color = "#aaa";
        }}
      >
        <X style={{ width: 10, height: 10 }} />
      </button>
    </div>
  );
}
