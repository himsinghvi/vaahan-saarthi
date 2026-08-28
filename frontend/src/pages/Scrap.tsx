import { motion } from "framer-motion";
import Page from "../components/Page";
import { Reveal, SectionTitle } from "../components/Ui";

const FLOW = ["Check Eligibility", "Find Authorized RVSF Facility", "Prepare Documents", "Vehicle Handover", "Certificate of Deposit", "Certificate of Scrapping", "RC Deregistration"];
const FACILITIES = [
  { name: "GreenScrap RVSF — Pune", dist: "8.2 km", rating: 4.6 },
  { name: "EcoMetal Recyclers — Chinchwad", dist: "14.5 km", rating: 4.3 },
  { name: "CleanCycle RVSF — Hadapsar", dist: "17.1 km", rating: 4.1 },
];

export default function Scrap() {
  return (
    <Page>
      <Reveal><SectionTitle eyebrow="Scrapping Agent" title={<>End-of-life <span className="text-grad">made simple</span></>} sub="Eligibility, RVSF locator, scrap value and deregistration — with the rebate benefits explained." /></Reveal>

      <div className="row g-4 mt-1">
        <div className="col-lg-4">
          <div className="card-surface p-4">
            <h6 style={{ fontWeight: 700 }} className="mb-2">Eligibility</h6>
            <div className="glass p-3">🧠 Your vehicle may be eligible for <b>voluntary scrapping</b>. Petrol {">"}15 yrs / Diesel {">"}10 yrs (region-dependent) or on fitness failure.</div>
            <div className="mt-3">
              <div className="text-muted-2">Estimated scrap value</div>
              <div className="display text-grad" style={{ fontSize: "2rem", fontWeight: 800 }}>₹18,000 – ₹32,000</div>
            </div>
            <div className="pill mt-2">♻️ + Road tax rebate on next purchase</div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card-surface p-4 h-100">
            <h6 style={{ fontWeight: 700 }} className="mb-3">Scrapping workflow</h6>
            <div className="stepper">
              {FLOW.map((s, i) => (
                <div className="step" key={s}>
                  <div><div className="step__dot">{i + 1}</div>{i < FLOW.length - 1 && <div className="step__line" />}</div>
                  <div className="pb-3">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card-surface p-4">
            <h6 style={{ fontWeight: 700 }} className="mb-3">Nearby RVSF facilities</h6>
            {FACILITIES.map((f, i) => (
              <motion.div key={f.name} className="p-3 mb-2" style={{ background: "var(--surface-2)", borderRadius: 12 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="d-flex justify-content-between"><b style={{ fontSize: ".92rem" }}>{f.name}</b><span className="pill" style={{ fontSize: ".68rem" }}>⭐ {f.rating}</span></div>
                <div className="text-muted-2" style={{ fontSize: ".8rem" }}>📍 {f.dist} away</div>
              </motion.div>
            ))}
            <button className="btn-grad w-100 mt-2">Check my eligibility</button>
          </div>
        </div>
      </div>
    </Page>
  );
}
