import { useEffect, useState } from "react";

export type SnackbarKind = "success" | "error";

export type SnackbarMessage = {
  id: number;
  message: string;
  kind: SnackbarKind;
};

type SnackbarProps = {
  snackbar: SnackbarMessage;
  onClose: () => void;
};

const displayMs = 2600;
const exitMs = 220;

export function Snackbar({ snackbar, onClose }: SnackbarProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setIsClosing(false);

    const closeTimer = window.setTimeout(() => {
      setIsClosing(true);
    }, displayMs);

    const removeTimer = window.setTimeout(() => {
      onClose();
    }, displayMs + exitMs);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [onClose, snackbar.id]);

  const close = () => {
    setIsClosing(true);
    window.setTimeout(onClose, exitMs);
  };

  return (
    <div className={`snackbar snackbar-${snackbar.kind} ${isClosing ? "is-closing" : ""}`} role="status" aria-live="polite">
      <span>{snackbar.message}</span>
      <button type="button" className="snackbar-close" aria-label="通知を閉じる" onClick={close}>
        ×
      </button>
    </div>
  );
}
