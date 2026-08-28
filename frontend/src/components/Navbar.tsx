import { NavLink, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import BrandName from "./BrandName";

const PRIMARY = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/garage", label: "My Garage" },
  { to: "/documents", label: "Documents" },
  { to: "/challans", label: "Challans" },
];

const MORE = [
  { to: "/buy", label: "Buy" },
  { to: "/rto", label: "RTO Services" },
  { to: "/agents", label: "RTO Agents" },
  { to: "/maintenance", label: "Maintenance" },
];

const ALL = [...PRIMARY, ...MORE];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const onWelcome = loc.pathname === "/welcome";
  const moreActive = MORE.some((l) => loc.pathname.startsWith(l.to));

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <nav className="nav">
      <div className="container nav__bar">
        <Link to="/dashboard" className="nav__brand">
          <span className="nav__logo" aria-hidden>🚗</span>
          <span><BrandName /></span>
        </Link>

        {!onWelcome && (
          <>
            <div className="nav__links d-none d-lg-flex">
              <div className="nav__links-scroll">
                {PRIMARY.map((l) => (
                  <NavLink key={l.to} to={l.to} className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
                    {l.label}
                  </NavLink>
                ))}
              </div>
              <div className="nav__more" ref={moreRef}>
                <button
                  type="button"
                  className={`navlink nav__more-btn ${moreActive ? "active" : ""}`}
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                >
                  More ▾
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      className="nav__dropdown"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                    >
                      {MORE.map((l) => (
                        <NavLink
                          key={l.to}
                          to={l.to}
                          role="menuitem"
                          className={({ isActive }) => `nav__dropdown-link ${isActive ? "active" : ""}`}
                          onClick={() => setMoreOpen(false)}
                        >
                          {l.label}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="nav__actions d-none d-lg-flex">
              {user && <span className="pill nav__user">👋 {user.name.split(" ")[0]}{isAdmin ? " · Admin" : ""}</span>}
              {isAdmin && (
                <NavLink to="/settings" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`} title="LLM Admin Settings">
                  ⚙️ LLM
                </NavLink>
              )}
              <Link to="/garage" className="btn-grad btn-grad--sm">+ Add Vehicle</Link>
              <button type="button" className="btn-ghost btn-ghost--sm" onClick={logout}>Log out</button>
            </div>
          </>
        )}

        {onWelcome && (
          <div className="nav__actions d-none d-lg-flex">
            <a href="#features" className="navlink">Features</a>
            <a href="#lifecycle" className="navlink">Lifecycle</a>
            <a href="#agents" className="navlink">AI Agents</a>
            <Link to="/dashboard" className="btn-grad btn-grad--sm">Launch App →</Link>
          </div>
        )}

        <button type="button" className="nav__menu-btn d-lg-none" onClick={() => setOpen((o) => !o)} aria-label="Open menu">
          ☰
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav__mobile d-lg-none"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="container nav__mobile-inner">
              {(onWelcome ? [{ to: "/dashboard", label: "Launch App" }] : ALL).map((l) => (
                <NavLink key={l.to} to={l.to} className="navlink" onClick={() => setOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
              {!onWelcome && isAdmin && (
                <NavLink to="/settings" className="navlink" onClick={() => setOpen(false)}>⚙️ LLM Settings</NavLink>
              )}
              {!onWelcome && (
                <button type="button" className="navlink nav__mobile-logout" onClick={() => { logout(); setOpen(false); }}>
                  Log out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
