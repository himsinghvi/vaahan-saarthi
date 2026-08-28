import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, type Vehicle, inrShort } from "../api";
import Page from "../components/Page";
import ConfirmDelete from "../components/ConfirmDelete";
import VehicleForm, {
  EMPTY_VEHICLE_FORM,
  buildIdentifiedMap,
  extractedToForm,
  formToPayload,
  getMissingRequiredFields,
  missingRequiredLabels,
  vehicleToForm,
  type VehicleFormData,
} from "../components/VehicleForm";
import { StatusBadge, Reveal, SectionTitle } from "../components/Ui";

type Method = "number" | "rc" | "manual";

type ReviewState = {
  mode: "add" | "edit";
  vehicleId?: string;
  form: VehicleFormData;
  identified: Record<string, boolean>;
  confidence?: number;
  source?: string;
};

export default function Garage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [method, setMethod] = useState<Method>("number");
  const [reg, setReg] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [manual, setManual] = useState<VehicleFormData>({ ...EMPTY_VEHICLE_FORM, state: "Maharashtra" });
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get<Vehicle[]>("/vehicles").then((r) => setVehicles(r.data));
  useEffect(() => { load(); }, []);

  const resetAddFlow = () => {
    setReview(null);
    setReg("");
    setManual({ ...EMPTY_VEHICLE_FORM, state: "Maharashtra" });
  };

  const closeAdd = () => {
    setShowAdd(false);
    resetAddFlow();
  };

  const lookupByNumber = async () => {
    if (!reg.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post("/vehicles/lookup", { registration_number: reg });
      const extracted = data.extracted || {};
      const autoKeys = Object.keys(extracted).filter((k) => {
        const v = extracted[k];
        return v != null && v !== "" && String(v).toLowerCase() !== "unknown";
      });
      setReview({
        mode: "add",
        form: extractedToForm(extracted),
        identified: buildIdentifiedMap(extractedToForm(extracted), autoKeys),
        confidence: data.confidence,
        source: data.source,
      });
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Could not fetch vehicle details. Try RC upload or manual entry.");
    } finally { setBusy(false); }
  };

  const uploadRc = async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/vehicles/upload-rc", fd);
      const extracted = data.extracted || {};
      const autoKeys = Object.keys(extracted).filter((k) => {
        const v = extracted[k];
        return v != null && v !== "" && String(v).toLowerCase() !== "unknown";
      });
      setReview({
        mode: "add",
        form: extractedToForm(extracted),
        identified: buildIdentifiedMap(extractedToForm(extracted), autoKeys),
        confidence: data.confidence,
        source: data.source || data.ocr_engine,
      });
    } catch (err: any) {
      alert(err?.response?.data?.detail || "RC OCR failed — try a clearer photo or PDF.");
    } finally { setBusy(false); }
  };

  const saveReview = async () => {
    if (!review) return;
    const missing = getMissingRequiredFields(review.form);
    if (missing.length > 0) {
      alert(`Please complete required fields: ${missingRequiredLabels(review.form)}`);
      return;
    }
    const payload = formToPayload(review.form);
    setBusy(true);
    try {
      if (review.mode === "edit" && review.vehicleId) {
        await api.patch(`/vehicles/${review.vehicleId}`, payload);
      } else {
        await api.post("/vehicles/manual", payload);
      }
      setReview(null);
      setShowAdd(false);
      resetAddFlow();
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Could not save vehicle.");
    } finally { setBusy(false); }
  };

  const addManual = async () => {
    const missing = getMissingRequiredFields(manual);
    if (missing.length > 0) {
      alert(`Please complete required fields: ${missingRequiredLabels(manual)}`);
      return;
    }
    const payload = formToPayload(manual);
    setBusy(true);
    try {
      await api.post("/vehicles/manual", payload);
      closeAdd();
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Could not add vehicle.");
    } finally { setBusy(false); }
  };

  const startEdit = (v: Vehicle) => {
    setShowAdd(false);
    setReview({
      mode: "edit",
      vehicleId: v.id,
      form: vehicleToForm(v),
      identified: buildIdentifiedMap(vehicleToForm(v), Object.keys(vehicleToForm(v))),
    });
  };

  const removeVehicle = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/vehicles/${toDelete.id}`);
      setToDelete(null);
      if (review?.vehicleId === toDelete.id) setReview(null);
      await load();
    } finally { setDeleting(false); }
  };

  return (
    <Page>
      <Reveal>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
          <SectionTitle eyebrow="Digital Garage" title={<>Your <span className="text-grad">vehicles</span>, in one place</>} sub="Every vehicle gets a living digital twin — documents, compliance, health & AI insights." />
          <button className="btn-grad" onClick={() => { if (showAdd) closeAdd(); else { setReview(null); setShowAdd(true); } }}>
            {showAdd ? "Close" : "+ Add Vehicle"}
          </button>
        </div>
      </Reveal>

      {/* Edit panel (from card) */}
      <AnimatePresence>
        {review?.mode === "edit" && !showAdd && (
          <motion.div
            className="card-surface p-4 mb-4"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <VehicleForm
              data={review.form}
              identified={review.identified}
              onChange={(form) => setReview({ ...review, form })}
              title="Edit vehicle"
              subtitle="Update any field and save changes."
            />
            <div className="d-flex gap-2 mt-4">
              <button className="btn-grad" onClick={saveReview} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
              <button className="btn-ghost" onClick={() => setReview(null)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="card-surface p-4 mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            {!review ? (
              <>
                <div className="d-flex gap-2 mb-4 flex-wrap">
                  {([["number", "🔢 Vehicle Number"], ["rc", "📤 Upload RC (OCR)"], ["manual", "✍️ Manual Entry"]] as [Method, string][]).map(([m, l]) => (
                    <button key={m} className={`opt ${method === m ? "sel" : ""}`} onClick={() => setMethod(m)} style={{ padding: "10px 16px" }}>{l}</button>
                  ))}
                </div>

                {method === "number" && (
                  <div className="row g-2 align-items-center" style={{ maxWidth: 560 }}>
                    <div className="col">
                      <input className="form-control" placeholder="MH 12 AB 1234" value={reg} onChange={(e) => setReg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookupByNumber()} />
                    </div>
                    <div className="col-auto">
                      <button className="btn-grad" onClick={lookupByNumber} disabled={busy}>{busy ? "Looking up…" : "Look up vehicle"}</button>
                    </div>
                    <div className="col-12"><small className="text-muted-2">We fetch details first — you review and fill missing fields before saving. Demo: MH12AB1234.</small></div>
                  </div>
                )}

                {method === "rc" && (
                  <label className="opt d-block text-center py-5" style={{ cursor: "pointer", maxWidth: 560 }}>
                    <div style={{ fontSize: "2.4rem" }}>📄</div>
                    <div className="mt-2">{busy ? "Extracting with OCR…" : "Click to upload RC (PDF / image / screenshot)"}</div>
                    <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => e.target.files && uploadRc(e.target.files[0])} />
                  </label>
                )}

                {method === "manual" && (
                  <>
                    <VehicleForm
                      data={manual}
                      identified={buildIdentifiedMap(manual, [])}
                      onChange={setManual}
                      title="Enter vehicle details"
                      subtitle="Fill in all fields manually."
                    />
                    <div className="mt-3">
                      <button className="btn-grad" onClick={addManual} disabled={busy}>{busy ? "Adding…" : "Add Vehicle"}</button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <VehicleForm
                  data={review.form}
                  identified={review.identified}
                  onChange={(form) => setReview({ ...review, form })}
                  confidence={review.confidence}
                  source={review.source}
                  title={method === "rc" ? "Review RC extraction" : "Review lookup results"}
                />
                <div className="d-flex gap-2 mt-4 flex-wrap">
                  <button className="btn-grad" onClick={saveReview} disabled={busy}>{busy ? "Saving…" : "✓ Save to garage"}</button>
                  <button className="btn-ghost" onClick={resetAddFlow}>← Back</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="row g-4">
        {vehicles.map((v, i) => (
          <div className="col-md-6 col-lg-4" key={v.id}>
            <Reveal delay={i * 0.06}>
              <motion.div className="card-surface p-4 h-100" whileHover={{ y: -8 }} style={{ background: `linear-gradient(160deg, ${v.color_hex}1f, transparent)` }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div style={{ fontSize: "2.6rem" }}>{v.emoji}</div>
                  <div className="d-flex gap-2 align-items-center">
                    <span className="pill" style={{ fontSize: ".7rem" }}>{v.fuel_type}</span>
                    <button type="button" className="chip" style={{ fontSize: ".68rem" }} onClick={() => startEdit(v)} title="Edit vehicle">✏️</button>
                    <button type="button" className="chip chip-danger" style={{ fontSize: ".68rem" }} onClick={() => setToDelete(v)} title="Remove vehicle">🗑</button>
                  </div>
                </div>
                <h4 className="mt-2 mb-0" style={{ fontWeight: 700 }}>{v.make} {v.model}</h4>
                <div className="text-muted-2">{v.registration_number}</div>

                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-1" style={{ fontSize: ".82rem" }}>
                    <span className="text-muted-2">Compliance</span><span>{v.compliance_score}/100</span>
                  </div>
                  <div className="cbar"><motion.div initial={{ width: 0 }} whileInView={{ width: `${v.compliance_score}%` }} viewport={{ once: true }} transition={{ duration: 1 }} /></div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-3">
                  {v.compliance.puc === "expiring" && <StatusBadge status="expiring" text="PUC expiring" />}
                  {v.compliance.insurance === "expiring" && <StatusBadge status="expiring" text="Insurance expiring" />}
                  {v.hypothecation && <span className="badge-status" style={{ background: "rgba(139,92,246,.15)", color: "var(--violet)" }}>🏦 Financed</span>}
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-muted-2" style={{ fontSize: ".85rem" }}>Est. {inrShort(v.current_value)}</span>
                  <Link to={`/garage/${v.id}`} className="text-grad" style={{ fontWeight: 700 }}>View Vehicle →</Link>
                </div>
              </motion.div>
            </Reveal>
          </div>
        ))}
      </div>

      <ConfirmDelete
        open={!!toDelete}
        title="Remove vehicle?"
        message={toDelete ? `Remove ${toDelete.make} ${toDelete.model} (${toDelete.registration_number}) from your garage? Related documents, challans and reminders will also be removed.` : ""}
        confirmLabel="Remove vehicle"
        busy={deleting}
        onConfirm={removeVehicle}
        onCancel={() => setToDelete(null)}
      />
    </Page>
  );
}
