import type { Vehicle } from "../api";

export function buildVehicleWelcome(v: Vehicle, userName = "there"): string {
  const issues: string[] = [];
  if (v.compliance.puc === "expiring") issues.push("PUC expiring soon");
  if (v.compliance.puc === "expired") issues.push("PUC expired");
  if (v.compliance.insurance === "expiring") issues.push("insurance renewal due");
  if (v.compliance.insurance === "expired") issues.push("insurance expired");
  if (v.compliance.challan === "pending") issues.push("pending challans");

  const alert =
    issues.length > 0
      ? ` Heads-up: ${issues.join(", ")}.`
      : " Everything looks compliant right now.";

  return (
    `Hi ${userName} 👋 I'm focused on your ${v.emoji} **${v.make} ${v.model}** (${v.registration_number}).\n` +
    `${v.fuel_type} · ${v.odometer_km.toLocaleString()} km · Compliance ${v.compliance_score}/100 · Health ${v.health_score}/100.${alert}\n` +
    `Ask me anything about *this* vehicle — documents, RTO, insurance, challans, maintenance or resale.`
  );
}

export function buildGarageWelcome(vehicles: Vehicle[], userName = "there"): string {
  if (vehicles.length === 0) {
    return `Hi ${userName} 👋 Add a vehicle to your garage and I'll give you personalized guidance.`;
  }
  const list = vehicles.map((v) => `${v.emoji} ${v.make} ${v.model} (${v.registration_number})`).join(", ");
  return (
    `Hi ${userName} 👋 I'm your Vaahan Saarthi companion across your whole garage: ${list}.\n` +
    `Open a vehicle profile (or use **Open Assistant** there) for focused help on one vehicle.`
  );
}

export function vehicleSuggestions(v: Vehicle): string[] {
  const base = [
    "What documents are expiring on this vehicle?",
    "Explain my pending challans",
    "What is this vehicle worth today?",
  ];
  if (v.fuel_type === "EV") {
    return ["What's my real-world range and charging cost?", "Compare EV vs petrol for my usage", ...base];
  }
  if (v.category?.toLowerCase().includes("two") || v.model.toLowerCase().includes("activa")) {
    return ["When is my next service due?", "Can I transfer this two-wheeler?", ...base];
  }
  return ["When should I renew PUC and insurance?", "How do I transfer ownership?", ...base];
}

export function garageSuggestions(): string[] {
  return [
    "Which vehicle needs attention first?",
    "Compare my vehicles' compliance scores",
    "Which car should I buy next?",
    "Summarize pending challans across my garage",
  ];
}
