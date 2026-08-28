import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";

const CONDITIONS = ["Excellent", "Good", "Average", "Needs Repair"];
const PHOTOS = ["Front", "Rear", "Left", "Right", "Interior", "Odometer"];
const TRACKER = [
  { t: "Seller initiated", done: true }, { t: "Buyer documents uploaded", done: true },
  { t: "Documents verified", done: true }, { t: "Application submitted", done: false },
  { t: "RTO processing", done: false }, { t: "RC transferred", done: false },
];
const CHECKLIST = ["Remove FASTag", "Cancel/transfer insurance", "Close loan if applicable", "Collect payment safely", "Complete RC transfer", "Keep proof of delivery"];

export default function Sell() {
  const [condition, setCondition] = useState("Good");
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [valued, setValued] = useState(false);

  const value = { low: 10.2, high: 11.1, listing: 11.25, expected: 10.7, confidence: 82 };

  return (
    <Page>
      <Reveal><SectionTitle eyebrow="Selling Agent" title={<>Sell with <span className="text-grad">confidence</span></>} sub="AI valuation, a selling checklist, and an ownership-transfer tracker so it never stays in your name." /></Reveal>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <div className="card-surface p-4">
            <h6 style={{ fontWeight: 700 }} className="mb-1">1 · Vehicle</h6>
            <div className="d-flex align-items-center gap-2 mb-4"><span style={{ fontSize: "1.8rem" }}>🚗</span><div><b>Hyundai Creta SX(O) Turbo</b><div className="text-muted-2" style={{ fontSize: ".82rem" }}>MH12AB1234 · 48,200 km · loaded automatically</div></div></div>

            <h6 style={{ fontWeight: 700 }} className="mb-2">2 · Overall condition</h6>
            <div className="d-flex gap-2 mb-4 flex-wrap">{CONDITIONS.map((c) => <div key={c} className={`opt ${condition === c ? "sel" : ""}`} onClick={() => setCondition(c)}>{c}</div>)}</div>

            <h6 style={{ fontWeight: 700 }} className="mb-2">3 · Upload photos (AI image analysis)</h6>
            <div className="row g-2 mb-4">
              {PHOTOS.map((p) => (
                <div className="col-4 col-md-2" key={p}>
                  <div className={`opt text-center py-3 ${uploaded.includes(p) ? "sel" : ""}`} style={{ cursor: "pointer" }} onClick={() => setUploaded((u) => u.includes(p) ? u : [...u, p])}>
                    <div style={{ fontSize: "1.4rem" }}>{uploaded.includes(p) ? "✓" : "📷"}</div>
                    <div style={{ fontSize: ".72rem" }}>{p}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-grad" onClick={() => setValued(true)}>✨ Get AI valuation</button>

            <AnimatePresence>
              {valued && (
                <motion.div className="glass p-4 mt-4 text-center" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="text-muted-2">Estimated market range</div>
                  <div className="display text-grad" style={{ fontSize: "2.4rem", fontWeight: 800 }}>₹{value.low}L – ₹{value.high}L</div>
                  <div className="d-flex justify-content-around mt-3">
                    <div><b>₹{value.listing}L</b><div className="text-muted-2" style={{ fontSize: ".72rem" }}>Recommended listing</div></div>
                    <div><b>₹{value.expected}L</b><div className="text-muted-2" style={{ fontSize: ".72rem" }}>Expected sale</div></div>
                    <div><b>{value.confidence}%</b><div className="text-muted-2" style={{ fontSize: ".72rem" }}>Confidence</div></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card-surface p-4">
            <h6 style={{ fontWeight: 700 }} className="mb-3">Selling checklist</h6>
            {CHECKLIST.map((c) => <div key={c} className="d-flex align-items-center gap-2 py-1"><span style={{ color: "var(--green)" }}>✓</span> {c}</div>)}
          </div>

          <div className="card-surface p-4 mt-4" id="tracker">
            <h6 style={{ fontWeight: 700 }} className="mb-3">Ownership transfer tracker</h6>
            <div className="stepper">
              {TRACKER.map((s, i) => (
                <div className={`step ${s.done ? "done" : ""}`} key={s.t}>
                  <div><div className="step__dot">{s.done ? "✓" : i + 1}</div>{i < TRACKER.length - 1 && <div className="step__line" />}</div>
                  <div className="pb-3">{s.t}</div>
                </div>
              ))}
            </div>
            <div className="glass p-3" style={{ borderLeft: "3px solid var(--amber)" }}>⚠ Your vehicle is still registered in your name. We'll keep tracking until transfer completes.</div>
          </div>
        </div>
      </div>
    </Page>
  );
}
