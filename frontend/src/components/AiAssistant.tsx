import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api, type ChatResponse, type ActionCard, type Vehicle } from "../api";
import { useAssistant } from "../context/AssistantContext";
import { useAuth } from "../context/AuthContext";
import { buildGarageWelcome, buildVehicleWelcome, garageSuggestions, vehicleSuggestions } from "../lib/assistantMessages";
import ChatMessageBody from "./ChatMessageBody";

interface Msg { role: "user" | "assistant"; content: string; res?: ChatResponse; }

export default function AiAssistant() {
  const { open, vehicleId, toggleAssistant, closeAssistant } = useAssistant();
  const { user } = useAuth();
  const userName = user?.name?.split(" ")[0] ?? "there";
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingCtx, setLoadingCtx] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const bodyRef = useRef<HTMLDivElement>(null);
  const ctxKey = useRef("");

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  // Reload greeting + suggestions whenever the active vehicle context changes.
  useEffect(() => {
    const key = vehicleId ?? "__garage__";
    if (key === ctxKey.current && msgs.length > 0) return;
    ctxKey.current = key;

    let cancelled = false;
    setLoadingCtx(true);

    (async () => {
      try {
        if (vehicleId) {
          const { data } = await api.get<{ vehicle: Vehicle }>(`/vehicles/${vehicleId}`);
          if (cancelled) return;
          setVehicle(data.vehicle);
          setMsgs([{ role: "assistant", content: buildVehicleWelcome(data.vehicle, userName) }]);
          setSuggestions(vehicleSuggestions(data.vehicle));
        } else {
          const { data } = await api.get<Vehicle[]>("/vehicles");
          if (cancelled) return;
          setVehicle(null);
          setMsgs([{ role: "assistant", content: buildGarageWelcome(data, userName) }]);
          setSuggestions(garageSuggestions());
        }
      } catch {
        if (!cancelled) {
          setVehicle(null);
          setMsgs([{ role: "assistant", content: "Hi! Ask me anything about your vehicles." }]);
          setSuggestions(garageSuggestions());
        }
      } finally {
        if (!cancelled) setLoadingCtx(false);
      }
    })();

    return () => { cancelled = true; };
  }, [vehicleId]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy || loadingCtx) return;
    setInput("");
    const history = msgs.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const { data } = await api.post<ChatResponse>("/ai/chat", {
        message: q,
        vehicle_id: vehicleId || undefined,
        history,
      });
      setMsgs((m) => [...m, { role: "assistant", content: data.reply, res: data }]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "I couldn't reach the AI service. Please make sure the backend is running." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const goAction = (a: ActionCard) => {
    if (a.route) {
      closeAssistant();
      nav(a.route.split("#")[0]);
    }
  };

  const contextLabel = vehicle
    ? `${vehicle.emoji} ${vehicle.make} ${vehicle.model}`
    : "Whole garage";

  return (
    <>
      <motion.button
        type="button"
        className="chat-fab"
        onClick={toggleAssistant}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={open ? {} : { boxShadow: ["0 14px 40px rgba(139,92,246,.55)", "0 14px 55px rgba(34,211,238,.65)", "0 14px 40px rgba(139,92,246,.55)"] }}
        transition={{ repeat: Infinity, duration: 2.4 }}
        aria-label="Ask Vehicle AI"
      >
        {open ? "✕" : "✨"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel glass"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--grad)", display: "grid", placeContent: "center", fontSize: "1.2rem" }}>✨</div>
                <div>
                  <div style={{ fontWeight: 700 }}>Vehicle AI</div>
                  <div className="text-muted-2" style={{ fontSize: ".75rem" }}>Agentic • context-aware</div>
                </div>
                <span className="pill ms-auto" style={{ fontSize: ".7rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--green)", display: "inline-block" }} /> Online
                </span>
              </div>
              <div className="mt-2">
                <span className="pill" style={{ fontSize: ".68rem" }}>
                  🎯 Context: <b>{contextLabel}</b>
                  {vehicle && <span className="text-muted-2 ms-1">· {vehicle.registration_number}</span>}
                </span>
              </div>
            </div>

            <div className="chat-body" ref={bodyRef}>
              {loadingCtx && (
                <div className="bubble ai text-muted-2">Loading vehicle context…</div>
              )}
              {msgs.map((m, i) => (
                <div key={i}>
                  <motion.div
                    className={`bubble ${m.role === "user" ? "user" : "ai"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {m.role === "assistant" && m.res && (
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        <span className="pill" style={{ fontSize: ".68rem" }}>🧠 {m.res.agent} · {m.res.intent}</span>
                        {m.res.used_search && (
                          <span className="pill" style={{ fontSize: ".68rem", background: "rgba(52,211,153,.15)", color: "var(--green)", borderColor: "transparent" }}>🌐 Live web</span>
                        )}
                      </div>
                    )}
                    {m.role === "assistant" ? (
                      <ChatMessageBody text={m.content} />
                    ) : (
                      m.content
                    )}
                    {m.role === "assistant" && m.res?.sources?.length ? (
                      <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="text-muted-2" style={{ fontSize: ".68rem", marginBottom: 4 }}>Sources</div>
                        {m.res.sources.map((s, k) => (
                          <a key={k} href={s.url} target="_blank" rel="noreferrer" className="d-block link-underline" style={{ fontSize: ".72rem", color: "var(--cyan)" }}>
                            🔗 {s.title || s.url}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                  {m.res?.actions?.length ? (
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {m.res.actions.map((a, j) => (
                        <button key={j} type="button" className="chip" onClick={() => goAction(a)}>
                          {a.icon} {a.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {busy && (
                <div className="bubble ai typing">
                  <span /><span /><span />
                </div>
              )}
              {!loadingCtx && msgs.length <= 1 && suggestions.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {suggestions.map((s) => (
                    <button key={s} type="button" className="chip" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 d-flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <input
                className="form-control"
                placeholder={vehicle ? `Ask about your ${vehicle.make} ${vehicle.model}…` : "Ask about your garage…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
              />
              <button type="button" className="btn-grad px-3" onClick={() => send(input)} disabled={busy || loadingCtx}>➤</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
