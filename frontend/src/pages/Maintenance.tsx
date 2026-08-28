import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { api, type Expense, type Vehicle, inr, inrShort } from "../api";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";
import { useAssistant } from "../context/AssistantContext";

const CATS = ["Fuel", "Service", "Tyres", "Insurance", "Parking", "Toll", "Charging"];
const COLORS = ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#38bdf8"];
const HEALTH = ["Oil", "Battery", "Tyres", "Brakes", "Air Filter", "AC", "Coolant", "Suspension", "Clutch", "Wipers"];

export default function Maintenance() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vid, setVid] = useState<string>("");
  const { setVehicleId } = useAssistant();
  const [data, setData] = useState<{ expenses: Expense[]; by_type: Record<string, number>; total: number } | null>(null);
  const [form, setForm] = useState({ type: "Fuel", amount: 2000, note: "" });

  useEffect(() => { api.get<Vehicle[]>("/vehicles").then((r) => { setVehicles(r.data); setVid(r.data[0]?.id || ""); }); }, []);
  const load = (v: string) => api.get(`/expenses`, { params: { vehicle_id: v } }).then((r) => setData(r.data));
  useEffect(() => { if (vid) load(vid); }, [vid]);
  useEffect(() => { if (vid) setVehicleId(vid); }, [vid, setVehicleId]);

  const add = async () => {
    await api.post("/expenses", { id: "", vehicle_id: vid, type: form.type, amount: form.amount, date: "2026-08-28", note: form.note });
    setForm({ ...form, note: "" }); load(vid);
  };

  const pie = data ? Object.entries(data.by_type).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] })) : [];
  const largest = pie.sort((a, b) => b.value - a.value)[0];

  return (
    <Page>
      <Reveal>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
          <SectionTitle eyebrow="Maintenance Agent" title={<>Maintenance & <span className="text-grad">Total Cost</span></>} sub="Predictive service reminders and a financial tracker for your vehicle." />
          <select className="form-select" style={{ maxWidth: 260 }} value={vid} onChange={(e) => setVid(e.target.value)}>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.emoji} {v.make} {v.model}</option>)}
          </select>
        </div>
      </Reveal>

      <div className="row g-3 mt-1 mb-4">
        {[
          { t: "Next service", v: "in 28 days", icon: "🔧" },
          { t: "Last service", v: "12 Aug 2026", icon: "✅" },
          { t: "Next expected cost", v: "₹8k–₹12k", icon: "💰" },
          { t: "Total tracked", v: data ? inrShort(data.total) : "—", icon: "📊" },
        ].map((s, i) => (
          <div className="col-6 col-md-3" key={s.t}><Reveal delay={i * 0.05}><div className="card-surface p-4"><div className="d-flex justify-content-between"><span className="text-muted-2" style={{ fontSize: ".82rem" }}>{s.t}</span><span>{s.icon}</span></div><div style={{ fontWeight: 700, fontSize: "1.25rem" }}>{s.v}</div></div></Reveal></div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card-surface p-4">
            <h6 style={{ fontWeight: 700 }} className="mb-3">Expense breakdown</h6>
            {pie.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => inrShort(v)} contentStyle={{ background: "#16162a", border: "1px solid #ffffff22", borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {largest && <div className="glass p-3 mt-2"><b className="text-grad">Largest expense:</b> {largest.name} ({Math.round((largest.value / (data?.total || 1)) * 100)}%)<div className="text-muted-2 mt-1" style={{ fontSize: ".85rem" }}>🧠 Your maintenance spend is trending — log entries to get predictions.</div></div>}
          </div>

          <div className="card-surface p-4 mt-4">
            <h6 style={{ fontWeight: 700 }} className="mb-2">Add expense</h6>
            <div className="row g-2">
              <div className="col-5"><select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="col-7"><input className="form-control" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} placeholder="Amount" /></div>
              <div className="col-12"><input className="form-control" placeholder="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
              <div className="col-12"><button className="btn-grad w-100" onClick={add}>+ Add expense</button></div>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card-surface p-4">
            <h6 style={{ fontWeight: 700 }} className="mb-3">Recent expenses</h6>
            {data?.expenses.map((e, i) => (
              <motion.div key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="d-flex align-items-center gap-2"><span className="pill" style={{ fontSize: ".7rem" }}>{e.type}</span><span className="text-muted-2" style={{ fontSize: ".85rem" }}>{e.note || "—"}</span></div>
                <div className="text-end"><b>₹{inr(e.amount)}</b><div className="text-muted-2" style={{ fontSize: ".72rem" }}>{e.date}</div></div>
              </motion.div>
            ))}
          </div>

          <div className="card-surface p-4 mt-4" id="book">
            <h6 style={{ fontWeight: 700 }} className="mb-3">Vehicle health check</h6>
            <div className="d-flex flex-wrap gap-2">
              {HEALTH.map((h) => <span key={h} className="pill" style={{ fontSize: ".78rem" }}>🔧 {h}</span>)}
            </div>
            <div className="glass p-3 mt-3">🧠 <b>Predictive:</b> Based on age & mileage, brake pad inspection recommended within ~2,000 km.</div>
            <button className="btn-grad mt-3">📅 Book a service</button>
          </div>
        </div>
      </div>
    </Page>
  );
}
