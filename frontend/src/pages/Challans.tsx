import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type Challan, type Vehicle, inr } from "../api";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";
import ChatMessageBody from "../components/ChatMessageBody";
import { buildDisputeGuidance, type DisputeGuide } from "../lib/challanDispute";

export default function Challans() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [explain, setExplain] = useState<string | null>(null);
  const [dispute, setDispute] = useState<DisputeGuide | null>(null);

  const load = () => api.get<Challan[]>("/challans").then((r) => setChallans(r.data));
  useEffect(() => {
    load();
    api.get<Vehicle[]>("/vehicles").then((r) => setVehicles(r.data));
  }, []);

  const vname = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.make} ${v.model} (${v.registration_number})` : id;
  };

  const pay = async (id: string) => {
    await api.post(`/challans/${id}/pay`);
    await load();
  };

  const openDispute = (c: Challan) => {
    setExplain(null);
    setDispute(buildDisputeGuidance(c, vname(c.vehicle_id)));
  };

  const pending = challans.filter((c) => c.status === "pending");
  const total = pending.reduce((a, c) => a + c.amount, 0);

  return (
    <Page>
      <Reveal><SectionTitle eyebrow="Compliance Agent" title={<>Challan <span className="text-grad">Center</span></>} sub="Understand every violation in plain language — with pay and dispute guidance." /></Reveal>

      <div className="row g-3 mt-1 mb-4">
        <div className="col-md-4"><div className="card-surface p-4"><div className="text-muted-2">Pending challans</div><div className="display" style={{ fontSize: "2.4rem", fontWeight: 800 }}>{pending.length}</div></div></div>
        <div className="col-md-4"><div className="card-surface p-4"><div className="text-muted-2">Total due</div><div className="display text-grad" style={{ fontSize: "2.4rem", fontWeight: 800 }}>₹{inr(total)}</div></div></div>
        <div className="col-md-4"><div className="card-surface p-4"><div className="text-muted-2">Paid this year</div><div className="display" style={{ fontSize: "2.4rem", fontWeight: 800 }}>{challans.filter((c) => c.status === "paid").length}</div></div></div>
      </div>

      <div className="row g-3">
        {challans.map((c, i) => (
          <div className="col-lg-6" key={c.id}>
            <Reveal delay={i * 0.05}>
              <div className="card-surface p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: "1.4rem" }}>🚨</span>
                      <b>{c.offence}</b>
                    </div>
                    <div className="text-muted-2 mt-1" style={{ fontSize: ".85rem" }}>{vname(c.vehicle_id)}</div>
                    <div className="text-muted-2" style={{ fontSize: ".82rem" }}>📍 {c.location} · {c.date}</div>
                  </div>
                  <div className="text-end">
                    <div className="text-grad" style={{ fontWeight: 800, fontSize: "1.3rem" }}>₹{inr(c.amount)}</div>
                    <span className={`badge-status ${c.status === "paid" ? "badge-valid" : "badge-expiring"}`}>{c.status}</span>
                  </div>
                </div>
                {c.status === "pending" && (
                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    <button type="button" className="chip" onClick={() => { setDispute(null); setExplain(explain === c.id ? null : c.id); }}>🧠 Understand with AI</button>
                    <button type="button" className="btn-grad" style={{ padding: "8px 18px", fontSize: ".85rem" }} onClick={() => pay(c.id)}>💳 Pay now</button>
                    <button type="button" className="chip" onClick={() => openDispute(c)}>⚖️ Dispute guidance</button>
                  </div>
                )}
                {explain === c.id && (
                  <motion.div className="glass p-3 mt-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <div className="pill mb-2" style={{ fontSize: ".7rem" }}>🧠 Compliance Agent</div>
                    <div style={{ fontSize: ".9rem" }}>
                      <b>Violation:</b> {c.offence}.<br />
                      <b>Rule:</b> Motor Vehicles Act — the recorded speed/act exceeded the permitted limit for this zone.<br />
                      <b>Penalty:</b> ₹{inr(c.amount)}, payable within 60 days.<br />
                      <b>Consequence if unpaid:</b> May escalate to a virtual traffic court case and block RC/insurance renewal.<br />
                      <b>Dispute path:</b> If the evidence is incorrect, you can contest via the state e-challan portal within the notice window.
                    </div>
                  </motion.div>
                )}
              </div>
            </Reveal>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {dispute && (
          <motion.div
            className="doc-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDispute(null)}
          >
            <motion.div
              className="glass doc-modal"
              initial={{ scale: 0.94, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                  <div className="pill mb-2" style={{ fontSize: ".7rem" }}>⚖️ Dispute guidance</div>
                  <h5 style={{ fontWeight: 800, marginBottom: 0 }}>{dispute.title}</h5>
                </div>
                <button type="button" className="btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setDispute(null)}>✕</button>
              </div>

              <div style={{ fontSize: ".9rem" }}>
                <ChatMessageBody text={dispute.body} />
              </div>

              <h6 className="mt-3 mb-2" style={{ fontWeight: 700 }}>Step-by-step</h6>
              <ol className="chat-md__ol mb-0" style={{ fontSize: ".88rem" }}>
                {dispute.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>

              <div className="d-flex gap-2 mt-4 flex-wrap">
                <a href={dispute.portal} target="_blank" rel="noreferrer" className="btn-grad">Open e-Challan portal ↗</a>
                <button type="button" className="btn-ghost" onClick={() => setDispute(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
