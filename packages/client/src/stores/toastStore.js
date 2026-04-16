import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
  toasts: [],
  confirmDialog: null,

  addToast: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    const toast = { id, type, title, message, duration };

    set({ toasts: [...get().toasts, toast] });

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  // Replacement for window.confirm() — returns a Promise<boolean>
  confirm: (message, { title = 'Confirm', confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = {}) => {
    return new Promise((resolve) => {
      set({
        confirmDialog: { title, message, confirmLabel, cancelLabel, resolve }
      });
    });
  },

  resolveConfirm: (result) => {
    const { confirmDialog } = get();
    if (confirmDialog) {
      confirmDialog.resolve(result);
      set({ confirmDialog: null });
    }
  },

  // Convenience methods
  success: (message, title) => get().addToast({ type: 'success', title, message }),
  error: (message, title) => get().addToast({ type: 'error', title, message, duration: 6000 }),
  warning: (message, title) => get().addToast({ type: 'warning', title, message, duration: 5000 }),
  info: (message, title) => get().addToast({ type: 'info', title, message }),
}));

export default useToastStore;
