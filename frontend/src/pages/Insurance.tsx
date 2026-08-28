import { useState } from "react";
import { motion } from "framer-motion";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";

const COVERAGE = [
  { t: "Third Party", on: true }, { t: "Own Damage", on: true },
  { t: "Zero Depreciation", on: true }, { t: "Roadside Assistance", on: true },
  { t: "Engine Protect", on: false }, { t: "Consumables Cover", on: false },
];

const QUOTES = [
  { insurer: "ICICI Lombard", premium: 28900, idv: "₹12.1L", addons: "Zero Dep + RSA", best: true },
  { insurer: "HDFC Ergo", premium: 26400, idv: "₹11.6L", addons: "Zero Dep", best: false },
  { insurer: "Digit", premium: 24800, idv: "₹11.2L", addons: "Basic", best: false },
];

export default function Insurance() {
  const [analyzed, setAnalyzed] = useState(false);
  return (
    <Page>
      <Reveal><SectionTitle eyebrow="Insurance Agent" title={<>Insurance <span className="text-grad">AI</span></>} sub="Understand your coverage in plain language and compare renewal quotes side by side." /></Reveal>

      <div className="row g-4 mt-1">
        <div className="col-lg-5">
          <div className="card-surface p-4">
            <h6 style={{ fontWeight: 700 }} className="mb-3">Current coverage</h6>
            {COVERAGE.map((c) => (
              <div key={c.t} className="d-flex justify-content-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <span>{c.t}</span>
                <span style={{ color: c.on ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{c.on ? "✓ Covered" : "✗ Not covered"}</span>
              </div>
            ))}
          </div>

          <div className="card-surface p-4 mt-4" id="analyze">
            <h6 style={{ fontWeight: 700 }}>AI Policy Analyzer</h6>
            <p className="text-muted-2" style={{ fontSize: ".88rem" }}>Upload a policy PDF and ask "what does my insurance cover?"</p>
            <button className="btn-grad" onClick={() => setAnalyzed(true)}>🔍 Analyze my policy</button>
            {analyzed && (
              <motion.div className="glass p-3 mt-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="pill mb-2" style={{ fontSize: ".7rem" }}>🧠 Insurance Agent</div>
                <div style={{ fontSize: ".9rem" }}>
                  ✓ Accidental damage<br />✓ Third-party liability<br />✓ Flood/natural calamity<br />
                  ✗ Tyre wear & tear<br />✗ General mechanical failure<br /><br />
                  <b>Recommendation:</b> Engine protection may be useful given monsoon waterlogging in Pune.
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="col-lg-7">
          <h6 style={{ fontWeight: 700 }} className="mb-3">Renewal quotes</h6>
          <div className="row g-3">
            {QUOTES.map((q, i) => (
              <div className="col-md-4" key={q.insurer}>
                <Reveal delay={i * 0.06}>
                  <motion.div className="card-surface p-4 h-100" whileHover={{ y: -6 }} style={{ borderColor: q.best ? "var(--violet)" : undefined }}>
                    {q.best && <div className="pill mb-2" style={{ fontSize: ".68rem", background: "var(--grad)", color: "#fff", border: "none" }}>⭐ Best value</div>}
                    <h6 style={{ fontWeight: 700 }}>{q.insurer}</h6>
                    <div className="text-grad" style={{ fontSize: "1.8rem", fontWeight: 800 }}>₹{q.premium.toLocaleString("en-IN")}</div>
                    <div className="text-muted-2" style={{ fontSize: ".82rem" }}>/ year</div>
                    <div className="mt-2" style={{ fontSize: ".85rem" }}>IDV: {q.idv}</div>
                    <div className="text-muted-2" style={{ fontSize: ".82rem" }}>{q.addons}</div>
                    <button className="btn-ghost w-100 mt-3" style={{ padding: "8px" }}>Select</button>
                  </motion.div>
                </Reveal>
              </div>
            ))}
          </div>
          <div className="glass p-3 mt-3">🧠 No Claim Bonus: <b className="text-grad">35%</b> — renewing 15 days early keeps your NCB intact.</div>
        </div>
      </div>
    </Page>
  );
}
