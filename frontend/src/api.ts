import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  language?: string;
  role?: "admin" | "user";
}

/** Attach RLS user id to every API call after sign-in. */
export function setApiUserId(id: string | null) {
  if (id) api.defaults.headers.common["X-User-Id"] = id;
  else delete api.defaults.headers.common["X-User-Id"];
}

export interface Compliance {
  rc: string; insurance: string; puc: string;
  tax: string; challan: string; fitness: string;
}
export interface Vehicle {
  id: string; registration_number: string; make: string; model: string; variant: string;
  fuel_type: string; registration_date: string; owner_name: string; rto: string; state: string;
  category: string; hypothecation: boolean; financier?: string; emoji: string; color_hex: string;
  odometer_km: number; purchase_price: number; current_value: number;
  health_score: number; compliance_score: number; compliance: Compliance;
}
export interface Reminder { id: string; vehicle_id?: string; title: string; due_date: string; urgency: "critical" | "upcoming" | "info"; }
export interface TimelineEvent { id: string; vehicle_id: string; title: string; date: string; icon: string; kind: string; }
export interface DocumentT { id: string; vehicle_id?: string; category: string; type: string; title: string; issue_date?: string; expiry_date?: string; status: "valid" | "expiring" | "expired"; verified: boolean; }

export interface DocumentDetail {
  document: DocumentT;
  vehicle_label?: string | null;
  preview: string;
  filename: string;
}
export interface Challan { id: string; vehicle_id: string; offence: string; amount: number; date: string; location: string; status: string; }
export interface Expense { id: string; vehicle_id: string; type: string; amount: number; date: string; note: string; }
export interface ActionCard { label: string; icon: string; route?: string; kind: string; }
export interface Source { title: string; url: string; }
export interface ChatResponse { intent: string; agent: string; reply: string; actions: ActionCard[]; powered_by: string; used_search: boolean; sources: Source[]; }

export interface DashboardData {
  user: { name: string };
  vehicles: Vehicle[];
  reminders: Reminder[];
  timeline: TimelineEvent[];
  stats: { vehicles: number; actions: number; pending_challans: number; documents: number; month_spend: number };
}

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

export const inrShort = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};
