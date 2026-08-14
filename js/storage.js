/* ============================================================
   COMPLEXITY LAB · js/storage.js
   Persistencia en localStorage.
   ============================================================ */
(function (CL) {
  "use strict";

  const KEY = "complexityLab.save.v4";

  let saveTimer = null;

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(CL.State.get()));
    } catch (e) {
      // almacenamiento no disponible
    }
  }

  /** Guarda con debounce para no saturar el almacenamiento. */
  function saveSoon() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      save();
    }, 120);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return CL.State.load(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) { /* noop */ }
  }

  function hasProgress() {
    const s = CL.State.get();
    return s.score > 0 || Object.keys(s.progress.experiments).length > 0 ||
      Object.keys(s.progress.challenges).length > 0 || s.achievements.length > 0;
  }

  CL.Storage = {
    save: save,
    saveSoon: saveSoon,
    load: load,
    clear: clear,
    hasProgress: hasProgress,
    KEY: KEY
  };
})(window.ComplexityLab = window.ComplexityLab || {});
