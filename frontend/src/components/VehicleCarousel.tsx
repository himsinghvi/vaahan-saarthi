import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Vehicle } from "../api";
import { inrShort } from "../api";
import { ScoreRing, StatusBadge } from "./Ui";
import { useAssistant } from "../context/AssistantContext";

export default function VehicleCarousel({ vehicles }: { vehicles: Vehicle[] }) {
  const [idx, setIdx] = useState(0);
  const { openAssistant, setVehicleId } = useAssistant();
  const v = vehicles[idx];

  useEffect(() => {
    if (v) setVehicleId(v.id);
  }, [v, setVehicleId]);

  if (!vehicles.length) {
    return (
      <div className="card-surface p-4 text-center text-muted-2">
        No vehicles yet. <Link to="/garage" className="text-grad">Add your first vehicle →</Link>
      </div>
    );
  }

  const go = (next: number) => setIdx((next + vehicles.length) % vehicles.length);

  return (
    <div className="vehicle-carousel">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 style={{ fontWeight: 700, margin: 0 }}>My Garage</h5>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted-2" style={{ fontSize: ".82rem" }}>{idx + 1} / {vehicles.length}</span>
          {vehicles.length > 1 && (
            <>
              <button type="button" className="carousel-btn" onClick={() => go(idx - 1)} aria-label="Previous vehicle">‹</button>
              <button type="button" className="carousel-btn" onClick={() => go(idx + 1)} aria-label="Next vehicle">›</button>
            </>
          )}
        </div>
      </div>

      <div className="vehicle-carousel__viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={v.id}
            className="card-surface p-4 vehicle-carousel__slide"
            style={{ background: `linear-gradient(135deg, ${v.color_hex}22, transparent)` }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
              <div className="d-flex align-items-center gap-3">
                <div style={{ fontSize: "3rem" }}>{v.emoji}</div>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 2 }}>{v.make} {v.model}</h3>
                  <div className="text-muted-2">{v.registration_number} · {v.rto}</div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <StatusBadge status={v.compliance.insurance} text={`Insurance ${v.compliance.insurance}`} />
                    <StatusBadge status={v.compliance.puc} text={`PUC ${v.compliance.puc}`} />
                  </div>
                </div>
              </div>
              <button type="button" className="btn-ghost" onClick={() => openAssistant(v.id)}>Ask Vehicle AI ✨</button>
            </div>

            <div className="row g-4 mt-1 align-items-center">
              <div className="col-6 col-md-4 text-center">
                <ScoreRing value={v.health_score} label="Health" />
              </div>
              <div className="col-6 col-md-4 text-center">
                <ScoreRing value={v.compliance_score} label="Compliance" />
              </div>
              <div className="col-md-4">
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between"><span className="text-muted-2">Odometer</span><b>{v.odometer_km.toLocaleString()} km</b></div>
                  <div className="d-flex justify-content-between"><span className="text-muted-2">Est. value</span><b>{inrShort(v.current_value)}</b></div>
                  <div className="d-flex justify-content-between"><span className="text-muted-2">Fuel</span><b>{v.fuel_type}</b></div>
                  <Link to={`/garage/${v.id}`} className="btn-grad mt-2 text-center">View Vehicle →</Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {vehicles.length > 1 && (
        <div className="vehicle-carousel__dots">
          {vehicles.map((veh, i) => (
            <button
              key={veh.id}
              type="button"
              className={`vehicle-carousel__dot ${i === idx ? "active" : ""}`}
              onClick={() => setIdx(i)}
              aria-label={`Show ${veh.make} ${veh.model}`}
              aria-current={i === idx ? "true" : undefined}
            />
          ))}
        </div>
      )}

      {vehicles.length > 1 && (
        <div className="vehicle-carousel__thumbs no-scrollbar">
          {vehicles.map((veh, i) => (
            <button
              key={veh.id}
              type="button"
              className={`vehicle-carousel__thumb ${i === idx ? "active" : ""}`}
              onClick={() => setIdx(i)}
            >
              <span>{veh.emoji}</span>
              <span>{veh.make} {veh.model}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
