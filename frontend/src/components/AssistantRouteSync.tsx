import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api";
import { useAssistant } from "../context/AssistantContext";

/** Keeps assistant vehicle context aligned with the current page/route. */
export default function AssistantRouteSync() {
  const { pathname } = useLocation();
  const { setVehicleId } = useAssistant();
  const lastPath = useRef("");

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    const profile = pathname.match(/^\/garage\/([^/]+)$/);
    if (profile) {
      setVehicleId(profile[1]);
      return;
    }

    // Vehicle-focused pages default to the primary (first) vehicle in the garage.
    const primaryVehiclePages = [
      "/dashboard",
      "/insurance",
      "/sell",
      "/accident",
      "/scrap",
      "/travel",
      "/documents",
    ];
    if (primaryVehiclePages.includes(pathname)) {
      api.get("/dashboard")
        .then((r) => setVehicleId(r.data.vehicles[0]?.id ?? null))
        .catch(() => setVehicleId(null));
      return;
    }

    // Garage-wide context for buying, RTO marketplace, challans, settings, etc.
    const garageWidePages = ["/garage", "/buy", "/rto", "/agents", "/challans", "/settings"];
    if (garageWidePages.includes(pathname)) {
      setVehicleId(null);
    }
    // /maintenance sets vehicle from its own dropdown — leave as-is when navigating there.
  }, [pathname, setVehicleId]);

  return null;
}
