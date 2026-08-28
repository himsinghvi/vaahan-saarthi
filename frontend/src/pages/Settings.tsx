import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import Page from "../components/Page";
import ConfirmDelete from "../components/ConfirmDelete";
import { Reveal, SectionTitle } from "../components/Ui";
import AddModelForm from "../components/AddModelForm";

interface ModelOption {
  id: string; label: string; provider: string; family: string; description: string; active: boolean;
  builtin?: boolean;
  config?: Record<string, string>;
}

const FAMILY_ICON: Record<string, string> = {
  gpt: "🤖", reasoning: "🧠", codex: "💻", custom: "✨",
};

const PROVIDER_LABEL: Record<string, string> = {
  "azure-openai": "Azure OpenAI",
  openai: "OpenAI",
  anthropic: "Anthropic",
  "google-gemini": "Google Gemini",
  "openai-compatible": "OpenAI-compatible",
};

export default function Settings() {
  const [options, setOptions] = useState<ModelOption[]>([]);
  const [selected, setSelected] = useState("");
  const [azureEnabled, setAzureEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [toDelete, setToDelete] = useState<ModelOption | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoadErr("");
      const { data } = await api.get("/ai/models");
      setOptions(data.options); setSelected(data.selected); setAzureEnabled(data.azure_enabled);
    } catch {
      setLoadErr("Could not load models — is the backend running on port 8020?");
    }
  };
  useEffect(() => { load(); }, []);

  const choose = async (id: string) => {
    setSelected(id); setSaving(true); setSaved(false);
    try {
      await api.post("/ai/models/select", { model_id: id });
      setSaved(true); setTimeout(() => setSaved(false), 2200);
    } finally { setSaving(false); }
  };

  const removeModel = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setLoadErr("");
    try {
      const { data } = await api.post("/ai/models/remove", { model_id: toDelete.id });
      setOptions(data.options);
      setSelected(data.selected);
      setToDelete(null);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setLoadErr(typeof detail === "string" ? detail : "Could not remove model. Restart the backend if this persists.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Page>
      <Reveal><SectionTitle eyebrow="Admin · LLM" title={<>Global <span className="text-grad">AI model</span> config</>} sub="Admin-only. The model you select here is used for every user's assistant, agents and live-search across Vaahan Saarthi." /></Reveal>

      <div className="d-flex flex-wrap gap-2 align-items-center mt-1 mb-4">
        <span className="pill">{azureEnabled ? "🟢 Azure OpenAI connected" : "🟡 Fallback mode (no keys)"}</span>
        <span className="pill">Active: <b className="text-grad ms-1">{selected || "…"}</b></span>
        {loadErr && <span className="pill" style={{ background: "rgba(251,113,133,.15)", color: "var(--red)", borderColor: "transparent" }}>{loadErr}</span>}
        <AnimatePresence>
          {saving && <motion.span className="pill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Saving…</motion.span>}
          {saved && <motion.span className="pill" style={{ background: "rgba(52,211,153,.15)", color: "var(--green)", borderColor: "transparent" }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>✓ Applied to all LLM calls</motion.span>}
        </AnimatePresence>
        <button type="button" className="btn-ghost ms-auto" onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "+ Add model"}</button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddModelForm
            onAdded={async () => { setShowAdd(false); await load(); }}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>

      <div className="row g-3">
        {options.map((o, i) => (
          <div className="col-md-6 col-lg-4" key={`${o.provider}-${o.id}`}>
            <Reveal delay={i * 0.05}>
              <div
                className="card-surface p-4 h-100"
                style={{ borderColor: o.id === selected ? "var(--violet)" : undefined, background: o.id === selected ? "rgba(139,92,246,.1)" : undefined }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div style={{ fontSize: "2rem" }}>{FAMILY_ICON[o.family] || "✨"}</div>
                  <div className="d-flex gap-2 align-items-center">
                    {o.id === selected
                      ? <span className="badge-status badge-valid">✓ Active</span>
                      : <span className="pill" style={{ fontSize: ".68rem" }}>{o.family}</span>}
                    {options.length > 1 && (
                      <button type="button" className="chip chip-danger" style={{ fontSize: ".68rem" }} onClick={() => setToDelete(o)} title="Remove model">🗑</button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="w-100 text-start border-0 bg-transparent p-0 mt-2"
                  onClick={() => choose(o.id)}
                  style={{ cursor: "pointer", color: "inherit" }}
                >
                  <h5 className="mb-1" style={{ fontWeight: 700 }}>{o.label}</h5>
                  <div className="text-muted-2" style={{ fontSize: ".78rem" }}>
                    {o.id} · {PROVIDER_LABEL[o.provider] || o.provider}
                    {o.builtin && " · built-in"}
                  </div>
                  <p className="text-muted-2 mt-2 mb-0" style={{ fontSize: ".88rem" }}>{o.description}</p>
                </button>
                {o.config && Object.keys(o.config).length > 0 && (
                  <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)", fontSize: ".72rem" }}>
                    {Object.entries(o.config).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="text-muted-2"><span style={{ textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>: {v}</div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        ))}
      </div>

      <div className="glass p-3 mt-4" style={{ fontSize: ".88rem" }}>
        🧠 Pick a model or add your own via **+ Add model**. Use 🗑 to remove any model from your config (at least one must stay).
      </div>

      <ConfirmDelete
        open={!!toDelete}
        title="Remove LLM model?"
        message={toDelete ? `Remove "${toDelete.label}" (${toDelete.id}) from your config?` : ""}
        confirmLabel="Remove model"
        busy={deleting}
        onConfirm={removeModel}
        onCancel={() => setToDelete(null)}
      />
    </Page>
  );
}
