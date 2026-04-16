import React, { useEffect, useState } from 'react';
import useToastStore from '../../stores/toastStore';

const TOAST_STYLES = {
  success: {
    bg: 'bg-jungle',
    border: 'border-jungle-dark',
    text: 'text-cream',
    icon: '\u2713',
  },
  error: {
    bg: 'bg-terracotta',
    border: 'border-terracotta-dark',
    text: 'text-cream',
    icon: '\u2717',
  },
  warning: {
    bg: 'bg-mustard',
    border: 'border-mustard-dark',
    text: 'text-vintage-text',
    icon: '!',
  },
  info: {
    bg: 'bg-teal',
    border: 'border-teal-dark',
    text: 'text-cream',
    icon: 'i',
  },
};

const Toast = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false);
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  const handleRemove = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => setExiting(true), toast.duration - 200);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border-3 shadow-vintage
        ${style.bg} ${style.border} ${style.text}
        transition-all duration-200
        ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
        {style.icon}
      </span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-ui uppercase tracking-wide text-sm font-bold">{toast.title}</p>
        )}
        <p className="font-serif text-sm">{toast.message}</p>
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 opacity-70 hover:opacity-100 text-lg leading-none mt-0.5"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
};

const ConfirmDialog = () => {
  const confirmDialog = useToastStore((s) => s.confirmDialog);
  const resolveConfirm = useToastStore((s) => s.resolveConfirm);

  if (!confirmDialog) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-vintage-text bg-opacity-50 z-[60]"
        onClick={() => resolveConfirm(false)}
      />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-cream border-3 border-vintage-text rounded-lg shadow-vintage max-w-md w-full p-6">
          <h3 className="font-poster text-2xl text-vintage-text mb-3">
            {confirmDialog.title}
          </h3>
          <p className="font-serif text-vintage-text mb-6">
            {confirmDialog.message}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => resolveConfirm(false)}
              className="px-5 py-2 font-ui uppercase tracking-wide text-sm border-3 border-vintage-text rounded bg-transparent text-vintage-text shadow-vintage hover:bg-sand hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-vintage-pressed transition-all duration-150"
            >
              {confirmDialog.cancelLabel}
            </button>
            <button
              onClick={() => resolveConfirm(true)}
              className="px-5 py-2 font-ui uppercase tracking-wide text-sm border-3 border-terracotta-dark rounded bg-terracotta text-cream shadow-vintage hover:shadow-vintage-hover hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-vintage-pressed transition-all duration-150"
              autoFocus
            >
              {confirmDialog.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const ToastContainer = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <>
      <ConfirmDialog />
      <div className="fixed top-4 right-4 z-[55] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
};

export default ToastContainer;
