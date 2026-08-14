/* ============================================================
   COMPLEXITY LAB · js/state.js
   Estado central del laboratorio.
   ============================================================ */
(function (CL) {
  "use strict";

  const DEFAULTS = {
    version: 4,
    // progreso de experimentos: { [expId]: {done:bool, steps?:int, totalSteps?:int} }
    progress: {
      experiments: {},
      challenges: {},
      final: {},
      sandboxUnlocked: false
    },
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalPoints: 0,
    achievements: [], // ids desbloqueados
    lastSeenAchievements: [],
    bestPrecision: null, // mejor % de precisión en predicciones
    hintsUsed: 0,
    currentExperiment: 0, // índice 0-4
    currentChallenge: null,
    screen: "home",
    tutorialSeen: false,
    // estadísticas acumuladas para logros
    stats: {
      linksCreated: 0,
      fullNetworks: 0,
      maxNodesBuilt: 0,
      exactPredictions: 0,
      case78Solved: false,
      finalCompleted: false,
      reachedTen: false,
      predictions: 0
    },
    settings: {
      sound: true,
      reducedMotion: null, // auto-detect
      labels: true,
      layout: "organic"
    },
    // configuración por pantalla (recuperar al continuar)
    lastLab: null
  };

  let state = null;

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function create() {
    return clone(DEFAULTS);
  }

  function load(raw) {
    const base = create();
    if (!raw || typeof raw !== "object") return base;
    // mezcla segura nivel a nivel
    if (raw.progress) {
      base.progress = Object.assign({}, base.progress, raw.progress);
      base.progress.experiments = Object.assign({}, base.progress.experiments, (raw.progress.experiments || {}));
      base.progress.challenges = Object.assign({}, base.progress.challenges, (raw.progress.challenges || {}));
      base.progress.final = Object.assign({}, base.progress.final, (raw.progress.final || {}));
    }
    if (raw.settings) base.settings = Object.assign({}, base.settings, raw.settings);
    if (raw.stats) base.stats = Object.assign({}, base.stats, raw.stats);
    ["score", "streak", "bestStreak", "totalPoints", "hintsUsed", "currentExperiment", "tutorialSeen", "bestPrecision"]
      .forEach((k) => {
        if (raw[k] !== undefined) base[k] = raw[k];
      });
    if (Array.isArray(raw.achievements)) base.achievements = raw.achievements.slice();
    if (Array.isArray(raw.lastSeenAchievements)) base.lastSeenAchievements = raw.lastSeenAchievements.slice();
    if (raw.currentChallenge != null) base.currentChallenge = raw.currentChallenge;
    if (raw.screen) base.screen = raw.screen;
    if (raw.lastLab) base.lastLab = raw.lastLab;
    return base;
  }

  function get() {
    if (!state) state = create();
    return state;
  }

  function set(s) {
    state = s;
  }

  function reset() {
    state = create();
    return state;
  }

  /** Detecta reduced motion según preferencia del sistema. */
  function detectReducedMotion() {
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  CL.State = {
    get: get,
    set: set,
    reset: reset,
    create: create,
    load: load,
    detectReducedMotion: detectReducedMotion
  };
})(window.ComplexityLab = window.ComplexityLab || {});
