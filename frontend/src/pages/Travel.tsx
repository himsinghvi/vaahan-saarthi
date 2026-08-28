import { useState } from "react";
import { motion } from "framer-motion";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";

const CHECKS = [
  { t: "Insurance valid", icon: "🛡" }, { t: "PUC valid", icon: "🌿" },
  { t: "Tyres & spare", icon: "🛞" }, { t: "Coolant level", icon: "❄️" },
  { t: "FASTag balance", icon: "🏷" }, { t: "Emergency kit", icon: "🧰" },
];

export default function Travel() {
  const [from, setFrom] = useState("Pune");
  const [to, setTo] = useState("Goa");
  const [planned, setPlanned] = useState(true);

  return (
    <Page>
      <Reveal><SectionTitle eyebrow="Travel Agent" title={<>Travel <span className="text-grad">Assistant</span></>} sub="Pre-trip readiness and interstate rule guidance so you drive worry-free." /></Reveal>

      <div className="card-surface p-4 mt-2">
        <div className="row g-2 align-items-end">
          <div className="col-md-5"><label className="text-muted-2 small">From</label><input className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="col-md-5"><label className="text-muted-2 small">To</label><input className="form-control" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div className="col-md-2"><button className="btn-grad w-100" onClick={() => setPlanned(true)}>Plan trip</button></div>
        </div>
      </div>

      {planned && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <div className="glass p-4 mb-4">
            <div className="pill mb-2" style={{ fontSize: ".7rem" }}>🧠 Travel Agent</div>
            <b>{from} → {to}</b> — approx 450 km. Before you leave, complete the readiness checks below. FASTag recommended for the expressway tolls (~₹1,200 round trip).
          </div>
          <h6 style={{ fontWeight: 700 }} className="mb-3">Before-travel checklist</h6>
          <div className="row g-3">
            {CHECKS.map((c, i) => (
              <div className="col-6 col-md-4" key={c.t}>
                <motion.div className="card-surface p-4 d-flex align-items-center gap-3" whileHover={{ y: -4 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <span style={{ fontSize: "1.5rem" }}>{c.icon}</span>
                  <div className="flex-grow-1">{c.t}</div>
                  <span style={{ color: "var(--green)" }}>✓</span>
                </motion.div>
              </div>
            ))}
          </div>
          <div className="glass p-3 mt-4">🛣 <b>Interstate note:</b> For trips under 12 months, no re-registration is required. Carry RC, DL, insurance & PUC (digital via DigiLocker is accepted).</div>
        </motion.div>
      )}
    </Page>
  );
}
