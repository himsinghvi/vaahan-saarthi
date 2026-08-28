import { useEffect, useState } from "react";
import { api } from "../api";

export default function BootBanner() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.get("/health")
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, []);

  if (ok === null) return null;

  if (ok) {
    return (
      <div className="boot-banner boot-banner--ok" role="status">
        ✓ Connected — open at <b>http://localhost:5199</b> (not the backend port 8020)
      </div>
    );
  }

  return (
    <div className="boot-banner boot-banner--err" role="alert">
      ⚠ Backend offline — start it: <code>cd backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8020</code>
      <button type="button" className="chip ms-2" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}
