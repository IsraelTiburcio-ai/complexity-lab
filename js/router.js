/* ============================================================
   COMPLEXITY LAB · js/router.js
   Navegación entre pantallas con limpieza de recursos.
   ============================================================ */
(function (CL) {
  "use strict";

  const builders = {};
  let currentCleanup = null;
  let currentId = null;

  function register(id, builder) {
    builders[id] = builder;
  }

  /** Muestra una pantalla estática o dinámica. */
  function show(id, params) {
    const state = CL.State.get();
    const el = document.querySelector('[data-screen="' + id + '"]');
    if (!el) return;

    // limpieza
    if (currentCleanup) {
      try { currentCleanup(); } catch (e) { /* noop */ }
      currentCleanup = null;
    }

    document.querySelectorAll(".screen").forEach((s) => {
      s.hidden = true;
    });

    el.hidden = false;
    el.scrollTop = 0;
    currentId = id;
    state.screen = id;
    if (id === "home" && window.__refreshHome) window.__refreshHome();

    // HUD según pantalla
    const hud = document.getElementById("hud");
    if (hud) hud.hidden = id === "home";
    const sandBtn = document.getElementById("hud-sandbox");
    if (sandBtn) sandBtn.disabled = !state.progress.sandboxUnlocked;

    if (builders[id]) {
      currentCleanup = builders[id](el, params) || null;
    }
    CL.Storage.saveSoon();
  }

  function current() {
    return currentId;
  }

  function cleanup() {
    if (currentCleanup) {
      try { currentCleanup(); } catch (e) { /* noop */ }
      currentCleanup = null;
    }
  }

  CL.Router = {
    register: register,
    show: show,
    current: current,
    cleanup: cleanup
  };
})(window.ComplexityLab = window.ComplexityLab || {});
