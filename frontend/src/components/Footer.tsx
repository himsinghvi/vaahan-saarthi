import { Link } from "react-router-dom";
import BrandName from "./BrandName";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "60px 0 40px", marginTop: 40 }}>
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="brand d-flex align-items-center gap-2" style={{ fontWeight: 800, fontSize: "1.4rem" }}>
              🚗 <BrandName />
            </div>
            <p className="text-muted-2 mt-3" style={{ maxWidth: 320 }}>
              The Vehicle Ownership Operating System for India. Buy → Register → Insure →
              Maintain → Comply → Travel → Sell → Transfer → Scrap.
            </p>
            <div className="pill mt-2">🇮🇳 Built for India</div>
          </div>
          <div className="col-6 col-lg-2">
            <h6 className="mb-3">Product</h6>
            <div className="d-flex flex-column gap-2 text-muted-2">
              <Link to="/dashboard" className="link-underline">Dashboard</Link>
              <Link to="/garage" className="link-underline">My Garage</Link>
              <Link to="/buy" className="link-underline">Buy a Vehicle</Link>
              <Link to="/rto" className="link-underline">RTO Services</Link>
            </div>
          </div>
          <div className="col-6 col-lg-2">
            <h6 className="mb-3">Lifecycle</h6>
            <div className="d-flex flex-column gap-2 text-muted-2">
              <Link to="/documents" className="link-underline">Documents</Link>
              <Link to="/challans" className="link-underline">Challans</Link>
              <Link to="/insurance" className="link-underline">Insurance</Link>
              <Link to="/sell" className="link-underline">Sell / Scrap</Link>
            </div>
          </div>
          <div className="col-lg-4">
            <h6 className="mb-3">Stay compliant</h6>
            <p className="text-muted-2">Never miss a renewal again. Get smart AI reminders across every vehicle.</p>
            <Link to="/dashboard" className="btn-grad">Launch App →</Link>
          </div>
        </div>
        <hr className="divider my-4" />
        <div className="d-flex flex-wrap justify-content-between text-muted-2" style={{ fontSize: ".85rem" }}>
          <span>© 2026 <BrandName />. AI estimates are guidance, not official confirmations.</span>
          <span>VAHAN · Sarathi · DigiLocker aware</span>
        </div>
      </div>
    </footer>
  );
}
