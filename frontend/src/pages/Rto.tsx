import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";

const SERVICES = [
  { key: "transfer", icon: "🔁", t: "Ownership Transfer", d: "Same-state buyer/seller transfer" },
  { key: "noc", icon: "🛣", t: "Interstate / NOC", d: "Relocating to another state" },
  { key: "address", icon: "🏠", t: "Address Change", d: "Update address on RC" },
  { key: "duplicate", icon: "📄", t: "Duplicate RC", d: "Lost or damaged RC" },
  { key: "hypothecation_removal", icon: "🏦", t: "Hypothecation Removal", d: "After loan closure" },
];

const CATEGORIES = [
  { t: "RC Services", items: ["New Registration", "Transfer of Ownership", "Duplicate RC", "Address Change", "Hypothecation", "NOC", "RC Renewal"] },
  { t: "Licence Services", items: ["Learner Licence", "Driving Licence", "DL Renewal", "Duplicate DL", "International Permit", "Add Vehicle Class"] },
  { t: "Vehicle Services", items: ["Fitness Certificate", "PUC", "Permit", "Road Tax", "Vehicle Scrapping"] },
];

export default function Rto() {
  const [params] = useSearchParams();
  const [service, setService] = useState<string | null>(params.get("service"));
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const run = async (key: string) => {
    setService(key); setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/rto/workflow", { service: key, answers: {} });
      setResult(data);
    } finally { setBusy(false); }
  };

  return (
    <Page>
      <Reveal><SectionTitle eyebrow="RTO Rules Agent" title={<>RTO <span className="text-grad">Workflow Engine</span></>} sub="Interactive, state-aware workflows — not static instructions. Pick a service to get a personalized checklist." /></Reveal>

      <Reveal delay={0.05}>
        <Link to="/agents">
          <motion.div className="card-surface p-4 mt-3 d-flex flex-wrap align-items-center gap-3" whileHover={{ y: -4 }} style={{ background: "linear-gradient(135deg, rgba(139,92,246,.16), transparent)" }}>
            <div style={{ fontSize: "2rem" }}>🧑‍💼</div>
            <div className="flex-grow-1">
              <h6 style={{ fontWeight: 700 }} className="mb-1">Don't want to do it yourself?</h6>
              <p className="text-muted-2 mb-0" style={{ fontSize: ".9rem" }}>Hire a verified RTO agent to handle it on your behalf — filter by rating, area, charges & speed.</p>
            </div>
            <span className="btn-grad">Browse RTO Agents →</span>
          </motion.div>
        </Link>
      </Reveal>

      <div className="row g-3 mt-1">
        {SERVICES.map((s, i) => (
          <div className="col-md-6 col-lg-4" key={s.key}>
            <Reveal delay={i * 0.05}>
              <motion.div className={`card-surface p-4 h-100 ${service === s.key ? "" : ""}`} whileHover={{ y: -6 }} onClick={() => run(s.key)} style={{ cursor: "pointer", borderColor: service === s.key ? "var(--violet)" : undefined }}>
                <div style={{ fontSize: "2rem" }}>{s.icon}</div>
                <h6 className="mt-2 mb-1" style={{ fontWeight: 700 }}>{s.t}</h6>
                <p className="text-muted-2 mb-0" style={{ fontSize: ".88rem" }}>{s.d}</p>
              </motion.div>
            </Reveal>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {busy && <div className="text-muted-2 mt-4">Generating your personalized workflow…</div>}
        {result && (
          <motion.div className="card-surface p-4 mt-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h4 style={{ fontWeight: 800 }} className="mb-0">{result.title}</h4>
              <div className="d-flex gap-2">
                <span className="pill">⏱ {result.estimated_time}</span>
                <span className="pill">💸 {result.fee_estimate}</span>
              </div>
            </div>
            {result.note && <div className="glass p-3 mb-3" style={{ borderLeft: "3px solid var(--amber)" }}>⚠ {result.note}</div>}

            <div className="row g-4">
              <div className="col-lg-6">
                <h6 style={{ fontWeight: 700 }} className="mb-3">Step-by-step</h6>
                <div className="stepper">
                  {result.steps.map((st: string, i: number) => (
                    <div className="step done" key={i}>
                      <div>
                        <div className="step__dot">{i + 1}</div>
                        {i < result.steps.length - 1 && <div className="step__line" />}
                      </div>
                      <div className="pb-3">{st}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-lg-6">
                <h6 style={{ fontWeight: 700 }} className="mb-2">Forms required</h6>
                <div className="d-flex flex-wrap gap-2 mb-4">{result.forms.map((f: string) => <span key={f} className="pill">📋 {f}</span>)}</div>
                <h6 style={{ fontWeight: 700 }} className="mb-2">Your personalized checklist</h6>
                <div className="d-flex flex-column gap-2">
                  {result.documents.map((d: string) => (
                    <div key={d} className="d-flex align-items-center gap-2 p-2 px-3" style={{ background: "var(--surface-2)", borderRadius: 10 }}>
                      <span style={{ color: "var(--green)" }}>✓</span> {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Reveal delay={0.1}>
        <h5 className="mt-5 mb-3" style={{ fontWeight: 700 }}>All RTO services</h5>
        <div className="row g-4">
          {CATEGORIES.map((c) => (
            <div className="col-md-4" key={c.t}>
              <div className="card-surface p-4 h-100">
                <h6 style={{ fontWeight: 700 }} className="mb-3">{c.t}</h6>
                <div className="d-flex flex-column gap-2">
                  {c.items.map((it) => <div key={it} className="text-muted-2 d-flex align-items-center gap-2"><span className="text-grad">›</span> {it}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </Page>
  );
}
