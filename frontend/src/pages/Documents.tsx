import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type DocumentT, type DocumentDetail } from "../api";
import Page from "../components/Page";
import ConfirmDelete from "../components/ConfirmDelete";
import { StatusBadge, Reveal, SectionTitle } from "../components/Ui";

const TREE = [
  { cat: "Vehicle", items: ["RC", "Insurance", "PUC", "Invoice", "Service History"] },
  { cat: "Owner", items: ["Driving Licence", "Address Proof", "ID Proof"] },
  { cat: "Finance", items: ["Loan Agreement", "NOC", "Loan Closure"] },
  { cat: "Selling", items: ["Sale Agreement", "Transfer Documents", "Delivery Note"] },
];

export default function Documents() {
  const [docs, setDocs] = useState<DocumentT[]>([]);
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [filter, setFilter] = useState("All");
  const [viewer, setViewer] = useState<DocumentDetail | null>(null);
  const [viewerBusy, setViewerBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<DocumentT | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get<DocumentT[]>("/documents").then((r) => setDocs(r.data));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const upload = async (file: File) => {
    setBusy(true); setExtracted(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/documents/upload", fd);
      setExtracted(data); await load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Document OCR failed — try a clearer scan.");
    } finally { setBusy(false); }
  };

  const viewDoc = async (id: string) => {
    setViewerBusy(true);
    try {
      const { data } = await api.get<DocumentDetail>(`/documents/${id}`);
      setViewer(data);
    } catch {
      setToast("Could not open document preview.");
    } finally {
      setViewerBusy(false);
    }
  };

  const downloadDoc = async (id: string) => {
    try {
      const { data } = await api.get<DocumentDetail>(`/documents/${id}`);
      const res = await fetch(`/api/documents/${id}/download`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      setToast(`Downloaded ${data.filename}`);
    } catch {
      setToast("Download failed — is the backend running?");
    }
  };

  const shareDoc = async (doc: DocumentT) => {
    try {
      const { data } = await api.get<DocumentDetail>(`/documents/${doc.id}`);
      const text = `${doc.title} (${doc.type}) — ${doc.status}\n\n${data.preview.slice(0, 400)}…`;
      const shareData = {
        title: `Vaahan Saarthi — ${doc.title}`,
        text,
        url: `${window.location.origin}/documents#doc-${doc.id}`,
      };
      if (navigator.share) {
        await navigator.share(shareData);
        setToast("Shared successfully");
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${text}\n${shareData.url}`);
        setToast("Link & summary copied to clipboard");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setToast("Could not share this document");
      }
    }
  };

  const removeDoc = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${toDelete.id}`);
      if (viewer?.document.id === toDelete.id) setViewer(null);
      setToDelete(null);
      await load();
      setToast("Document removed");
    } catch {
      setToast("Could not remove document");
    } finally {
      setDeleting(false);
    }
  };

  const cats = ["All", "Vehicle", "Owner", "Finance", "Selling"];
  const shown = filter === "All" ? docs : docs.filter((d) => d.category === filter);

  return (
    <Page>
      <Reveal><SectionTitle eyebrow="Document Agent" title={<>Smart <span className="text-grad">Document Vault</span></>} sub="A vehicle-specific DigiLocker layer. Upload once — we OCR, classify and set renewal reminders automatically." /></Reveal>

      {toast && (
        <div className="doc-toast" role="status">{toast}</div>
      )}

      <div className="row g-4 mt-1">
        <div className="col-lg-4" id="upload">
          <div className="card-surface p-4">
            <h6 style={{ fontWeight: 700 }}>Upload document</h6>
            <label className="opt d-block text-center py-4 mt-2" style={{ cursor: "pointer" }}>
              <div style={{ fontSize: "2.2rem" }}>📤</div>
              <div className="mt-2 text-muted-2" style={{ fontSize: ".9rem" }}>{busy ? "Running document AI…" : "Drop RC / Insurance / PUC PDF or image"}</div>
              <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => e.target.files && upload(e.target.files[0])} />
            </label>

            <div className="mt-3">
              <div className="text-muted-2 mb-2" style={{ fontSize: ".8rem" }}>AI Pipeline</div>
              {["OCR", "Classification", "Extraction", "Expiry detection", "Save to vehicle"].map((s, i) => (
                <div key={s} className="d-flex align-items-center gap-2 py-1" style={{ fontSize: ".85rem" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--grad)", display: "grid", placeContent: "center", fontSize: ".7rem", color: "#fff" }}>{i + 1}</span>{s}
                </div>
              ))}
            </div>

            <AnimatePresence>
              {extracted && (
                <motion.div className="glass p-3 mt-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="pill mb-2" style={{ fontSize: ".7rem" }}>
                    🧠 {extracted.confidence}% confidence
                    {extracted.ocr_engine ? ` · ${extracted.ocr_engine}` : ""}
                  </div>
                  {Object.entries(extracted.extracted).map(([k, v]) => (
                    <div key={k} className="d-flex justify-content-between" style={{ fontSize: ".82rem" }}><span className="text-muted-2" style={{ textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span><b>{String(v)}</b></div>
                  ))}
                  <div className="badge-status badge-valid mt-2 d-inline-block">✓ Renewal reminder added</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="card-surface p-4 mt-4">
            <h6 style={{ fontWeight: 700 }} className="mb-2">Organization</h6>
            {TREE.map((t) => (
              <div key={t.cat} className="mb-2">
                <div style={{ fontWeight: 600, fontSize: ".85rem" }}>{t.cat}</div>
                <div className="text-muted-2" style={{ fontSize: ".8rem" }}>{t.items.join(" · ")}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-8">
          <div className="d-flex gap-2 mb-3 flex-wrap">
            {cats.map((c) => <button key={c} type="button" className={`chip ${filter === c ? "sel" : ""}`} style={filter === c ? { borderColor: "var(--violet)", background: "rgba(139,92,246,.14)" } : {}} onClick={() => setFilter(c)}>{c}</button>)}
          </div>
          <div className="row g-3">
            {shown.map((d, i) => (
              <div className="col-md-6" key={d.id} id={`doc-${d.id}`}>
                <Reveal delay={i * 0.04}>
                  <motion.div className="card-surface p-4 h-100" whileHover={{ y: -5 }}>
                    <div className="d-flex justify-content-between">
                      <span className="pill" style={{ fontSize: ".7rem" }}>{d.category} · {d.type}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <h6 className="mt-3 mb-1" style={{ fontWeight: 700 }}>{d.title}</h6>
                    <div className="text-muted-2" style={{ fontSize: ".82rem" }}>
                      {d.issue_date && <>Issued {d.issue_date}</>}{d.expiry_date && <> · Expires {d.expiry_date}</>}
                    </div>
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      <button type="button" className="chip" style={{ fontSize: ".75rem" }} onClick={() => viewDoc(d.id)} disabled={viewerBusy}>👁 View</button>
                      <button type="button" className="chip" style={{ fontSize: ".75rem" }} onClick={() => downloadDoc(d.id)}>⬇ Download</button>
                      <button type="button" className="chip" style={{ fontSize: ".75rem" }} onClick={() => shareDoc(d)}>🔗 Share</button>
                      <button type="button" className="chip chip-danger" style={{ fontSize: ".75rem" }} onClick={() => setToDelete(d)}>🗑 Remove</button>
                    </div>
                  </motion.div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {viewer && (
          <motion.div
            className="doc-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewer(null)}
          >
            <motion.div
              className="glass doc-modal"
              initial={{ scale: 0.94, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <div className="pill mb-2" style={{ fontSize: ".7rem" }}>{viewer.document.category} · {viewer.document.type}</div>
                  <h5 style={{ fontWeight: 800, marginBottom: 4 }}>{viewer.document.title}</h5>
                  {viewer.vehicle_label && <div className="text-muted-2" style={{ fontSize: ".85rem" }}>🚗 {viewer.vehicle_label}</div>}
                </div>
                <button type="button" className="btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setViewer(null)}>✕</button>
              </div>
              <pre className="doc-preview">{viewer.preview}</pre>
              <div className="d-flex gap-2 mt-3 flex-wrap">
                <button type="button" className="btn-grad" onClick={() => downloadDoc(viewer.document.id)}>⬇ Download</button>
                <button type="button" className="btn-ghost" onClick={() => shareDoc(viewer.document)}>🔗 Share</button>
                <button type="button" className="btn-ghost btn-danger-outline" onClick={() => setToDelete(viewer.document)}>🗑 Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDelete
        open={!!toDelete}
        title="Remove document?"
        message={toDelete ? `Remove "${toDelete.title}" from your vault? This cannot be undone.` : ""}
        confirmLabel="Remove document"
        busy={deleting}
        onConfirm={removeDoc}
        onCancel={() => setToDelete(null)}
      />
    </Page>
  );
}
