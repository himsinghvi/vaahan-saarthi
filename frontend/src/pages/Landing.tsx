import { Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import CountUp from "react-countup";
import { Reveal, SectionTitle } from "../components/Ui";

const LIFECYCLE = [
  { icon: "🔍", t: "Research", d: "Compare vehicles, EV vs petrol, on-road price & EMI." },
  { icon: "🛒", t: "Buy", d: "AI vehicle finder ranks your best matches." },
  { icon: "🏛", t: "Register", d: "Guided RTO workflows & personalized checklists." },
  { icon: "🛡", t: "Insure", d: "Policy analyzer & smart renewal comparison." },
  { icon: "🔧", t: "Maintain", d: "Predictive service reminders & expense tracking." },
  { icon: "✅", t: "Comply", d: "Live compliance score, PUC, tax & challans." },
  { icon: "🧭", t: "Travel", d: "Pre-trip checks & interstate rule guidance." },
  { icon: "💸", t: "Sell", d: "AI valuation & ownership transfer tracker." },
  { icon: "♻️", t: "Scrap", d: "Eligibility, RVSF locator & deregistration." },
];

const FEATURES = [
  { icon: "🚗", t: "Digital Vehicle Twin", d: "Every vehicle gets a living profile: identity, documents, compliance, health, expenses & AI insights." },
  { icon: "🧠", t: "Agentic AI Advisor", d: "An orchestrator routes your question to specialized agents — buying, RTO, insurance, maintenance & more." },
  { icon: "🗂", t: "Smart Document Vault", d: "Upload an RC or policy — OCR extracts, classifies & auto-sets renewal reminders." },
  { icon: "📊", t: "Compliance Score", d: "A credit-score-style number for your vehicle. Know exactly what needs action." },
  { icon: "🚨", t: "Challan Intelligence", d: "Understand every violation in plain language, with pay & dispute guidance." },
  { icon: "🔮", t: "Predictive Reminders", d: "We tell you what to do next — before deadlines, fines or breakdowns hit." },
];

const AGENTS = [
  "Vehicle Intelligence", "RTO Rules", "Compliance", "Document",
  "Buying Advisor", "Maintenance", "Selling", "Scrapping",
];

const MARQUEE = ["VAHAN", "Sarathi", "DigiLocker", "e-Challan", "FASTag", "RVSF", "HSRP", "PUC", "Insurance"];

export default function Landing() {
  return (
    <div>
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="pill mb-4">✨ India's AI Vehicle Companion</div>
              <h1 className="display hero-title">
                <BrandName /><br /><span className="text-muted-2" style={{ fontSize: "0.55em", fontWeight: 600 }}>Your vehicle&apos;s AI operating system</span>
              </h1>
              <p className="text-muted-2 mt-4 hero-sub">
                Tell us your vehicle or upload your RC — and we handle everything.
                Buy • Register • Maintain • Insure • Comply • Sell.
              </p>
              <div className="d-flex flex-wrap gap-3 mt-4">
                <Link to="/garage" className="btn-grad">🚗 Add My Vehicle</Link>
                <Link to="/dashboard?assistant=1" className="btn-ghost">✨ Ask Vehicle AI</Link>
              </div>
              <div className="d-flex flex-wrap gap-4 mt-5">
                {[
                  { n: 10, s: "Lifecycle stages" },
                  { n: 8, s: "AI agents" },
                  { n: 100, s: "Compliance score" },
                ].map((st) => (
                  <div key={st.s}>
                    <div className="display text-grad" style={{ fontSize: "2.2rem", fontWeight: 800 }}>
                      <CountUp end={st.n} duration={2} />
                    </div>
                    <div className="text-muted-2" style={{ fontSize: ".85rem" }}>{st.s}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card-surface p-4 hero-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div style={{ fontSize: "2.4rem" }}>🚗</div>
                    <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>Hyundai Creta</div>
                    <div className="text-muted-2">MH 12 AB 1234</div>
                  </div>
                  <span className="pill">Health 92</span>
                </div>
                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-1" style={{ fontSize: ".85rem" }}>
                    <span className="text-muted-2">Compliance</span><span>86 / 100</span>
                  </div>
                  <div className="cbar"><div style={{ width: "86%" }} /></div>
                </div>
                <div className="badge-status badge-expiring mt-3 d-inline-block">⚠ PUC expires in 18 days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="py-4 marquee-wrap">
        <div className="marquee">
          <div className="marquee__track">
            <span>{MARQUEE.map((m) => <span key={m}>{m} <span style={{ color: "var(--violet)" }}>◆</span></span>)}</span>
            <span>{MARQUEE.map((m) => <span key={m + "2"}>{m} <span style={{ color: "var(--violet)" }}>◆</span></span>)}</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="display section-heading">
              One companion.<br /><span className="text-grad">Every stage of the journey.</span>
            </h2>
          </Reveal>
        </div>
      </section>

      <section id="features" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal><SectionTitle eyebrow="Why us" title={<>Not another vehicle info website.<br /><span className="text-grad"><BrandName /> — your vehicle operating system.</span></>} /></Reveal>
          <div className="row g-4 mt-2">
            {FEATURES.map((f) => (
              <div className="col-md-6 col-lg-4" key={f.t}>
                <div className="card-surface p-4 h-100">
                  <div style={{ fontSize: "2.2rem" }}>{f.icon}</div>
                  <h5 className="mt-3 mb-2" style={{ fontWeight: 700 }}>{f.t}</h5>
                  <p className="text-muted-2 mb-0">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lifecycle" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal><SectionTitle center eyebrow="The backbone" title={<>The complete <span className="text-grad">vehicle lifecycle</span></>} sub="Every feature maps to a stage of ownership." /></Reveal>
          <div className="row g-4 mt-3">
            {LIFECYCLE.map((l, i) => (
              <div className="col-6 col-md-4" key={l.t}>
                <div className="card-surface p-4 h-100">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ fontSize: "1.8rem" }}>{l.icon}</div>
                    <div className="pill" style={{ fontSize: ".7rem" }}>Stage {i + 1}</div>
                  </div>
                  <h5 className="mt-3 mb-1" style={{ fontWeight: 700 }}>{l.t}</h5>
                  <p className="text-muted-2 mb-0" style={{ fontSize: ".9rem" }}>{l.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agents" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="glass p-5">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <SectionTitle eyebrow="Agentic AI" title={<>A team of <span className="text-grad">specialized agents</span>, orchestrated for you</>} />
                <Link to="/dashboard" className="btn-grad mt-4 d-inline-block">Try the AI Assistant →</Link>
              </div>
              <div className="col-lg-6 d-flex flex-wrap gap-2">
                {AGENTS.map((a) => (
                  <span key={a} className="pill" style={{ padding: "10px 16px" }}>🧠 {a} Agent</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="footer-cta p-5 text-center" style={{ color: "#0a0a12" }}>
            <h2 className="display" style={{ fontSize: "clamp(1.8rem,5vw,3.2rem)", fontWeight: 800 }}>Ready to give your vehicle a brain?</h2>
            <p style={{ fontSize: "1.15rem", opacity: 0.85, maxWidth: 560, margin: "12px auto 24px" }}>
              Add your first vehicle in seconds. No RTO jargon. No missed deadlines.
            </p>
            <Link to="/garage" className="btn-grad" style={{ background: "#0a0a12", color: "#fff" }}>Get Started Free →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
