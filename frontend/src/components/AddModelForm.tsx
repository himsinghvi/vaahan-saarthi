import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api";

export interface ProviderField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  help?: string;
  default?: string;
}

export interface ProviderSchema {
  id: string;
  label: string;
  icon: string;
  description: string;
  id_field: string;
  fields: ProviderField[];
}

interface Props {
  onAdded: () => void;
  onCancel: () => void;
}

const FAMILIES = ["gpt", "reasoning", "codex", "custom"];

export default function AddModelForm({ onAdded, onCancel }: Props) {
  const [providers, setProviders] = useState<ProviderSchema[]>([]);
  const [provider, setProvider] = useState("");
  const [family, setFamily] = useState("gpt");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get<{ providers: ProviderSchema[] }>("/ai/models/providers")
      .then((r) => {
        setProviders(r.data.providers);
        if (r.data.providers[0]) setProvider(r.data.providers[0].id);
      })
      .catch(() => setErr("Could not load provider schemas."));
  }, []);

  const schema = useMemo(
    () => providers.find((p) => p.id === provider),
    [providers, provider],
  );

  useEffect(() => {
    if (!schema) return;
    const next: Record<string, string> = {};
    schema.fields.forEach((f) => {
      if (f.default) next[f.key] = f.default;
    });
    setConfig(next);
  }, [schema?.id]);

  const setField = (key: string, value: string) => setConfig((c) => ({ ...c, [key]: value }));

  const submit = async () => {
    if (!schema) return;
    setErr("");
    setBusy(true);
    try {
      await api.post("/ai/models/add", { provider, label, family, description, config });
      onAdded();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErr(typeof msg === "string" ? msg : "Could not add model — check required fields.");
    } finally {
      setBusy(false);
    }
  };

  if (!providers.length && !err) {
    return <div className="card-surface p-4 text-muted-2">Loading providers…</div>;
  }

  return (
    <motion.div className="card-surface p-4 mb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h6 style={{ fontWeight: 700 }} className="mb-1">Add LLM model</h6>
      <p className="text-muted-2 mb-3" style={{ fontSize: ".85rem" }}>
        Choose a provider first — we'll show the configuration fields that provider needs.
      </p>

      <label className="text-muted-2 small d-block mb-2">Provider</label>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip ${provider === p.id ? "sel" : ""}`}
            style={provider === p.id ? { borderColor: "var(--violet)", background: "rgba(139,92,246,.14)" } : {}}
            onClick={() => setProvider(p.id)}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {schema && (
        <p className="text-muted-2 mb-3" style={{ fontSize: ".82rem" }}>{schema.description}</p>
      )}

      {schema && (
        <div className="row g-3">
          {schema.fields.map((f) => (
            <div className={f.type === "textarea" ? "col-12" : "col-md-6"} key={f.key}>
              <label className="text-muted-2 small d-block mb-1">
                {f.label}{f.required && <span className="text-grad"> *</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={f.placeholder}
                  value={config[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              ) : (
                <input
                  className="form-control"
                  type={f.type === "password" ? "password" : f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder}
                  value={config[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
              {f.help && <div className="text-muted-2 mt-1" style={{ fontSize: ".72rem" }}>{f.help}</div>}
            </div>
          ))}

          <div className="col-md-4">
            <label className="text-muted-2 small d-block mb-1">Display label</label>
            <input className="form-control" placeholder="Friendly name" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="col-md-4">
            <label className="text-muted-2 small d-block mb-1">Model family</label>
            <select className="form-select" value={family} onChange={(e) => setFamily(e.target.value)}>
              {FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="text-muted-2 small d-block mb-1">Description</label>
            <input className="form-control" placeholder="Optional notes" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      )}

      {err && <div className="mt-3 pill" style={{ background: "rgba(251,113,133,.15)", color: "var(--red)", borderColor: "transparent" }}>{err}</div>}

      <div className="d-flex gap-2 mt-4 flex-wrap">
        <button type="button" className="btn-grad" onClick={submit} disabled={busy || !schema}>{busy ? "Adding…" : "Add model"}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>

      <p className="text-muted-2 mt-3 mb-0" style={{ fontSize: ".75rem" }}>
        Note: Vaahan Saarthi currently routes chat through the configured Azure OpenAI client. Provider configs are saved for catalog & future multi-provider routing. Azure deployments use your .env keys when fields are left blank.
      </p>
    </motion.div>
  );
}
