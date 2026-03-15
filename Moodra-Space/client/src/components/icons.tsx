interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const base = (size: number, sw: number) => ({
  width: size, height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

// ── Book icons ──────────────────────────────────────────────────────────────

export function MBookOpen({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M2 5.5C2 4.4 2.9 3.5 4 3.5H11V20.5H4C2.9 20.5 2 19.6 2 18.5V5.5Z" />
      <path d="M22 5.5C22 4.4 21.1 3.5 20 3.5H13V20.5H20C21.1 20.5 22 19.6 22 18.5V5.5Z" />
      <line x1="12" y1="3.5" x2="12" y2="20.5" />
      <path d="M5 7.5H9M5 10.5H10M5 13.5H8.5" strokeOpacity="0.45" />
      <path d="M15 7.5H19M15 10.5H19M15 13.5H17.5" strokeOpacity="0.45" />
    </svg>
  );
}

export function MBookClosed({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <rect x="4.5" y="2.5" width="13" height="19" rx="2" />
      <line x1="8" y1="2.5" x2="8" y2="21.5" />
      <path d="M11 7H15M11 11H16M11 15H14" strokeOpacity="0.5" />
    </svg>
  );
}

export function MBookFlip({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M12 21V4" />
      <path d="M4 4H11C11 4 11 8 8 10C11 12 11 17 11 17" strokeOpacity="0.8" />
      <path d="M20 4H13C13 4 13 8 16 10C13 12 13 17 13 17" strokeOpacity="0.8" />
      <path d="M4 21H20" />
    </svg>
  );
}

// ── Writing & creativity ────────────────────────────────────────────────────

export function MQuill({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M20.5 3.5C20.5 3.5 15 5 10 12L8 21L16 19C19.5 15.5 21.5 10 20.5 3.5Z" />
      <path d="M10 12L8 21" strokeOpacity="0.4" />
      <path d="M2.5 21.5L8 21" />
    </svg>
  );
}

export function MFeather({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" strokeOpacity="0.4" />
    </svg>
  );
}

export function MInk({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M12 2L8 9C6 13 7 17 12 20C17 17 18 13 16 9L12 2Z" />
      <path d="M12 14C12 14 10 12 10 11" strokeOpacity="0.4" />
    </svg>
  );
}

// ── AI & intelligence ───────────────────────────────────────────────────────

export function MAi({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      <path d="M19.5 16.5L20.3 19.3L22.5 20L20.3 20.7L19.5 23.5L18.7 20.7L16.5 20L18.7 19.3L19.5 16.5Z" strokeWidth={strokeWidth * 0.8} />
    </svg>
  );
}

export function MSparkles({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M9 3L10.5 7.5L15 9L10.5 10.5L9 15L7.5 10.5L3 9L7.5 7.5L9 3Z" />
      <path d="M18.5 13L19.4 15.6L21.5 16.5L19.4 17.4L18.5 20L17.6 17.4L15.5 16.5L17.6 15.6L18.5 13Z" strokeWidth={strokeWidth * 0.85} />
    </svg>
  );
}

export function MBrain({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M9.5 2C7 2 5 4 5 6.5C5 7 5.1 7.5 5.3 8C4 8.5 3 9.7 3 11.5C3 13 3.9 14.3 5.2 14.9C5 15.3 5 15.7 5 16C5 18.2 6.8 20 9 20H15C17.2 20 19 18.2 19 16C19 15.7 19 15.3 18.8 14.9C20.1 14.3 21 13 21 11.5C21 9.7 20 8.5 18.7 8C18.9 7.5 19 7 19 6.5C19 4 17 2 14.5 2C13.5 2 12.5 2.3 11.7 2.9C11 2.3 10.3 2 9.5 2Z" />
      <path d="M12 7V13" strokeOpacity="0.5" />
      <path d="M9 11H15" strokeOpacity="0.5" />
    </svg>
  );
}

// ── Science & research ──────────────────────────────────────────────────────

export function MFlask({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M9 3H15" />
      <path d="M10 3V9.5L5 18.5C4.5 19.5 5.2 21 6.5 21H17.5C18.8 21 19.5 19.5 19 18.5L14 9.5V3" />
      <path d="M6.5 15.5H17.5" strokeOpacity="0.35" />
      <circle cx="9.5" cy="17.5" r="0.7" fill="currentColor" strokeWidth="0" />
      <circle cx="14" cy="16.5" r="0.5" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

export function MCompass({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      <circle cx="12" cy="12" r="1" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

// ── Ideas & inspiration ─────────────────────────────────────────────────────

export function MBulb({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M12 2C8.7 2 6 4.7 6 8C6 10.5 7.4 12.7 9.5 13.8V16C9.5 16.6 9.9 17 10.5 17H13.5C14.1 17 14.5 16.6 14.5 16V13.8C16.6 12.7 18 10.5 18 8C18 4.7 15.3 2 12 2Z" />
      <path d="M10 17.5V19C10 19.6 10.4 20 11 20H13C13.6 20 14 19.6 14 19V17.5" />
      <line x1="10" y1="21" x2="14" y2="21" />
      <line x1="12" y1="5" x2="12" y2="6.5" strokeOpacity="0.35" />
      <line x1="9.2" y1="5.8" x2="9.9" y2="6.5" strokeOpacity="0.35" />
      <line x1="14.8" y1="5.8" x2="14.1" y2="6.5" strokeOpacity="0.35" />
    </svg>
  );
}

export function MNetwork({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="4.5" cy="18" r="2" />
      <circle cx="19.5" cy="18" r="2" />
      <line x1="12" y1="6.5" x2="12" y2="11.5" />
      <line x1="11" y1="12" x2="5.5" y2="16.5" />
      <line x1="13" y1="12" x2="18.5" y2="16.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

// ── Interface actions ───────────────────────────────────────────────────────

export function MGear({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2V4M12 20V22M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M2 12H4M20 12H22M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" strokeOpacity="0.65" />
    </svg>
  );
}

export function MGlobe({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3C12 3 9.5 7 9.5 12C9.5 17 12 21 12 21" />
      <path d="M12 3C12 3 14.5 7 14.5 12C14.5 17 12 21 12 21" />
      <path d="M3.5 9H20.5M3.5 15H20.5" strokeOpacity="0.45" />
    </svg>
  );
}

export function MKey({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="8" cy="10" r="5" />
      <path d="M13 10H22L20 12M18 10V13" />
      <circle cx="8" cy="10" r="1.5" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

export function MFlash({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M13 2L4 13.5H11.5L10.5 22L20.5 10H13L13 2Z" />
    </svg>
  );
}

export function MHome({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M3 10L12 3L21 10V20C21 20.6 20.6 21 20 21H15V16H9V21H4C3.4 21 3 20.6 3 20V10Z" />
    </svg>
  );
}

export function MPlus({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function MExport({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M12 3V14M8.5 10.5L12 14L15.5 10.5" />
      <path d="M4.5 17V19.5C4.5 20.3 5.2 21 6 21H18C18.8 21 19.5 20.3 19.5 19.5V17" />
    </svg>
  );
}

export function MUser({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" />
    </svg>
  );
}

export function MUsers({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M16 11C17.7 11 19 9.7 19 8C19 6.3 17.7 5 16 5" />
      <path d="M21 21C21 18.2 18.8 16 16 16" />
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21C2 17.7 5.1 15 9 15C12.9 15 16 17.7 16 21" />
    </svg>
  );
}

export function MLogout({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M9 21H5C4.4 21 4 20.6 4 20V4C4 3.4 4.4 3 5 3H9" />
      <path d="M16 17L21 12L16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function MCheck({ size = 20, strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function MArrowLeft({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function MArrowRight({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function MTrash({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6L18 20C18 20.6 17.6 21 17 21H7C6.4 21 6 20.6 6 20L5 6" />
      <path d="M10 11V17M14 11V17" strokeOpacity="0.55" />
      <path d="M9 6V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V6" />
    </svg>
  );
}

export function MSearch({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function MQuote({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M3 10C3 7.2 5.2 5 8 5H9V8.5H7.5C6.7 8.5 6 9.2 6 10V10.5H9V15H3V10Z" />
      <path d="M13 10C13 7.2 15.2 5 18 5H19V8.5H17.5C16.7 8.5 16 9.2 16 10V10.5H19V15H13V10Z" />
    </svg>
  );
}

export function MSave({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16L21 8V19C21 20.1 20.1 21 19 21Z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export function MFileText({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M14 2H6C5.4 2 5 2.4 5 3V21C5 21.6 5.4 22 6 22H18C18.6 22 19 21.6 19 21V7L14 2Z" />
      <polyline points="14 2 14 8 19 8" />
      <line x1="16" y1="13" x2="8" y2="13" strokeOpacity="0.6" />
      <line x1="16" y1="17" x2="8" y2="17" strokeOpacity="0.6" />
      <polyline points="10 9 9 9 8 9" strokeOpacity="0.6" />
    </svg>
  );
}

export function MX({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function MImagePlus({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <rect x="3" y="3" width="18" height="18" rx="2.18" ry="2.18" />
      <line x1="3" y1="15" x2="21" y2="15" strokeOpacity="0.4" />
      <polyline points="3 9 9 15 13 11 21 15" strokeOpacity="0.4" />
      <line x1="14" y1="7" x2="14" y2="11" />
      <line x1="12" y1="9" x2="16" y2="9" />
    </svg>
  );
}

export function MPdf({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M14 2H6C5.4 2 5 2.4 5 3V21C5 21.6 5.4 22 6 22H18C18.6 22 19 21.6 19 21V7L14 2Z" />
      <polyline points="14 2 14 8 19 8" />
      <path d="M8 13H9C9.6 13 10 13.4 10 14V15C10 15.6 9.6 16 9 16H8V17" strokeOpacity="0.65" />
      <path d="M12 13V17M12 13H13.5C14.3 13 15 13.7 15 14.5V15.5C15 16.3 14.3 17 13.5 17H12" strokeOpacity="0.65" />
      <path d="M17 13V17H19" strokeOpacity="0.65" />
      <line x1="17" y1="15" x2="18.5" y2="15" strokeOpacity="0.65" />
    </svg>
  );
}

export function MEpub({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M14 2H6C5.4 2 5 2.4 5 3V21C5 21.6 5.4 22 6 22H18C18.6 22 19 21.6 19 21V7L14 2Z" />
      <polyline points="14 2 14 8 19 8" />
      <path d="M8 12H16M8 16H13" strokeOpacity="0.55" />
      <circle cx="15.5" cy="16" r="2" />
    </svg>
  );
}

export function MExternalLink({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function MMenu({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function MChevronDown({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function MChevronRight({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function MLoader({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={`${className || ""} animate-spin`} style={style}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

export function MCheckCircle({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function MAlertCircle({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function MInfo({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function MStar({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function MTag({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export function MGrid({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export function MList({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function MLink({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function MDrag({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="9" cy="7" r="0.5" fill="currentColor" strokeWidth="0" />
      <circle cx="15" cy="7" r="0.5" fill="currentColor" strokeWidth="0" />
      <circle cx="9" cy="12" r="0.5" fill="currentColor" strokeWidth="0" />
      <circle cx="15" cy="12" r="0.5" fill="currentColor" strokeWidth="0" />
      <circle cx="9" cy="17" r="0.5" fill="currentColor" strokeWidth="0" />
      <circle cx="15" cy="17" r="0.5" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

export function MCopy({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function MMonitor({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export function MPalette({ size = 20, strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className} style={style}>
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
