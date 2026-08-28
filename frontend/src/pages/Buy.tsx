import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { api, inr, inrShort } from "../api";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";

const BUDGETS = ["Under ₹10 lakh", "₹10–20 lakh", "₹20–40 lakh", "₹40 lakh+"];
const USAGE = ["Mostly city", "Highway", "Mixed"];
const PRIORITIES = ["Mileage", "Safety", "Performance", "Low maintenance", "Features", "Space", "Resale value"];
const PASSENGERS = ["1–2", "4–5", "6+"];
const FUELS = ["Any", "Petrol", "Diesel", "CNG", "EV"];

export default function Buy() {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState("₹10–20 lakh");
  const [usage, setUsage] = useState("Mostly city");
  const [km, setKm] = useState(1200);
  const [priorities, setPriorities] = useState<string[]>(["Safety", "Mileage"]);
  const [passengers, setPassengers] = useState("4–5");
  const [fuelPref, setFuelPref] = useState("Any");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (p: string) => setPriorities((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);

  const recommend = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/buy/advisor", {
        budget, usage, monthly_km: km, priorities, passengers, fuel_preference: fuelPref,
      });
      setResult(data); setStep(5);
    } finally { setBusy(false); }
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Page>
      <Reveal><SectionTitle eyebrow="Buying Advisor Agent" title={<>Find your <span className="text-grad">perfect vehicle</span></>} sub="Answer a few questions and our AI ranks your best matches with a clear 'why'." /></Reveal>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <div className="card-surface p-4">
            {/* progress */}
            <div className="d-flex gap-2 mb-4">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} style={{ height: 6, flex: 1, borderRadius: 999, background: s <= step ? "var(--grad)" : "rgba(255,255,255,.08)" }} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {step === 0 && (
                  <div>
                    <h5 style={{ fontWeight: 700 }}>What's your budget?</h5>
                    <div className="row g-2 mt-2">
                      {BUDGETS.map((b) => (
                        <div className="col-6" key={b}><div className={`opt ${budget === b ? "sel" : ""}`} onClick={() => setBudget(b)}>{b}</div></div>
                      ))}
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div>
                    <h5 style={{ fontWeight: 700 }}>How much do you drive?</h5>
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {USAGE.map((u) => <div key={u} className={`opt ${usage === u ? "sel" : ""}`} onClick={() => setUsage(u)}>{u}</div>)}
                    </div>
                    <label className="text-muted-2 small mt-4 d-block">Monthly km: <b className="text-grad">{km} km</b></label>
                    <input type="range" min={200} max={4000} step={100} value={km} onChange={(e) => setKm(+e.target.value)} className="form-range" />
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <h5 style={{ fontWeight: 700 }}>What matters most?</h5>
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {PRIORITIES.map((p) => <div key={p} className={`opt ${priorities.includes(p) ? "sel" : ""}`} onClick={() => toggle(p)}>{p}</div>)}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <h5 style={{ fontWeight: 700 }}>Passengers usually?</h5>
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {PASSENGERS.map((p) => <div key={p} className={`opt ${passengers === p ? "sel" : ""}`} onClick={() => setPassengers(p)}>{p}</div>)}
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div>
                    <h5 style={{ fontWeight: 700 }}>Fuel preference?</h5>
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {FUELS.map((f) => <div key={f} className={`opt ${fuelPref === f ? "sel" : ""}`} onClick={() => setFuelPref(f)}>{f}</div>)}
                    </div>
                  </div>
                )}
                {step === 5 && result && (
                  <div>
                    <h5 style={{ fontWeight: 700 }} className="mb-3">Your best matches ✨</h5>
                    {result.matches.map((m: any, i: number) => (
                      <motion.div key={m.name} className="card-surface p-3 mb-3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: "1.6rem" }}>{medals[i]}</span>
                            <span style={{ fontSize: "1.6rem" }}>{m.emoji}</span>
                            <div><div style={{ fontWeight: 700 }}>{m.name}</div><div className="text-muted-2" style={{ fontSize: ".82rem" }}>{m.price_range} · {m.fuel_type}</div></div>
                          </div>
                          <div className="text-end"><div className="text-grad" style={{ fontWeight: 800, fontSize: "1.4rem" }}>{m.match_score}%</div><div className="text-muted-2" style={{ fontSize: ".7rem" }}>match</div></div>
                        </div>
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {m.reasons.map((r: string) => <span key={r} className="pill" style={{ fontSize: ".72rem" }}>✓ {r}</span>)}
                        </div>
                      </motion.div>
                    ))}
                    <div className="glass p-3"><div className="pill mb-2" style={{ fontSize: ".7rem" }}>🧠 AI Verdict</div>{result.verdict}</div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="d-flex justify-content-between mt-4">
              {step > 0 && step < 5 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>← Back</button>}
              {step === 5 && <button className="btn-ghost" onClick={() => setStep(0)}>↺ Start over</button>}
              <div className="ms-auto">
                {step < 4 && <button className="btn-grad" onClick={() => setStep(step + 1)}>Next →</button>}
                {step === 4 && <button className="btn-grad" onClick={recommend} disabled={busy}>{busy ? "Analyzing…" : "✨ Get Recommendations"}</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <FuelCalc />
          <div className="mt-4"><EmiCalc /></div>
          <div className="mt-4"><OnRoadCalc /></div>
        </div>
      </div>
    </Page>
  );
}

function FuelCalc() {
  const [km, setKm] = useState(1200);
  const [res, setRes] = useState<any>(null);
  const run = async () => {
    const { data } = await api.post("/buy/fuel-calc", { monthly_km: km, years: 5 });
    setRes(data);
  };
  const colors: Record<string, string> = { Petrol: "#fb7185", Diesel: "#fbbf24", CNG: "#34d399", EV: "#22d3ee" };
  const chartData = res ? Object.entries(res.projections).map(([k, v]) => ({ name: k, value: v })) : [];
  return (
    <div className="card-surface p-4" id="fuel">
      <div className="pill mb-2" style={{ fontSize: ".72rem" }}>⚡ Petrol vs Diesel vs CNG vs EV</div>
      <h6 style={{ fontWeight: 700 }}>5-year cost projection</h6>
      <label className="text-muted-2 small mt-2 d-block">Monthly km: <b>{km}</b></label>
      <input type="range" min={200} max={4000} step={100} value={km} onChange={(e) => setKm(+e.target.value)} className="form-range" />
      <button className="btn-grad w-100 mt-1" onClick={run}>Calculate</button>
      {res && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#9a9ab5" fontSize={12} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => inrShort(v)} contentStyle={{ background: "#16162a", border: "1px solid #ffffff22", borderRadius: 10 }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((c) => <Cell key={c.name} fill={colors[c.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="glass p-3 mt-2"><b className="text-grad">Recommended: {res.recommended}</b> ({res.confidence}% confidence)<div className="text-muted-2 mt-1" style={{ fontSize: ".85rem" }}>{res.explanation}</div></div>
        </motion.div>
      )}
    </div>
  );
}

