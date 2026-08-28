import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={`reveal ${className}`.trim()} style={{ animationDelay: `${delay}s` }}>{children}</div>;
}

export function AuroraBackground() {
  return null;
}

export function ScoreRing({
  value,
  size = 120,
  label,
  sub,
  color = "url(#ringGrad)",
}: {
  value: number;
  size?: number;
  label?: string;
  sub?: string;
  color?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-label">
        <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: size * 0.24 }}>{value}</div>
        {label && <div className="text-muted-2" style={{ fontSize: 11 }}>{label}</div>}
        {sub && <div className="text-muted-2" style={{ fontSize: 10 }}>{sub}</div>}
      </div>
    </div>
  );
}

const STATUS_MAP: Record<string, { cls: string; icon: string; text: string }> = {
  valid: { cls: "badge-valid", icon: "✓", text: "Valid" },
  paid: { cls: "badge-valid", icon: "✓", text: "Paid" },
  clear: { cls: "badge-valid", icon: "✓", text: "Clear" },
  expiring: { cls: "badge-expiring", icon: "⚠", text: "Expiring" },
  expired: { cls: "badge-expired", icon: "✕", text: "Expired" },
};

export function StatusBadge({ status, text }: { status: string; text?: string }) {
  const m = STATUS_MAP[status] || STATUS_MAP.valid;
  return (
    <span className={`badge-status ${m.cls}`}>
      {m.icon} {text || m.text}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  sub,
  center,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center mx-auto" : ""} style={center ? { maxWidth: 720 } : {}}>
      {eyebrow && <div className="pill mb-3">✨ {eyebrow}</div>}
      <h2 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800 }}>
        {title}
      </h2>
      {sub && <p className="text-muted-2 mt-2" style={{ fontSize: "1.05rem" }}>{sub}</p>}
    </div>
  );
}
