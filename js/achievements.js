/* ============================================================
   COMPLEXITY LAB · js/achievements.js
   Lógica de logros: verificación, toasts, sala de logros.
   ============================================================ */
(function (CL) {
  "use strict";

  function unlocked(id) {
    return CL.State.get().achievements.indexOf(id) !== -1;
  }

  /** Verifica todos los logros y desbloquea los pendientes. */
  function check() {
    const s = CL.State.get();
    const defs = CL.Achievements.DEFS;
    const fresh = [];
    defs.forEach((def) => {
      if (unlocked(def.id)) return;
      let ok = false;
      try { ok = def.check(s); } catch (e) { ok = false; }
      if (ok) {
        s.achievements.push(def.id);
        s.score += def.points;
        s.totalPoints += def.points;
        fresh.push(def);
      }
    });
    if (fresh.length) {
      CL.Audio.play("achievement");
      CL.Storage.saveSoon();
      setTimeout(() => {
        fresh.forEach((a) => {
          CL.UI.achievementToast(a);
        });
      }, 250);
      // marcar como vistos para el contador
      s.lastSeenAchievements = s.achievements.slice();
      CL.Scoring.syncHud();
      CL.Storage.saveSoon();
    }
    return fresh;
  }

  function renderHall(container) {
    const s = CL.State.get();
    container.innerHTML = "";
    const grid = CL.UI.el("div", { class: "ach-grid" });
    CL.Achievements.DEFS.forEach((def) => {
      const got = unlocked(def.id);
      const card = CL.UI.el("button", {
        class: "ach-card" + (got ? "" : " is-locked"),
        html: '<span class="ach-ico">' + CL.UI.icon(def.icon, 22) + "</span>" +
          '<span class="ach-name">' + (got ? def.name : "???") + "</span>" +
          '<span class="ach-desc">' + (got ? def.description : "Logro por descubrir") + "</span>" +
          '<span class="ach-pts">' + (got ? "+" + def.points + " pts" : "") + "</span>"
      });
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  CL.Achievements.check = check;
  CL.Achievements.renderHall = renderHall;
  CL.Achievements.unlocked = unlocked;
})(window.ComplexityLab = window.ComplexityLab || {});
