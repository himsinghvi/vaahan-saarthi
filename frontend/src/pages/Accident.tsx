import { useState } from "react";
import { motion } from "framer-motion";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";

const STEPS = [
  { icon: "🦺", t: "Ensure personal safety", d: "Move to a safe spot, switch on hazard lights, place a warning triangle." },
  { icon: "📷", t: "Photograph everything", d: "Vehicle damage, number plates, the scene and the other vehicle." },
  { icon: "📋", t: "Capture details", d: "Location, time, other driver's details and insurance info." },
  { icon: "👮", t: "Police reporting", d: "Check if an FIR is required (injuries / major damage / dispute)." },
  { icon: "🛡", t: "Start insurance claim", d: "We guide you through cashless claim at a network garage." },
];

export default function Accident() {
  const [started, setStarted] = useState(false);
  return (
    <Page>
      <Reveal>
        <div className="footer-cta p-4 p-md-5 text-center mb-4" style={{ background: "var(--grad-warm)", color: "#0a0a12" }}>
          <div style={{ fontSize: "2.6rem" }}>🚨</div>
          <h2 className="display" style={{ fontWeight: 800 }}>Accident Assistance</h2>
          <p style={{ maxWidth: 520, margin: "8px auto 20px", opacity: 0.85 }}>Are you safe? If anyone is injured, call emergency services first.</p>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <a href="tel:112" className="btn" style={{ background: "#0a0a12", color: "#fff", borderRadius: 999, padding: "12px 26px", fontWeight: 700 }}>📞 Call 112</a>
            <button className="btn" style={{ background: "#fff", color: "#0a0a12", borderRadius: 999, padding: "12px 26px", fontWeight: 700 }} onClick={() => setStarted(true)}>Start Guided Process →</button>
          </div>
        </div>
      </Reveal>

      {started && (
        <SectionTitle eyebrow="Accident Assistant Agent" title={<>Guided <span className="text-grad">recovery workflow</span></>} />
      )}
      {started && (
        <div className="mt-4">
          {STEPS.map((s, i) => (
            <motion.div key={s.t} className="card-surface p-4 mb-3 d-flex gap-3 align-items-start" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <div style={{ fontSize: "2rem" }}>{s.icon}</div>
              <div><div className="pill mb-1" style={{ fontSize: ".68rem" }}>Step {i + 1}</div><h6 style={{ fontWeight: 700 }} className="mb-1">{s.t}</h6><p className="text-muted-2 mb-0">{s.d}</p></div>
            </motion.div>
          ))}
          <div className="glass p-3">🧠 <b>AI vision (future):</b> Upload damage photos and we'll describe visible impact areas. This is guidance, not a repair estimate — always get an authorized inspection.</div>
        </div>
      )}
    </Page>
  );
}
