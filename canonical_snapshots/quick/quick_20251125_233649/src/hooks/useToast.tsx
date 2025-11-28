import React, { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: number; text: string };
type Ctx = { notify: (text: string) => void };

const ToastCtx = createContext<Ctx>({ notify: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((text: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 5000);
  }, []);
  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div aria-live="assertive" role="status" className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className="rounded-xl shadow px-3 py-2 border bg-white">{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
