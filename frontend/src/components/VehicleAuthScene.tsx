import { motion } from "framer-motion";

const VEHICLES = [
  { emoji: "🚗", y: "72%", duration: 14, delay: 0, size: "2.8rem" },
  { emoji: "🛵", y: "78%", duration: 10, delay: 3, size: "2.2rem" },
  { emoji: "🚙", y: "68%", duration: 18, delay: 7, size: "2.6rem" },
  { emoji: "🚌", y: "75%", duration: 22, delay: 11, size: "2.4rem" },
];

const FLOATERS = [
  { icon: "🛡", label: "Insurance", x: "4%", y: "12%", delay: 0 },
  { icon: "📄", label: "RC & Docs", x: "82%", y: "10%", delay: 0.4 },
  { icon: "🚨", label: "Challans", x: "88%", y: "28%", delay: 0.8 },
  { icon: "🔧", label: "Service", x: "3%", y: "32%", delay: 1.2 },
  { icon: "⚡", label: "EV Ready", x: "78%", y: "72%", delay: 0.6 },
  { icon: "🏛", label: "RTO", x: "6%", y: "78%", delay: 1 },
];

export default function VehicleAuthScene() {
  return (
    <div className="auth-scene" aria-hidden>
      <div className="auth-scene__glow auth-scene__glow--1" />
      <div className="auth-scene__glow auth-scene__glow--2" />

      {FLOATERS.map((f) => (
        <motion.div
          key={f.label}
          className="auth-scene__floater pill"
          style={{ left: f.x, top: f.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{ delay: f.delay + 0.3, duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {f.icon} {f.label}
        </motion.div>
      ))}

      <div className="auth-scene__road">
        <div className="auth-scene__road-surface" />
        <div className="auth-scene__lane auth-scene__lane--1" />
        <div className="auth-scene__lane auth-scene__lane--2" />
      </div>

      {VEHICLES.map((v, i) => (
        <motion.div
          key={i}
          className="auth-scene__vehicle"
          style={{ top: v.y, fontSize: v.size }}
          initial={{ x: "-20vw" }}
          animate={{ x: "120vw" }}
          transition={{ duration: v.duration, delay: v.delay, repeat: Infinity, ease: "linear" }}
        >
          <span className="auth-scene__exhaust" />
          <span className="auth-scene__emoji">{v.emoji}</span>
        </motion.div>
      ))}

      <motion.div
        className="auth-scene__wheel"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" width="72" height="72">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(139,92,246,.5)" strokeWidth="6" />
          <circle cx="50" cy="50" r="12" fill="var(--violet)" />
          {[0, 45, 90, 135].map((deg) => (
            <line key={deg} x1="50" y1="50" x2="50" y2="14" stroke="rgba(255,255,255,.35)" strokeWidth="4" transform={`rotate(${deg} 50 50)`} />
          ))}
        </svg>
      </motion.div>

      <motion.div
        className="auth-scene__signal"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="auth-scene__signal-light auth-scene__signal-light--r" />
        <span className="auth-scene__signal-light auth-scene__signal-light--y" />
        <span className="auth-scene__signal-light auth-scene__signal-light--g" />
      </motion.div>

      <div className="auth-scene__stats">
        <motion.div className="glass auth-scene__stat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <div className="text-grad" style={{ fontWeight: 800, fontSize: "1.4rem" }}>86</div>
          <div className="text-muted-2" style={{ fontSize: ".72rem" }}>Compliance</div>
        </motion.div>
        <motion.div className="glass auth-scene__stat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <div className="text-grad" style={{ fontWeight: 800, fontSize: "1.4rem" }}>3</div>
          <div className="text-muted-2" style={{ fontSize: ".72rem" }}>Vehicles</div>
        </motion.div>
      </div>
    </div>
  );
}
