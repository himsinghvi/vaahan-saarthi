import type { Challan } from "../api";

export interface DisputeGuide {
  title: string;
  body: string;
  steps: string[];
  portal: string;
}

export function buildDisputeGuidance(c: Challan, vehicleLabel: string): DisputeGuide {
  const isSpeeding = /speed|over-speed/i.test(c.offence);
  const isParking = /parking/i.test(c.offence);
  const isSignal = /signal/i.test(c.offence);

  let grounds =
    "The evidence (photo, location, or timestamp) does not match your vehicle or the incident.";
  if (isSpeeding) {
    grounds =
      "Speed camera calibration, wrong vehicle identification, emergency situation, or incorrect speed zone signage.";
  } else if (isParking) {
    grounds =
      "Valid parking permission, vehicle was not at the location, or signage was missing/unclear.";
  } else if (isSignal) {
    grounds =
      "Signal was amber, malfunctioning, or you were directed by traffic police to proceed.";
  }

  return {
    title: `Dispute guidance — ${c.offence}`,
    portal: "https://echallan.parivahan.gov.in",
    body:
      `**Challan:** ${c.offence}\n` +
      `**Vehicle:** ${vehicleLabel}\n` +
      `**Amount:** ₹${c.amount.toLocaleString("en-IN")}\n` +
      `**Location / date:** ${c.location} · ${c.date}\n\n` +
      `You can **contest this challan** if you believe it was issued in error. Common grounds include: ${grounds}`,
    steps: [
      "Gather evidence — photos, GPS logs, toll receipts, or witness details if available.",
      "Visit the **Parivahan e-Challan portal** (Maharashtra / state traffic site) and search by vehicle number or challan number.",
      "Select **Contested / Dispute** and choose the reason that best matches your case.",
      "Upload supporting documents (max file size as per portal) and submit within the **60-day notice window**.",
      "Save the **acknowledgement / reference number** — you may receive a hearing date for virtual traffic court.",
      "Do **not pay** while disputing unless advised; paying usually closes the dispute option.",
      "If rejected, you can appeal through the virtual court process shown on the portal.",
    ],
  };
}
