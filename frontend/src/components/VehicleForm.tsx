import type { Vehicle } from "../api";

export interface VehicleFormData {
  registration_number: string;
  make: string;
  model: string;
  variant: string;
  fuel_type: string;
  registration_date: string;
  owner_name: string;
  state: string;
  rto: string;
  hypothecation: boolean;
  financier: string;
  odometer_km: string;
  purchase_price: string;
  current_value: string;
}

export const EMPTY_VEHICLE_FORM: VehicleFormData = {
  registration_number: "",
  make: "",
  model: "",
  variant: "",
  fuel_type: "Petrol",
  registration_date: "",
  owner_name: "",
  state: "",
  rto: "",
  hypothecation: false,
  financier: "",
  odometer_km: "",
  purchase_price: "",
  current_value: "",
};

const FUELS = ["Petrol", "Diesel", "CNG", "EV", "Hybrid"];

const FIELD_LABELS: Record<keyof VehicleFormData, string> = {
  registration_number: "Registration number",
  make: "Make",
  model: "Model",
  variant: "Variant",
  fuel_type: "Fuel type",
  registration_date: "Registration date",
  owner_name: "Owner name",
  state: "State",
  rto: "RTO / Registering authority",
  hypothecation: "Financed (hypothecation)",
  financier: "Financier / bank",
  odometer_km: "Odometer (km)",
  purchase_price: "Purchase price (₹)",
  current_value: "Current value (₹)",
};

const NUMERIC_FIELDS = new Set<keyof VehicleFormData>(["odometer_km", "purchase_price", "current_value"]);

function parseNumericField(raw: string): number {
  const cleaned = String(raw ?? "").replace(/[,₹\s]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function numericToField(n: number | null | undefined): string {
  return n != null && Number.isFinite(n) ? String(n) : "";
}

function normalizeDateField(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\-/](\d{1,2})[\-/](\d{2,4})$/);
  if (!m) return s;
  let [, d, mo, y] = m;
  if (y.length === 2) y = Number(y) < 50 ? `20${y}` : `19${y}`;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const REQUIRED_KEYS: (keyof VehicleFormData)[] = [
  "registration_number", "make", "model", "fuel_type", "state",
];

export function getMissingRequiredFields(data: VehicleFormData): (keyof VehicleFormData)[] {
  return REQUIRED_KEYS.filter((k) => isFieldMissing(k, data[k]));
}

export function missingRequiredLabels(data: VehicleFormData): string {
  return getMissingRequiredFields(data).map((k) => FIELD_LABELS[k]).join(", ");
}

export function isRequiredField(key: keyof VehicleFormData): boolean {
  return REQUIRED_KEYS.includes(key);
}

export function isFieldMissing(key: keyof VehicleFormData, value: unknown): boolean {
  if (key === "hypothecation") return false;
  if (value === null || value === undefined) return true;
  if (typeof value === "boolean") return false;
  const s = String(value).trim();
  if (!s) return true;
  if ((key === "make" || key === "model") && s.toLowerCase() === "unknown") return true;
  return false;
}

export function buildIdentifiedMap(
  data: Partial<VehicleFormData>,
  autoKeys: string[] = [],
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const key of Object.keys(FIELD_LABELS) as (keyof VehicleFormData)[]) {
    if (key === "hypothecation") {
      map[key] = autoKeys.includes(key);
      continue;
    }
    const val = data[key];
    const hasValue = !isFieldMissing(key, val);
    map[key] = autoKeys.includes(key) || hasValue;
  }
  return map;
}