function EmiCalc() {
  const [p, setP] = useState(1000000);
  const [rate, setRate] = useState(9.5);
  const [months, setMonths] = useState(60);
  const [res, setRes] = useState<any>(null);
  const run = async () => { const { data } = await api.post("/buy/emi", { principal: p, rate, tenure_months: months }); setRes(data); };
  return (
    <div className="card-surface p-4" id="emi">
      <div className="pill mb-2" style={{ fontSize: ".72rem" }}>💰 EMI Calculator</div>
      <div className="row g-2">
        <div className="col-12"><label className="text-muted-2 small">Loan amount: ₹{inr(p)}</label><input type="range" min={100000} max={5000000} step={50000} value={p} onChange={(e) => setP(+e.target.value)} className="form-range" /></div>
        <div className="col-6"><label className="text-muted-2 small">Rate: {rate}%</label><input type="range" min={7} max={16} step={0.1} value={rate} onChange={(e) => setRate(+e.target.value)} className="form-range" /></div>
        <div className="col-6"><label className="text-muted-2 small">Tenure: {months}mo</label><input type="range" min={12} max={84} step={6} value={months} onChange={(e) => setMonths(+e.target.value)} className="form-range" /></div>
      </div>
      <button className="btn-grad w-100 mt-1" onClick={run}>Calculate EMI</button>
      {res && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="d-flex justify-content-between mt-3 text-center">
          <div><div className="text-grad" style={{ fontWeight: 800, fontSize: "1.4rem" }}>₹{inr(res.emi)}</div><div className="text-muted-2" style={{ fontSize: ".72rem" }}>Monthly EMI</div></div>
          <div><div style={{ fontWeight: 700 }}>₹{inrShort(res.total_interest)}</div><div className="text-muted-2" style={{ fontSize: ".72rem" }}>Interest</div></div>
          <div><div style={{ fontWeight: 700 }}>₹{inrShort(res.total_payable)}</div><div className="text-muted-2" style={{ fontSize: ".72rem" }}>Total</div></div>
        </motion.div>
      )}
    </div>
  );
}

function OnRoadCalc() {
  const [ex, setEx] = useState(1200000);
  const [state, setState] = useState("Maharashtra");
  const [fuel, setFuel] = useState("Petrol");
  const [res, setRes] = useState<any>(null);
  const run = async () => { const { data } = await api.post("/buy/on-road", { ex_showroom: ex, state, fuel_type: fuel }); setRes(data); };
  return (
    <div className="card-surface p-4">
      <div className="pill mb-2" style={{ fontSize: ".72rem" }}>🧾 On-Road Price Calculator</div>
      <label className="text-muted-2 small">Ex-showroom: ₹{inr(ex)}</label>
      <input type="range" min={300000} max={4000000} step={50000} value={ex} onChange={(e) => setEx(+e.target.value)} className="form-range" />
      <div className="row g-2">
        <div className="col-7"><select className="form-select" value={state} onChange={(e) => setState(e.target.value)}>{["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "Telangana"].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="col-5"><select className="form-select" value={fuel} onChange={(e) => setFuel(e.target.value)}>{["Petrol", "Diesel", "EV", "CNG"].map((f) => <option key={f}>{f}</option>)}</select></div>
      </div>
      <button className="btn-grad w-100 mt-2" onClick={run}>Calculate</button>
      {res && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
          {Object.entries(res.breakdown).map(([k, v]) => (
            <div key={k} className="d-flex justify-content-between py-1" style={{ fontSize: ".88rem", borderBottom: "1px solid var(--border)" }}><span className="text-muted-2">{k}</span><span>₹{inr(v as number)}</span></div>
          ))}
          <div className="d-flex justify-content-between mt-2"><b>On-road price</b><b className="text-grad" style={{ fontSize: "1.2rem" }}>₹{inr(res.total)}</b></div>
        </motion.div>
      )}
    </div>
  );
}
