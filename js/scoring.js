/* ============================================================
   COMPLEXITY LAB · js/scoring.js
   Puntuación ligera, racha de precisión y predicciones.
   - Desafío correcto al primer intento: +150
   - Predicción exacta: +200
   - Red completa: +250
   - Usar pista: −25
   ============================================================ */
(function (CL) {
  "use strict";

  const POINTS = {
    challengeFirst: 150,
    challengeRetry: 60,
    exactPrediction: 200,
    closePrediction: 60,
    fullNetwork: 250,
    hintCost: 25,
    experimentComplete: 100
  };

  function add(amount, reason) {
    const s = CL.State.get();
    s.score += amount;
    s.totalPoints += amount;
    CL.UI.flash && CL.UI.flash(document.getElementById("hud-score"));
    if (reason) CL.UI.toast && CL.UI.toast(reason, "info");
    CL.Storage.saveSoon();
    CL.Achievements.check();
    _syncHud();
  }

  /** Resuelve un desafío. streak = primer intento. */
  function challengeSolved(id, firstAttempt) {
    const s = CL.State.get();
    const def = CL.Challenges.get(id);
    const already = !!(s.progress.challenges[id] && s.progress.challenges[id].done);
    if (already) return 0;
    const base = firstAttempt ? POINTS.challengeFirst : POINTS.challengeRetry;
    const gained = _withStreak(base, true);
    s.progress.challenges[id] = Object.assign({}, s.progress.challenges[id] || {}, { done: true, firstAttempt: firstAttempt });
    s.progress.challenges[id].completedAt = Date.now();
    CL.Audio.play("complete");
    _syncHud();
    CL.Storage.saveSoon();
    CL.Achievements.check();
    return gained;
  }

  /** Predicción: exacta → +200 (racha), cercana → +60. */
  function prediction(guess, actual) {
    const s = CL.State.get();
    const diff = Math.abs(guess - actual);
    s.stats.predictions = (s.stats.predictions || 0) + 1;
    let gained;
    if (diff === 0) {
      s.stats.exactPredictions = (s.stats.exactPredictions || 0) + 1;
      gained = _withStreak(POINTS.exactPrediction, true);
    } else if (diff <= 3) {
      gained = _withStreak(POINTS.closePrediction, true);
    } else {
      _resetStreak();
      gained = 0;
    }
    _syncHud();
    CL.Storage.saveSoon();
    CL.Achievements.check();
    return { gained: gained, exact: diff === 0, diff: diff };
  }

  function fullNetwork() {
    const gained = _withStreak(POINTS.fullNetwork, false);
    const s = CL.State.get();
    s.stats.fullNetworks = (s.stats.fullNetworks || 0) + 1;
    _syncHud();
    CL.Storage.saveSoon();
    CL.Achievements.check();
    return gained;
  }

  function useHint() {
    const s = CL.State.get();
    s.hintsUsed = (s.hintsUsed || 0) + 1;
    s.score = Math.max(0, s.score - POINTS.hintCost);
    _syncHud();
    CL.Storage.saveSoon();
  }

  function experimentComplete(expId) {
    const s = CL.State.get();
    if (s.progress.experiments[expId] && s.progress.experiments[expId].done) return;
    s.progress.experiments[expId] = { done: true, completedAt: Date.now() };
    add(POINTS.experimentComplete, "Experimento completado +" + POINTS.experimentComplete);
    CL.Storage.saveSoon();
  }

  /** Aplica multiplicador de racha (×1 ×2 ×3 ×4). */
  function _withStreak(base, advance) {
    const s = CL.State.get();
    let mult = 1;
    if (advance) {
      s.streak = (s.streak || 0) + 1;
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
      mult = Math.min(4, s.streak);
    }
    const gained = base * mult;
    s.score += gained;
    s.totalPoints += gained;
    CL.Storage.saveSoon();
    CL.Achievements.check();
    return gained;
  }

  function _resetStreak() {
    const s = CL.State.get();
    s.streak = 0;
    _syncHud();
    CL.Storage.saveSoon();
  }

  function _syncHud() {
    const s = CL.State.get();
    const sc = document.getElementById("hud-score");
    const st = document.getElementById("hud-streak");
    if (sc) sc.textContent = s.score;
    if (st) st.textContent = "×" + Math.min(4, Math.max(1, s.streak));
  }

  CL.Scoring = {
    POINTS: POINTS,
    add: add,
    challengeSolved: challengeSolved,
    prediction: prediction,
    fullNetwork: fullNetwork,
    useHint: useHint,
    experimentComplete: experimentComplete,
    resetStreak: _resetStreak,
    syncHud: _syncHud
  };
})(window.ComplexityLab = window.ComplexityLab || {});
