import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { api, type DashboardData } from "../api";
import Page from "../components/Page";
import { Reveal } from "../components/Ui";
import VehicleCarousel from "../components/VehicleCarousel";
import { useAuth } from "../context/AuthContext";

const QUICK = [
  { icon: "🚨", label: "Check Challan", to: "/challans" },
  { icon: "📤", label: "Upload RC", to: "/documents" },
  { icon: "🔧", label: "Book Service", to: "/maintenance" },
  { icon: "🛒", label: "Buy Vehicle", to: "/buy" },
  { icon: "🧑‍💼", label: "Hire RTO Agent", to: "/agents" },
  { icon: "🏛", label: "RTO Services", to: "/rto" },
];

const URGENCY_STYLE: Record<string, { c: string; icon: string }> = {
  critical: { c: "var(--red)", icon: "🚨" },
  upcoming: { c: "var(--amber)", icon: "🔔" },
  info: { c: "var(--cyan)", icon: "ℹ️" },
};

function StatCardInner({ label, icon, value, suffix }: { label: string; icon: string; value: number; suffix: string }) {
  return (
    <>
      <div className="d-flex justify-content-between">
        <span className="text-muted-2">{label}</span>
        <span style={{ fontSize: "1.3rem" }}>{icon}</span>
      </div>
      <div className="display" style={{ fontSize: "2.2rem", fontWeight: 800 }}>
        <CountUp end={value} duration={1.5} />{suffix}
      </div>
    </>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    api.get<DashboardData>("/dashboard")
      .then((r) => { setData(r.data); setLoadErr(""); })
      .catch(() => setLoadErr("Could not load dashboard — start the backend on port 8020, then refresh."));
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  if (loadErr)
    return (
      <Page>
        <div className="card-surface p-4 text-center">
          <p className="text-muted-2 mb-3">{loadErr}</p>
          <button type="button" className="btn-grad" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </Page>
    );

  if (!data)
    return <Page><div className="text-center py-5 text-muted-2">Loading your garage…</div></Page>;

  return (
    <Page>
      <Reveal>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
          <div>
            <h1 className="display" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800 }}>
              {greet}, {user?.name || data.user.name} 👋
            </h1>
            <p className="text-muted-2 mb-0" style={{ fontSize: "1.05rem" }}>
              Your vehicles are healthy. You have{" "}
              <span className="text-grad" style={{ fontWeight: 700 }}>{data.stats.actions} actions</span> this month.
            </p>
          </div>
          <Link to="/garage" className="btn-grad">+ Add Vehicle</Link>
        </div>
      </Reveal>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {[
          { k: "Vehicles", v: data.stats.vehicles, icon: "🚗", to: "/garage" },
          { k: "Actions needed", v: data.stats.actions, icon: "⚠️", scrollTo: "action-required" },
          { k: "Pending challans", v: data.stats.pending_challans, icon: "🚨", to: "/challans" },
          { k: "Documents", v: data.stats.documents, icon: "🗂", to: "/documents" },
        ].map((s, i) => (
          <div className="col-6 col-lg-3" key={s.k}>
            <Reveal delay={i * 0.06}>
              {s.scrollTo ? (
                <button
                  type="button"
                  className="stat-card card-surface p-4 w-100 text-start"
                  onClick={() => document.getElementById(s.scrollTo!)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  <StatCardInner label={s.k} icon={s.icon} value={s.v} suffix="" />
                </button>
              ) : (
                <Link to={s.to!} className="stat-card-link">
                  <div className="card-surface p-4 h-100">
                    <StatCardInner label={s.k} icon={s.icon} value={s.v} suffix="" />
                  </div>
                </Link>
              )}
            </Reveal>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <Reveal>
            <VehicleCarousel vehicles={data.vehicles} />
          </Reveal>
        </div>

        {/* Action required */}
        <div className="col-lg-4" id="action-required">
          <Reveal delay={0.1}>
            <div className="card-surface p-4 h-100">
              <h5 style={{ fontWeight: 700 }} className="mb-3">Action Required</h5>
              <div className="d-flex flex-column gap-3">
                {data.reminders.map((r) => {
                  const u = URGENCY_STYLE[r.urgency];
                  return (
                    <div key={r.id} className="d-flex align-items-start gap-2 p-3" style={{ background: "var(--surface-2)", borderRadius: 14, borderLeft: `3px solid ${u.c}` }}>
                      <span>{u.icon}</span>
                      <div className="flex-grow-1">
                        <div style={{ fontSize: ".92rem", fontWeight: 600 }}>{r.title}</div>
                        <div className="text-muted-2" style={{ fontSize: ".78rem" }}>Due {r.due_date}</div>
                      </div>
                      <Link to="/documents" className="chip" style={{ fontSize: ".72rem" }}>View</Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Quick actions */}
      <Reveal delay={0.1}>
        <h5 className="mt-5 mb-3" style={{ fontWeight: 700 }}>Quick Actions</h5>
        <div className="row g-3">
          {QUICK.map((q, i) => (
            <div className="col-4 col-md-2" key={q.label}>
              <Link to={q.to}>
                <motion.div className="card-surface p-3 text-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <div style={{ fontSize: "1.7rem" }}>{q.icon}</div>
                  <div style={{ fontSize: ".8rem", marginTop: 6 }}>{q.label}</div>
                </motion.div>
              </Link>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Timeline */}
      <Reveal delay={0.1}>
        <h5 className="mt-5 mb-3" style={{ fontWeight: 700 }}>Vehicle Timeline</h5>
        <div className="card-surface p-4">
          {data.timeline.map((t, i) => (
            <div key={t.id} className="d-flex align-items-center gap-3 py-2" style={{ borderBottom: i < data.timeline.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: "1.3rem", width: 36, textAlign: "center" }}>{t.icon}</div>
              <div className="flex-grow-1">{t.title}</div>
              <div className="text-muted-2" style={{ fontSize: ".85rem" }}>{t.date}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </Page>
  );
}
