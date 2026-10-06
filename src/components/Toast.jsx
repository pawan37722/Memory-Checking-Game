import { useEffect } from "react";

export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return <div className={`toast toast-${toast.type}`}>{toast.message}</div>;
}
