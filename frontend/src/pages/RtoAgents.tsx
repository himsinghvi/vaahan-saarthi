import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, inr } from "../api";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";

interface Agent {
  id: string; name: string; photo: string; area: string; city: string;
  services: string[]; rating: number; reviews: number; tasks_completed: number;
  charges_from: number; response_time_hours: number; turnaround_days: number;
  rto_authorized: boolean; verified: boolean; years_experience: number;
  languages: string[]; online: boolean; tagline: string;
}

const SORTS = [
  ["rating", "⭐ Top rated"], ["reviews", "💬 Most reviews"], ["charges", "💰 Lowest charges"],
  ["response", "⚡ Fastest reply"], ["turnaround", "🏁 Fastest work"], ["tasks", "✅ Most tasks"],
  ["experience", "🎖 Most experienced"],
];

function Stars({ r }: { r: number }) {
  return (
    <span style={{ color: "var(--amber)", letterSpacing: 1 }}>
      {"★".repeat(Math.round(r))}<span style={{ color: "rgba(255,255,255,.15)" }}>{"★".repeat(5 - Math.round(r))}</span>
    </span>
  );
}

export default function RtoAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [hired, setHired] = useState<Agent | null>(null);

  const [area, setArea] = useState("");
  const [service, setService] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [maxCharges, setMaxCharges] = useState<number | "">("");
  const [maxResponse, setMaxResponse] = useState<number | "">("");
  const [authorizedOnly, setAuthorizedOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("rating");

  const load = async () => {
    const params: any = { sort };
    if (area) params.area = area;
    if (service) params.service = service;
    if (minRating) params.min_rating = minRating;
    if (maxCharges !== "") params.max_charges = maxCharges;
    if (maxResponse !== "") params.max_response_hours = maxResponse;
    if (authorizedOnly) params.authorized_only = true;
    if (onlineOnly) params.online_only = true;
    if (query) params.query = query;
    const { data } = await api.get("/rto-agents", { params });
    setAgents(data.agents); setAreas(data.areas); setServices(data.services);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [area, service, minRating, maxCharges, maxResponse, authorizedOnly, onlineOnly, sort]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [query]);

  const reset = () => {
    setArea(""); setService(""); setMinRating(0); setMaxCharges(""); setMaxResponse("");
    setAuthorizedOnly(false); setOnlineOnly(false); setQuery(""); setSort("rating");
  };

  return (
    <Page>
      <Reveal><SectionTitle eyebrow="RTO Agent Marketplace" title={<>Hire a verified <span className="text-grad">RTO agent</span></>} sub="Find trusted agents who handle RTO tasks on your behalf — filter by rating, area, service, charges, speed and more." /></Reveal>

      <div className="row g-4 mt-1">
        {/* Filters sidebar */}
        <div className="col-lg-3">
          <div className="card-surface p-4" style={{ position: "sticky", top: 90 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 style={{ fontWeight: 700 }} className="mb-0">Filters</h6>
              <button className="chip" style={{ fontSize: ".72rem" }} onClick={reset}>Reset</button>
            </div>

            <label className="text-muted-2 small">Search</label>
            <input className="form-control mb-3" placeholder="Name, area, service…" value={query} onChange={(e) => setQuery(e.target.value)} />

            <label className="text-muted-2 small">Area / City</label>
            <select className="form-select mb-3" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">All cities</option>
              {areas.map((a) => <option key={a}>{a}</option>)}
            </select>

            <label className="text-muted-2 small">Service</label>
            <select className="form-select mb-3" value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">All services</option>
              {services.map((s) => <option key={s}>{s}</option>)}
            </select>

            <label className="text-muted-2 small">Minimum rating: <b>{minRating || "any"}</b></label>
            <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(+e.target.value)} className="form-range mb-3" />

            <label className="text-muted-2 small">Max charges (₹)</label>
            <input className="form-control mb-3" type="number" placeholder="e.g. 1000" value={maxCharges} onChange={(e) => setMaxCharges(e.target.value === "" ? "" : +e.target.value)} />

            <label className="text-muted-2 small">Max reply time (hrs)</label>
            <input className="form-control mb-3" type="number" placeholder="e.g. 3" value={maxResponse} onChange={(e) => setMaxResponse(e.target.value === "" ? "" : +e.target.value)} />

            <div className="form-check mb-2">
              <input className="form-check-input" type="checkbox" id="auth" checked={authorizedOnly} onChange={(e) => setAuthorizedOnly(e.target.checked)} />
              <label className="form-check-label" htmlFor="auth">✅ RTO Authorized only</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="online" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} />
              <label className="form-check-label" htmlFor="online">🟢 Online now</label>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="col-lg-9">
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <span className="text-muted-2">{agents.length} agents</span>
            <div className="d-flex gap-2 flex-wrap ms-auto">
              {SORTS.map(([k, l]) => (
                <button key={k} className={`chip ${sort === k ? "sel" : ""}`} style={sort === k ? { borderColor: "var(--violet)", background: "rgba(139,92,246,.14)" } : {}} onClick={() => setSort(k)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="row g-3">
            <AnimatePresence>
              {agents.map((a, i) => (
                <motion.div className="col-md-6" key={a.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                  <div className="card-surface p-4 h-100">
                    <div className="d-flex gap-3">
                      <div style={{ fontSize: "2.6rem", position: "relative" }}>
                        {a.photo}
                        {a.online && <span style={{ position: "absolute", right: 0, bottom: 4, width: 12, height: 12, borderRadius: 8, background: "var(--green)", border: "2px solid var(--surface)" }} />}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <b>{a.name}</b>
                          {a.rto_authorized && <span className="badge-status badge-valid" style={{ fontSize: ".62rem" }}>RTO ✓</span>}
                          {a.verified && <span className="pill" style={{ fontSize: ".6rem" }}>Verified</span>}
                        </div>
                        <div className="text-muted-2" style={{ fontSize: ".8rem" }}>📍 {a.area}, {a.city} · {a.years_experience} yrs exp</div>
                        <div className="d-flex align-items-center gap-2 mt-1" style={{ fontSize: ".85rem" }}>
                          <Stars r={a.rating} /> <b>{a.rating}</b> <span className="text-muted-2">({a.reviews} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-2 mt-2 mb-2" style={{ fontSize: ".85rem" }}>{a.tagline}</p>

                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {a.services.slice(0, 4).map((s) => <span key={s} className="pill" style={{ fontSize: ".66rem" }}>{s}</span>)}
                      {a.services.length > 4 && <span className="pill" style={{ fontSize: ".66rem" }}>+{a.services.length - 4}</span>}
                    </div>

                    <div className="row g-2 text-center" style={{ fontSize: ".78rem" }}>
                      <div className="col-3"><div className="text-grad" style={{ fontWeight: 800 }}>₹{inr(a.charges_from)}</div><div className="text-muted-2">from</div></div>
                      <div className="col-3"><div style={{ fontWeight: 700 }}>{a.response_time_hours}h</div><div className="text-muted-2">reply</div></div>
                      <div className="col-3"><div style={{ fontWeight: 700 }}>{a.turnaround_days}d</div><div className="text-muted-2">work</div></div>
                      <div className="col-3"><div style={{ fontWeight: 700 }}>{a.tasks_completed}</div><div className="text-muted-2">tasks</div></div>
                    </div>

                    <div className="d-flex gap-2 mt-3">
                      <button className="btn-grad flex-grow-1" style={{ padding: "9px" }} onClick={() => setHired(a)}>Hire agent</button>
                      <button className="chip">💬 Chat</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {agents.length === 0 && <div className="col-12 text-center text-muted-2 py-5">No agents match your filters. Try relaxing them.</div>}
          </div>
        </div>
      </div>

      {/* Hire modal */}
      <AnimatePresence>
        {hired && (
          <motion.div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.6)", display: "grid", placeItems: "center", padding: 20 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHired(null)}>
            <motion.div className="glass p-4" style={{ maxWidth: 460, width: "100%" }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div style={{ fontSize: "3rem" }}>{hired.photo}</div>
                <h4 style={{ fontWeight: 800 }} className="mb-1">{hired.name}</h4>
                <div className="text-muted-2">{hired.area}, {hired.city}</div>
                <div className="mt-2"><Stars r={hired.rating} /> <b>{hired.rating}</b> <span className="text-muted-2">({hired.reviews})</span></div>
              </div>
              <div className="glass p-3 mt-3" style={{ fontSize: ".9rem" }}>
                🧠 We'll share your selected vehicle & task with <b>{hired.name}</b>. They typically reply within <b>{hired.response_time_hours} hours</b> and complete work in about <b>{hired.turnaround_days} days</b>. Starting charges <b className="text-grad">₹{inr(hired.charges_from)}</b>.
              </div>
              <div className="d-flex flex-wrap gap-1 mt-3">
                {hired.languages.map((l) => <span key={l} className="pill" style={{ fontSize: ".7rem" }}>🗣 {l}</span>)}
              </div>
              <div className="d-flex gap-2 mt-4">
                <button className="btn-grad flex-grow-1" onClick={() => setHired(null)}>✓ Send request</button>
                <button className="btn-ghost" onClick={() => setHired(null)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
