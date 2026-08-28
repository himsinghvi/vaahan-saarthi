import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, type Vehicle, type DocumentT, type Challan, type Expense, type TimelineEvent, inr, inrShort } from "../api";
import Page from "../components/Page";
import ConfirmDelete from "../components/ConfirmDelete";
import VehicleForm, { buildIdentifiedMap, formToPayload, vehicleToForm, type VehicleFormData } from "../components/VehicleForm";
import { ScoreRing, StatusBadge, Reveal } from "../components/Ui";
import { useAssistant } from "../context/AssistantContext";

interface Detail {
  vehicle: Vehicle; documents: DocumentT[]; challans: Challan[];
  expenses: Expense[]; timeline: TimelineEvent[];
}

const TABS = ["Overview", "Compliance", "Documents", "Financial", "Timeline"];

export default function VehicleProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { openAssistant } = useAssistant();
  const [d, setD] = useState<Detail | null>(null);
  const [tab, setTab] = useState("Overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<VehicleFormData | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = () => api.get<Detail>(`/vehicles/${id}`).then((r) => setD(r.data));
  useEffect(() => { reload(); }, [id]);

  const openEdit = () => {
    if (!d) return;
    setEditForm(vehicleToForm(d.vehicle));
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!id || !editForm) return;
    setSaving(true);
    try {
      const { data } = await api.patch<Vehicle>(`/vehicles/${id}`, formToPayload(editForm));
      setD((prev) => prev ? { ...prev, vehicle: data } : prev);
      setEditing(false);
      setEditForm(null);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const removeVehicle = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.delete(`/vehicles/${id}`);
      nav("/garage", { replace: true });
    } finally {
      setDeleting(false);
    }
  };

  if (!d) return <Page><div className="text-center py-5 text-muted-2">Loading vehicle…</div></Page>;
  const v = d.vehicle;
  const spent = d.expenses.reduce((a, e) => a + e.amount, 0);
  const loanOutstanding = v.hypothecation ? Math.round(v.purchase_price * 0.35) : 0;

  return (
    <Page>
      <Reveal>
        <Link to="/garage" className="text-muted-2 link-underline">← Back to Garage</Link>
        <div className="card-surface p-4 mt-3" style={{ background: `linear-gradient(135deg, ${v.color_hex}26, transparent)` }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <motion.div style={{ fontSize: "3.4rem" }} animate={{ rotate: [0, -6, 6, 0] }} transition={{ repeat: Infinity, duration: 5 }}>{v.emoji}</motion.div>
              <div>
                <h2 style={{ fontWeight: 800, marginBottom: 2 }}>{v.make} {v.model}</h2>
                <div className="text-muted-2">{v.variant} · {v.registration_number} · {v.rto}</div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <span className="pill" style={{ fontSize: ".72rem" }}>{v.fuel_type}</span>
                  <span className="pill" style={{ fontSize: ".72rem" }}>{v.odometer_km.toLocaleString()} km</span>
                  <span className="pill" style={{ fontSize: ".72rem" }}>Owner: {v.owner_name}</span>
                </div>
              </div>
            </div>
            <div className="d-flex gap-4 align-items-center flex-wrap">
              <div className="d-flex gap-4">
                <div className="text-center"><ScoreRing value={v.health_score} size={96} label="Health" /></div>
                <div className="text-center"><ScoreRing value={v.compliance_score} size={96} label="Compliance" /></div>
              </div>
              <button type="button" className="btn-ghost btn-ghost--sm" onClick={openEdit}>✏️ Edit</button>
              <button type="button" className="btn-ghost btn-danger-outline btn-ghost--sm" onClick={() => setConfirmDelete(true)}>🗑 Remove vehicle</button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Tabs */}
      <div className="d-flex gap-2 mt-4 mb-4 flex-wrap no-scrollbar" style={{ overflowX: "auto" }}>
        {TABS.map((t) => (
          <button key={t} className={`chip ${tab === t ? "sel" : ""}`} style={tab === t ? { borderColor: "var(--violet)", background: "rgba(139,92,246,.14)" } : {}} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          {tab === "Overview" && (
            <div className="row g-3">
              {[
                ["Vehicle age", `${2026 - new Date(v.registration_date).getFullYear()} years`],
                ["Ownership", `${2026 - new Date(v.registration_date).getFullYear()} years`],
                ["Purchase price", inrShort(v.purchase_price)],
                ["Current est. value", inrShort(v.current_value)],
                ["Fuel type", v.fuel_type],
                ["State / RTO", `${v.state} · ${v.rto}`],
              ].map(([k, val]) => (
                <div className="col-6 col-md-4" key={k}>
                  <div className="card-surface p-4"><div className="text-muted-2" style={{ fontSize: ".82rem" }}>{k}</div><div style={{ fontWeight: 700, fontSize: "1.25rem" }}>{val}</div></div>
                </div>
              ))}
              <div className="col-12">
                <div className="card-surface p-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
                  <div><h5 style={{ fontWeight: 700 }} className="mb-1">Ask AI about this vehicle</h5><p className="text-muted-2 mb-0">Get contextual guidance grounded in this vehicle's real data.</p></div>
                  <div className="d-flex gap-2 flex-wrap">
                    <Link to="/sell" className="btn-ghost">💸 Sell</Link>
                    <Link to="/rto" className="btn-ghost">🏛 RTO</Link>
                    <button type="button" className="btn-grad" onClick={() => openAssistant(id)}>✨ Open Assistant</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "Compliance" && (
            <div className="row g-3">
              {Object.entries(v.compliance).map(([k, val]) => (
                <div className="col-6 col-md-4" key={k}>
                  <div className="card-surface p-4 d-flex justify-content-between align-items-center">
                    <span style={{ textTransform: "uppercase", fontSize: ".82rem", fontWeight: 700 }}>{k}</span>
                    <StatusBadge status={val} />
                  </div>
                </div>
              ))}
              <div className="col-12">
                <div className="card-surface p-4">
                  <h6 style={{ fontWeight: 700 }}>Compliance breakdown — {v.compliance_score}/100</h6>
                  <div className="cbar my-2" style={{ height: 12 }}><motion.div initial={{ width: 0 }} animate={{ width: `${v.compliance_score}%` }} transition={{ duration: 1.2 }} /></div>
                  {v.compliance.puc === "expiring" && <div className="text-muted-2">− 8 · PUC expires soon</div>}
                  {v.compliance.insurance === "expiring" && <div className="text-muted-2">− 6 · Insurance expires soon</div>}
                </div>
              </div>
            </div>
          )}

          {tab === "Documents" && (
            <div className="row g-3">
              {d.documents.length === 0 && <div className="text-muted-2">No documents yet. Upload from the Document Vault.</div>}
              {d.documents.map((doc) => (
                <div className="col-md-6 col-lg-4" key={doc.id}>
                  <div className="card-surface p-4 h-100">
                    <div className="d-flex justify-content-between"><span className="pill" style={{ fontSize: ".7rem" }}>{doc.type}</span><StatusBadge status={doc.status} /></div>
                    <h6 className="mt-3 mb-1" style={{ fontWeight: 700 }}>{doc.title}</h6>
                    {doc.expiry_date && <div className="text-muted-2" style={{ fontSize: ".82rem" }}>Expires {doc.expiry_date}</div>}
                  </div>
                </div>
              ))}
              <div className="col-12"><Link to="/documents" className="btn-ghost">Open Document Vault →</Link></div>
            </div>
          )}

          {tab === "Financial" && (
            <div className="row g-3">
              {[
                ["Purchase price", inr(v.purchase_price)],
                ["Loan outstanding", loanOutstanding ? inr(loanOutstanding) : "None"],
                ["Total spent (tracked)", inr(spent)],
                ["Current resale value", inr(v.current_value)],
              ].map(([k, val]) => (
                <div className="col-6 col-md-3" key={k}><div className="card-surface p-4"><div className="text-muted-2" style={{ fontSize: ".8rem" }}>{k}</div><div style={{ fontWeight: 700, fontSize: "1.15rem" }}>₹{val}</div></div></div>
              ))}
              <div className="col-12"><Link to="/maintenance" className="btn-ghost">Track expenses →</Link></div>
            </div>
          )}

          {tab === "Timeline" && (
            <div className="card-surface p-4">
              {d.timeline.map((t, i) => (
                <div key={t.id} className="d-flex align-items-center gap-3 py-2" style={{ borderBottom: i < d.timeline.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontSize: "1.3rem", width: 36, textAlign: "center" }}>{t.icon}</div>
                  <div className="flex-grow-1">{t.title}</div>
                  <div className="text-muted-2" style={{ fontSize: ".85rem" }}>{t.date}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ConfirmDelete
        open={confirmDelete}
        title="Remove vehicle?"
        message={`Remove ${v.make} ${v.model} (${v.registration_number}) and all related documents, challans and data?`}
        confirmLabel="Remove vehicle"
        busy={deleting}
        onConfirm={removeVehicle}
        onCancel={() => setConfirmDelete(false)}
      />

      <AnimatePresence>
        {editing && editForm && (
          <motion.div
            className="doc-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setEditing(false); setEditForm(null); }}
          >
            <motion.div
              className="glass doc-modal"
              style={{ maxWidth: 720, width: "100%" }}
              initial={{ scale: 0.94, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <VehicleForm
                data={editForm}
                identified={buildIdentifiedMap(editForm, Object.keys(editForm))}
                onChange={setEditForm}
                title="Edit vehicle information"
                subtitle="Update details for this vehicle's digital twin."
              />
              <div className="d-flex gap-2 mt-4">
                <button type="button" className="btn-grad" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setEditForm(null); }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
