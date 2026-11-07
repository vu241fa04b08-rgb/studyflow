import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => {
            let Icon = CheckCircle2;
            let bgClasses = 'bg-white text-slate-800 border-slate-200 shadow-xl';
            let iconColor = 'text-emerald-500';

            if (toast.type === 'error') {
              Icon = AlertCircle;
              iconColor = 'text-rose-500';
            } else if (toast.type === 'warning') {
              Icon = AlertTriangle;
              iconColor = 'text-amber-500';
            } else if (toast.type === 'info') {
              Icon = Info;
              iconColor = 'text-blue-500';
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${bgClasses}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 text-sm font-medium leading-relaxed">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors -mr-1 -mt-1 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
