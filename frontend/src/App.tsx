import { useEffect } from "react";
import { Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import AiAssistant from "./components/AiAssistant";
import BootBanner from "./components/BootBanner";
import AssistantRouteSync from "./components/AssistantRouteSync";
import { RequireAuth, GuestOnly, RequireAdmin } from "./components/AuthGate";
import { useAssistant } from "./context/AssistantContext";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Garage from "./pages/Garage";
import VehicleProfile from "./pages/VehicleProfile";
import Buy from "./pages/Buy";
import Rto from "./pages/Rto";
import Documents from "./pages/Documents";
import Challans from "./pages/Challans";
import Maintenance from "./pages/Maintenance";
import Sell from "./pages/Sell";
import Insurance from "./pages/Insurance";
import Accident from "./pages/Accident";
import Scrap from "./pages/Scrap";
import Travel from "./pages/Travel";
import Settings from "./pages/Settings";
import RtoAgents from "./pages/RtoAgents";
import Footer from "./components/Footer";

function AppLayout() {
  const loc = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openAssistant } = useAssistant();
  const isWelcome = loc.pathname === "/welcome";

  useEffect(() => {
    if (searchParams.get("assistant") === "1") {
      openAssistant();
      searchParams.delete("assistant");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, openAssistant]);

  return (
    <div className="app-shell">
      <AssistantRouteSync />
      <BootBanner />
      <Navbar />
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/garage" element={<Garage />} />
        <Route path="/garage/:id" element={<VehicleProfile />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/rto" element={<Rto />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/challans" element={<Challans />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/insurance" element={<Insurance />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/accident" element={<Accident />} />
        <Route path="/scrap" element={<Scrap />} />
        <Route path="/travel" element={<Travel />} />
        <Route path="/agents" element={<RtoAgents />} />
        <Route path="/settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
      </Routes>
      <Footer />
      {!isWelcome && <AiAssistant />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestOnly><Auth /></GuestOnly>} />
      <Route path="/*" element={<RequireAuth><AppLayout /></RequireAuth>} />
    </Routes>
  );
}
