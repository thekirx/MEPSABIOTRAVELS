/**
 * Pauses saving to LocalStorage. Used to save multi-step actions once, and to
 * apply changes from another tab without echoing them back (which could
 * overwrite that tab's newer save).
 */
export const persistGate = { paused: false };
export const gatedLocalStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    if (!persistGate.paused) localStorage.setItem(key, value);
  },
  removeItem: (key: string) => localStorage.removeItem(key),
};
