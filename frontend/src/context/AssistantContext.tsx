import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface AssistantContextValue {
  open: boolean;
  vehicleId: string | null;
  setVehicleId: (id: string | null) => void;
  openAssistant: (vehicleId?: string) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  const openAssistant = useCallback((vid?: string) => {
    if (vid) setVehicleId(vid);
    setOpen(true);
  }, []);

  const closeAssistant = useCallback(() => setOpen(false), []);

  const toggleAssistant = useCallback(() => setOpen((o) => !o), []);

  return (
    <AssistantContext.Provider value={{ open, vehicleId, setVehicleId, openAssistant, closeAssistant, toggleAssistant }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used within AssistantProvider");
  return ctx;
}
