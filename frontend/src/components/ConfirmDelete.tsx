import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDelete({
  open, title, message, confirmLabel = "Delete", busy, onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="confirm-delete-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="glass confirm-delete"
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 style={{ fontWeight: 800, marginBottom: 8 }}>{title}</h5>
            <p className="text-muted-2 mb-4" style={{ fontSize: ".92rem", marginBottom: 16 }}>{message}</p>
            <div className="d-flex gap-2 justify-content-end flex-wrap">
              <button type="button" className="btn-ghost btn-ghost--sm" onClick={onCancel} disabled={busy}>Cancel</button>
              <button type="button" className="btn-danger btn-ghost--sm" onClick={onConfirm} disabled={busy}>
                {busy ? "Removing…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