export function extractedToForm(extracted: Record<string, unknown>): VehicleFormData {
  return {
    registration_number: String(extracted.registration_number ?? ""),
    make: String(extracted.make ?? ""),
    model: String(extracted.model ?? ""),
    variant: String(extracted.variant ?? ""),
    fuel_type: String(extracted.fuel_type ?? "Petrol"),
    registration_date: normalizeDateField(String(extracted.registration_date ?? "")),
    owner_name: String(extracted.owner_name ?? ""),
    state: String(extracted.state ?? ""),
    rto: String(extracted.rto ?? ""),
    hypothecation: Boolean(extracted.hypothecation),
    financier: String(extracted.financier ?? ""),
    odometer_km: numericToField(extracted.odometer_km as number | undefined),
    purchase_price: numericToField(extracted.purchase_price as number | undefined),
    current_value: numericToField(extracted.current_value as number | undefined),
  };
}

export function vehicleToForm(v: Vehicle): VehicleFormData {
  return {
    registration_number: v.registration_number,
    make: v.make,
    model: v.model,
    variant: v.variant || "",
    fuel_type: v.fuel_type,
    registration_date: normalizeDateField(v.registration_date),
    owner_name: v.owner_name,
    state: v.state,
    rto: v.rto,
    hypothecation: v.hypothecation,
    financier: v.financier || "",
    odometer_km: numericToField(v.odometer_km),
    purchase_price: numericToField(v.purchase_price),
    current_value: numericToField(v.current_value),
  };
}

export function formToPayload(data: VehicleFormData) {
  const regDate = normalizeDateField(data.registration_date);
  return {
    registration_number: data.registration_number.trim(),
    make: data.make.trim() || "Unknown",
    model: data.model.trim() || "Unknown",
    variant: data.variant.trim(),
    fuel_type: data.fuel_type,
    registration_date: regDate || "2023-01-01",
    owner_name: data.owner_name.trim(),
    state: data.state.trim() || "India",
    rto: data.rto.trim(),
    hypothecation: Boolean(data.hypothecation),
    financier: data.financier.trim() || null,
    odometer_km: parseNumericField(data.odometer_km),
    purchase_price: parseNumericField(data.purchase_price),
    current_value: parseNumericField(data.current_value),
  };
}

export function countMissing(data: VehicleFormData, identified: Record<string, boolean>): number {
  return REQUIRED_KEYS.filter((k) => isFieldMissing(k, data[k]) || !identified[k]).length;
}

type Props = {
  data: VehicleFormData;
  identified: Record<string, boolean>;
  onChange: (data: VehicleFormData) => void;
  confidence?: number;
  source?: string;
  title?: string;
  subtitle?: string;
};

function FieldBadge({ ok, required }: { ok: boolean; required: boolean }) {
  if (required && !ok) {
    return (
      <span
        className="badge-status"
        style={{
          fontSize: ".65rem",
          padding: "2px 8px",
          background: "rgba(251,113,133,.15)",
          color: "var(--red)",
          fontWeight: 600,
        }}
      >
        ✕ Required
      </span>
    );
  }
  return (
    <span
      className="badge-status"
      style={{
        fontSize: ".65rem",
        padding: "2px 8px",
        background: ok ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.06)",
        color: ok ? "var(--green)" : "var(--muted-bright)",
      }}
    >
      {ok ? "✓ Identified" : required ? "Required" : "Optional"}
    </span>
  );
}

function FieldLabel({ fieldKey }: { fieldKey: keyof VehicleFormData }) {
  const required = isRequiredField(fieldKey);
  return (
    <label className="text-muted-2 small mb-0">
      {FIELD_LABELS[fieldKey]}
      {required && <span style={{ color: "var(--red)", marginLeft: 3 }} title="Required">*</span>}
    </label>
  );
}

export default function VehicleForm({
  data,
  identified,
  onChange,
  confidence,
  source,
  title = "Review vehicle details",
  subtitle = "Fields with * are required. Complete all required fields before saving.",
}: Props) {
  const set = (key: keyof VehicleFormData, value: string | boolean) => {
    onChange({ ...data, [key]: value });
  };

  const missingRequired = getMissingRequiredFields(data);
  const missingCount = missingRequired.length;
  const missingStyle = (key: keyof VehicleFormData) =>
    isRequiredField(key) && isFieldMissing(key, data[key])
      ? { borderColor: "var(--red)", boxShadow: "0 0 0 2px rgba(251,113,133,.2)" }
      : undefined;

  const textFields: (keyof VehicleFormData)[] = [
    "registration_number", "make", "model", "variant",
    "registration_date", "owner_name", "state", "rto", "financier",
    "odometer_km", "purchase_price", "current_value",
  ];

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h6 style={{ fontWeight: 700, marginBottom: 4 }}>{title}</h6>
          <p className="text-muted-2 mb-0" style={{ fontSize: ".85rem" }}>{subtitle}</p>
        </div>
        {(confidence != null || source) && (
          <div className="pill" style={{ fontSize: ".72rem" }}>
            🧠 {confidence != null ? `${confidence}% confidence` : "Review"}
            {source ? ` · ${source}` : ""}
          </div>
        )}
      </div>

      {missingCount > 0 && (
        <div
          className="mb-3 px-3 py-3"
          style={{
            borderRadius: 12,
            background: "rgba(251,113,133,.08)",
            border: "1px solid rgba(251,113,133,.35)",
            fontSize: ".85rem",
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--red)", marginBottom: 6 }}>
            ⚠ {missingCount} required field{missingCount > 1 ? "s" : ""} missing
          </div>
          <div className="text-muted-2" style={{ fontSize: ".82rem", marginBottom: 8 }}>
            Please fill in:{" "}
            <strong style={{ color: "var(--text)" }}>
              {missingRequired.map((k) => FIELD_LABELS[k]).join(", ")}
            </strong>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {missingRequired.map((k) => (
              <span
                key={k}
                className="badge-status"
                style={{
                  background: "rgba(251,113,133,.15)",
                  color: "var(--red)",
                  fontSize: ".75rem",
                  fontWeight: 600,
                }}
              >
                {FIELD_LABELS[k]} *
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="d-flex flex-wrap gap-3 mb-3" style={{ fontSize: ".75rem" }}>
        <span><span style={{ color: "var(--red)" }}>*</span> Required</span>
        <span><span className="badge-status" style={{ fontSize: ".6rem", padding: "1px 6px", background: "rgba(52,211,153,.15)", color: "var(--green)" }}>✓</span> Auto-detected</span>
        <span className="text-muted-2">Other fields are optional</span>
      </div>

      <div className="row g-3">
        {textFields.map((key) => {
          const missing = isFieldMissing(key, data[key]);
          const required = isRequiredField(key);
          const detected = identified[key] && !missing;
          return (
            <div className="col-md-6" key={key}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <FieldLabel fieldKey={key} />
                <FieldBadge ok={detected} required={required} />
              </div>
              <input
                className="form-control"
                type={key === "registration_date" ? "date" : NUMERIC_FIELDS.has(key) ? "number" : "text"}
                min={NUMERIC_FIELDS.has(key) ? 0 : undefined}
                step={NUMERIC_FIELDS.has(key) ? 1 : undefined}
                value={data[key] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder={missing ? `Enter ${FIELD_LABELS[key].toLowerCase()}${required ? " (required)" : ""}` : undefined}
                style={missingStyle(key)}
                aria-required={required}
              />
            </div>
          );
        })}

        <div className="col-md-6">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <FieldLabel fieldKey="fuel_type" />
            <FieldBadge ok={identified.fuel_type && !isFieldMissing("fuel_type", data.fuel_type)} required />
          </div>
          <select
            className="form-select"
            value={data.fuel_type}
            onChange={(e) => set("fuel_type", e.target.value)}
            style={missingStyle("fuel_type")}
            aria-required
          >
            {FUELS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>

        <div className="col-md-6 d-flex align-items-end">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="veh-hypothecation"
              checked={data.hypothecation}
              onChange={(e) => set("hypothecation", e.target.checked)}
            />
            <label className="form-check-label" htmlFor="veh-hypothecation">
              Vehicle is financed (hypothecation)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
