/* ============================================================
   COMPLEXITY LAB · js/app.js
   Arranque, navegación, home, intro animada, tutorial,
   mapa de progreso y cableado del HUD.
   ============================================================ */
(function (CL) {
  "use strict";

  const $ = CL.UI.el;

  /* ============================================================
     API compartida para pantallas
     ============================================================ */
  function makeApi() {
    return {
      state: CL.State.get(),
      goMap: () => CL.Router.show("progress"),
      goExperiment: (index, opts) => {
        CL.State.get().currentExperiment = index;
        CL.Router.show("experiment", { index: index, opts: opts });
      },
      goToExperiment: (oneBasedIndex, opts) => {
        const state = CL.State.get();
        state.currentExperiment = oneBasedIndex - 1;
        CL.Router.show("experiment", { index: oneBasedIndex - 1, opts: opts });
      },
      markExperimentDone: (expId) => {
        const prev = CL.State.get().progress.experiments[expId];
        if (prev && prev.done) return;
        CL.Scoring.experimentComplete(expId);
        CL.UI.toast("Experimento completado. <b>+" + CL.Scoring.POINTS.experimentComplete + " pts</b>", "ok");
        refreshProgressMap();
      },
      notifyDone: () => { /* usada por experimentos para efectos extra */ },
      goChallengeHub: () => CL.Router.show("challenge", { hub: true }),
      openChallenge: (id) => CL.Router.show("challenge", { id: id }),
      onChallengeSuccess: (def) => {
        const s = CL.State.get();
        const doneCount = Object.keys(s.progress.challenges).filter((k) => s.progress.challenges[k].done).length;
        const total = CL.Challenges.DEFS.length;
        CL.Audio.play("complete");
        CL.UI.modal({
          title: "DESAFÍO SUPERADO",
          html: "<p>" + def.success + "</p>" +
            "<p>Logros: <b>" + doneCount + "/" + total + "</b></p>",
          buttons: [
            { label: "Volver a la cámara", onClick: () => CL.Router.show("challenge", { hub: true }) },
            {
              label: doneCount >= total ? "Ver resultados" : "Siguiente desafío →",
              primary: true,
              onClick: () => {
                if (doneCount >= total) CL.Router.show("results");
                else {
                  const next = CL.Challenges.DEFS.find((c) => !(s.progress.challenges[c.id] && s.progress.challenges[c.id].done));
                  if (next) CL.Router.show("challenge", { id: next.id });
                  else CL.Router.show("challenge", { hub: true });
                }
              }
            }
          ]
        });
      },
      goResults: () => CL.Router.show("results"),
      goSandbox: () => CL.Router.show("sandbox")
    };
  }

  /* ============================================================
     Pantalla EXPERIMENTO
     ============================================================ */
  function buildExperimentScreen(host, params) {
    const api = makeApi();
    const index = params && params.index !== undefined ? params.index : (CL.State.get().currentExperiment || 0);
    const opts = params && params.opts;
    const container = document.getElementById("experiment-host");
    return CL.ExperimentsHost.build(container, index, api, opts);
  }

  /* ============================================================
     Pantalla DESAFÍO (hub o reto)
     ============================================================ */
  function buildChallengeScreen(host, params) {
    const api = makeApi();
    const container = document.getElementById("challenge-host");
    if (params && params.hub) {
      container.innerHTML = "";
      const wrap = $("div", { class: "wrap-center" });
      const head = $("header", { class: "screen-head" });
      head.append(
        $("h2", { html: "CÁMARA DE <span>DESAFÍOS</span>" }),
        $("p", { class: "screen-sub", html: "Retos interactivos para poner a prueba tu intuición" })
      );
      const backRow = $("div", { class: "btn-row", style: { marginBottom: "12px" } });
      const back = $("button", { class: "btn btn-ghost", html: "◀ Volver" });
      back.addEventListener("click", () => CL.Router.show("progress"));
      backRow.appendChild(back);
      const grid = $("div", { class: "ach-grid" });
      wrap.append(head, backRow, grid);
      container.appendChild(wrap);
      CL.ChallengesHost.renderHub(grid, api);
      return () => {};
    }
    const id = params.id;
    CL.State.get().currentChallenge = id;
    return CL.ChallengesHost.build(container, id, api);
  }

  /* ============================================================
     Pantalla FINAL + RESULTADOS + SANDBOX
     ============================================================ */
  function buildFinalScreen(host) {
    return CL.FinalHost.build(document.getElementById("final-host"), makeApi());
  }
  function buildResultsScreen(host) {
    CL.FinalHost.renderResults(document.getElementById("results-host"), makeApi());
    return () => {};
  }
  function buildSandboxScreen(host) {
    return CL.Sandbox.build(document.getElementById("sandbox-host"), makeApi());
  }

  /* ============================================================
     Mapa de progreso
     ============================================================ */
  const EXPERIMENT_ORDER = ["elements", "relations", "order", "compare", "synergy"];

  function experimentStatus(expId) {
    const s = CL.State.get();
    return s.progress.experiments[expId] && s.progress.experiments[expId].done;
  }

  function refreshProgressMap() {
    const host = document.getElementById("progress-map");
    if (!host || CL.Router.current() !== "progress") return;
    renderProgressMap(host);
  }

  function renderProgressMap(host) {
    const s = CL.State.get();
    host.innerHTML = "";
    const stations = [];
    CL.Experiments.DEFS.forEach((def, i) => {
      const done = experimentStatus(def.id);
      const unlocked = done || i === 0 || experimentStatus(EXPERIMENT_ORDER[i - 1]);
      const isCurrent = !done && unlocked;
      stations.push({
        num: def.num, name: def.short, desc: def.tagline, icon: def.icon,
        state: done ? "done" : unlocked ? "current" : "locked",
        current: isCurrent, done: done, unlocked: unlocked,
        click: () => { if (unlocked) CL.Router.show("experiment", { index: i }); }
      });
    });
    const chDone = Object.keys(s.progress.challenges).filter((k) => s.progress.challenges[k].done).length;
    const chTotal = CL.Challenges.DEFS.length;
    const chUnlocked = experimentStatus("synergy");
    stations.push({
      num: "06", name: "Cámara de desafíos", desc: chDone + "/" + chTotal + " superados", icon: "target",
      state: chDone === chTotal ? "done" : chUnlocked ? "current" : "locked",
      current: chUnlocked && chDone < chTotal, done: chDone === chTotal, unlocked: chUnlocked,
      click: () => { if (chUnlocked) CL.Router.show("challenge", { hub: true }); }
    });
    const finDone = s.progress.final && s.progress.final.done;
    stations.push({
      num: "07", name: "Protocolo Caos", desc: "Experimento final", icon: "bolt",
      state: finDone ? "done" : chDone === chTotal ? "current" : "locked",
      current: chDone === chTotal && !finDone, done: finDone, unlocked: chDone === chTotal,
      click: () => { if (chDone === chTotal) CL.Router.show("final"); }
    });
    const sandUnlocked = s.progress.sandboxUnlocked;
    stations.push({
      num: "08", name: "Modo Libre", desc: sandUnlocked ? "Disponible" : "Completa el Protocolo Caos", icon: "sandbox",
      state: sandUnlocked ? "done" : "locked", done: sandUnlocked, unlocked: sandUnlocked,
      click: () => { if (sandUnlocked) CL.Router.show("sandbox"); }
    });

    stations.forEach((st) => {
      const row = $("div", {
        class: "pstation" + (st.done ? " is-done" : st.locked === false && !st.done && st.unlocked ? " is-current" : " is-locked"),
        tabindex: st.unlocked ? "0" : "-1",
        role: st.unlocked ? "button" : "listitem",
        "aria-label": st.name + (st.done ? " completado" : st.unlocked ? " disponible" : " bloqueado")
      });
      const num = $("span", { class: "p-num", html: st.num });
      const ico = $("span", { class: "p-ico", html: CL.UI.icon(st.icon, 20) });
      const body = $("span", { class: "p-body" });
      body.append($("span", { class: "p-name", html: st.name }), $("span", { class: "p-desc", html: st.desc }));
      const status = $("span", {
        class: "p-status",
        html: st.done ? "✓ COMPLETADO" : st.unlocked ? (st.current ? "EN CURSO" : "DISPOIBLE") : "🔒"
      });
      row.append(num, ico, body, status);
      if (st.unlocked) row.addEventListener("click", st.click);
      row.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && st.unlocked) { e.preventDefault(); st.click(); }
      });
      host.appendChild(row);
    });

    // estadísticas
    const stats = document.getElementById("progress-stats");
    if (stats) {
      stats.innerHTML = "";
      const doneExp = EXPERIMENT_ORDER.filter(experimentStatus).length;
      const pct = Math.round((doneExp / 5) * 100);
      const statsArr = [
        [doneExp + "/5", "EXPERIMENTOS"],
        [chDone + "/" + chTotal, "DESAFÍOS"],
        [pct + "%", "PROGRESO GENERAL"],
        [s.score, "PUNTOS"]
      ];
      statsArr.forEach((c) => {
        const cell = $("div", { class: "stat-cell" });
        cell.append($("span", { class: "stat-label", html: c[1] }), $("span", { class: "stat-value", html: c[0] }));
        stats.appendChild(cell);
      });
    }
  }

  /* ============================================================
     Pantalla LOGROS
     ============================================================ */
  function buildAchievementsScreen(host) {
    CL.Achievements.renderHall(document.getElementById("ach-grid"));
    return () => {};
  }

  /* ============================================================
     TUTORIAL
     ============================================================ */
  function buildTutorialScreen(host) {
    const container = document.getElementById("tutorial-host");
    container.innerHTML = "";
    const api = makeApi();
    const step = { v: 1 };
    const box = $("div", { class: "panel-card", style: { padding: "18px" } });

    const coach = $("div", { class: "coach" });
    const reactorWrap = $("div", {
      style: { height: "230px", margin: "12px 0", borderRadius: "16px", overflow: "hidden", position: "relative",
        border: "1px solid var(--line)", background: "radial-gradient(ellipse at center, rgba(16,26,58,0.5), rgba(5,8,20,0.7))" }
    });
    const actions = $("div", { class: "btn-row", style: { justifyContent: "center", marginTop: "6px" } });
    const progress = $("div", { class: "step-track", style: { justifyContent: "center", marginTop: "12px" } });

    box.append(coach, reactorWrap, actions, progress);
    container.appendChild(box);

    const net = CL.Network.create(reactorWrap, {
      labels: true, heat: false, layout: "circular", interactive: true, mode: "inspect", edgesAllowed: false
    });
    net.setNodes(1);

    let n = 1;

    function render() {
      actions.innerHTML = "";
      progress.innerHTML = "";
      for (let i = 1; i <= 4; i++) {
        progress.appendChild($("span", { class: "step-dot" + (i < step.v ? " is-done" : i === step.v ? " is-current" : "") }));
      }
      if (step.v === 1) {
        coach.innerHTML = "<b>Paso 1.</b> Un sistema empieza con elementos. Toca <strong>AGREGAR</strong> para sumar elementos a la red.";
        const add = $("button", { class: "btn btn-primary", html: CL.UI.icon("plus", 14) + " AGREGAR ELEMENTO" });
        const next = $("button", { class: "btn btn-ghost", html: "Paso 2 →" });
        add.addEventListener("click", () => {
          if (n < 4) {
            n++;
            net.setNodes(n);
            CL.Audio.play("nodeAdd");
            if (n >= 4) coach.innerHTML = "<b>Paso 1 ✓.</b> Tienes " + n + " elementos. Ahora veamos las relaciones.";
          }
        });
        next.addEventListener("click", () => { step.v = 2; render(); });
        actions.append(add, next);
      } else if (step.v === 2) {
        coach.innerHTML = "<b>Paso 2.</b> Para crear una relación, pulsa un elemento y después otro: <strong>E" + (n || 1) + " → E" + ((n || 1) % 3 + 1) + "</strong>.";
        net.setMode("link");
        net.setEdges([]);
        net.opts.edgesAllowed = true;
        net.opts.onLink = (a, b) => {
          if (net.addEdge(a, b, { animate: true })) {
            CL.Audio.play("link");
            coach.innerHTML = "<b>¡Enlace creado!</b> E" + a + " y E" + b + " ahora están relacionados. Una línea entre dos nodos.";
            return true;
          }
          return false;
        };
        const next = $("button", { class: "btn btn-ghost", html: "Paso 3 →" });
        next.addEventListener("click", () => { step.v = 3; render(); });
        actions.appendChild(next);
      } else if (step.v === 3) {
        coach.innerHTML = "<b>Paso 3.</b> El <strong>control deslizante</strong> cambia la cantidad de elementos y la red se reorganiza sola.";
        const slider = CL.LabPanel.sliderEl({
          min: 1, max: 8, value: 3, label: "ELEMENTOS",
          onInput: (v) => { net.setNodes(v); net.completeAll({ animate: true }); n = v; }
        });
        net.setNodes(3);
        net.completeAll({ animate: true });
        const next = $("button", { class: "btn btn-ghost", html: "Paso 4 →" });
        next.addEventListener("click", () => { step.v = 4; render(); });
        actions.append(slider, next);
      } else {
        coach.innerHTML = "<b>Paso 4.</b> Cada cambio actualiza el <strong>analizador matemático</strong>.<br/>" +
          "Con " + (n || 3) + " elementos: R = " + (n || 3) + "(" + ((n || 3) - 1) + ")/2 = <b>" + CL.Math.maxRelations(n || 3) + "</b> relaciones máximas.";
        const formula = CL.LabPanel.formulaEl();
        CL.LabPanel.updateFormula(formula, n || 3, CL.Math.maxRelations(n || 3), { animate: false });
        actions.appendChild(formula);
        const done = $("button", { class: "btn btn-primary btn-lg", html: "¡A EXPERIMENTAR!" });
        done.addEventListener("click", () => {
          CL.State.get().tutorialSeen = true;
          CL.Storage.saveSoon();
          CL.Router.show("experiment", { index: 0 });
        });
        actions.appendChild($("div", { class: "btn-row", style: { width: "100%", justifyContent: "center" }, children: [done] }));
      }
    }
    render();

    return () => { net.destroy(); };
  }

  /* ============================================================
     INTRO ANIMADA
     ============================================================ */
  function buildIntroScreen(host) {
    const reduced = CL.State.detectReducedMotion();
    const reactorHost = document.getElementById("intro-reactor");
    reactorHost.innerHTML = "";
    const head = document.getElementById("intro-head");
    const count = document.getElementById("intro-count");
    const sub = document.getElementById("intro-sub");
    const stage = reactorHost.closest(".intro-stage");
    let discoverBtn = null;

    const net = CL.Network.create(reactorHost, {
      labels: true, heat: false, layout: "circular", interactive: false, edgesAllowed: false
    });

    function showQuestion() {
      head.innerHTML = "¿POR QUÉ CRECE TAN RÁPIDO?";
      head.style.color = "var(--complex)";
      count.style.display = "none";
      sub.style.display = "none";
      if (!discoverBtn) {
        discoverBtn = $("button", { class: "btn btn-complex btn-lg", html: "DESCUBRIRLO" });
        discoverBtn.addEventListener("click", () => {
          const s = CL.State.get();
          if (s.tutorialSeen) CL.Router.show("experiment", { index: 0 });
          else CL.Router.show("tutorial");
        });
        stage.appendChild(discoverBtn);
      }
      CL.Audio.play("achievement");
    }

    function stage1() {
      net.setNodes(2);
      net.completeAll({ animate: true });
      net.pulseAll(0.2);
      head.innerHTML = "CONECTANDO EL SISTEMA…";
      count.textContent = "2 elementos";
      count.style.fontSize = "30px";
      sub.innerHTML = "<b>1 relación</b>";
      if (reduced) { showQuestion(); return; }
      setTimeout(stage2, 1600);
    }
    function stage2() {
      net.setNodes(5);
      net.completeAll({ animate: true });
      net.pulseAll(0.06);
      count.textContent = "5 elementos";
      sub.innerHTML = "<b>10 relaciones</b>";
      setTimeout(stage3, 1600);
    }
    function stage3() {
      net.setNodes(10);
      net.completeAll({ animate: true });
      net.pulseAll(0.02);
      count.textContent = "10 elementos";
      sub.innerHTML = "<b>45 relaciones</b>";
      setTimeout(showQuestion, 1800);
    }

    stage1();
    return () => { net.destroy(); };
  }

  /* ============================================================
     HOME
     ============================================================ */
  function wireHome() {
    const btnStart = document.getElementById("btn-start");
    const btnContinue = document.getElementById("btn-continue");
    const btnInstructions = document.getElementById("btn-instructions");
    const btnMap = document.getElementById("btn-map");
    const btnSound = document.getElementById("btn-sound-home");
    const btnReset = document.getElementById("btn-reset");
    const btnCredits = document.getElementById("btn-credits");

    function refreshHomeButtons() {
      btnContinue.hidden = !CL.Storage.hasProgress();
    }
    window.__refreshHome = refreshHomeButtons;

    btnStart.addEventListener("click", () => {
      CL.Audio.play("click");
      CL.Router.show("intro");
    });
    btnContinue.addEventListener("click", () => {
      CL.Audio.play("click");
      const s = CL.State.get();
      if (s.progress.final && s.progress.final.done) CL.Router.show("progress");
      else if (!s.tutorialSeen) CL.Router.show("tutorial");
      else CL.Router.show("experiment", { index: s.currentExperiment || 0 });
    });
    btnInstructions.addEventListener("click", () => {
      CL.Audio.play("click");
      CL.Router.show("tutorial");
    });
    btnMap.addEventListener("click", () => {
      CL.Audio.play("click");
      CL.Router.show("progress");
    });

    function updateSoundUI() {
      const on = CL.State.get().settings.sound;
      btnSound.innerHTML = (on ? "🔊" : "🔇") + " Sonido: " + (on ? "activado" : "desactivado");
    }
    updateSoundUI();
    btnSound.addEventListener("click", () => {
      const s = CL.State.get();
      s.settings.sound = !s.settings.sound;
      CL.Storage.saveSoon();
      updateSoundUI();
      updateHudSoundIcon();
      if (s.settings.sound) CL.Audio.play("click");
    });

    btnReset.addEventListener("click", () => {
      CL.UI.confirmModal({
        title: "REINICIAR LABORATORIO",
        message: "Se borrará todo el progreso: experimentos, desafíos, puntos y logros. Esta acción no se puede deshacer.",
        okLabel: "Sí, reiniciar",
        onOk: () => {
          CL.Storage.clear();
          CL.State.reset();
          location.reload();
        }
      });
    });

    btnCredits.addEventListener("click", () => {
      CL.UI.modal({
        title: "COMPLEXITY LAB",
        html:
          "<p><b>Laboratorio de Complejidad de Sistemas</b></p>" +
          "<p>Actividad / Juego 4 de la colección digital de <b>Optimización I</b>.</p>" +
          "<p>Basado en el material <b>Gimnasio 1 — Introducción a la Teoría de Sistemas</b>, sección 1.4 Complejidad.</p>" +
          "<p>R = n(n−1)/2 · C = n + R</p>" +
          "<p>Vanilla JavaScript · SVG · HTML5 · CSS3 · Sin backend.</p>",
        buttons: [{ label: "Cerrar" }]
      });
    });

    return refreshHomeButtons;
  }

  /* ============================================================
     HUD
     ============================================================ */
  function wireHud() {
    const soundBtn = document.getElementById("hud-sound");
    const sandBtn = document.getElementById("hud-sandbox");
    const progressBtn = document.getElementById("hud-progress");
    const achBtn = document.getElementById("hud-achievements");
    const tutorialBtn = document.getElementById("hud-tutorial");
    const homeBtn = document.getElementById("hud-home");
    const logoBtn = document.getElementById("hud-logo");

    function updateIcon(el, name) {
      const span = el.querySelector(".icon");
      if (span) span.innerHTML = CL.UI.icon(name, 19);
    }

    window.updateHudSoundIcon = function () {
      updateIcon(soundBtn, CL.State.get().settings.sound ? "sound_on" : "sound_off");
    };

    soundBtn.addEventListener("click", () => {
      const s = CL.State.get();
      s.settings.sound = !s.settings.sound;
      CL.Storage.saveSoon();
      updateHudSoundIcon();
      if (s.settings.sound) CL.Audio.play("click");
    });
    sandBtn.addEventListener("click", () => CL.Router.show("sandbox"));
    progressBtn.addEventListener("click", () => CL.Router.show("progress"));
    achBtn.addEventListener("click", () => CL.Router.show("achievements"));
    tutorialBtn.addEventListener("click", () => CL.Router.show("tutorial"));
    homeBtn.addEventListener("click", () => CL.Router.show("home"));
    logoBtn.addEventListener("click", () => CL.Router.show("home"));

    // botones de pantallas estáticas
    document.getElementById("progress-back").addEventListener("click", () => CL.Router.show("home"));
    document.getElementById("ach-back").addEventListener("click", () => CL.Router.show("home"));

    updateHudSoundIcon();
    CL.Scoring.syncHud();
  }

  /* ============================================================
     Registro de pantallas
     ============================================================ */
  function registerScreens() {
    CL.Router.register("home", null);
    CL.Router.register("intro", buildIntroScreen);
    CL.Router.register("tutorial", buildTutorialScreen);
    CL.Router.register("progress", () => {
      renderProgressMap(document.getElementById("progress-map"));
      return () => {};
    });
    CL.Router.register("experiment", buildExperimentScreen);
    CL.Router.register("challenge", buildChallengeScreen);
    CL.Router.register("final", buildFinalScreen);
    CL.Router.register("results", buildResultsScreen);
    CL.Router.register("achievements", buildAchievementsScreen);
    CL.Router.register("sandbox", buildSandboxScreen);
  }

  /* ============================================================
     Arranque
     ============================================================ */
  function boot() {
    // estado
    const saved = CL.Storage.load();
    if (saved) CL.State.set(saved);
    const state = CL.State.get();
    if (state.settings.reducedMotion === null) {
      state.settings.reducedMotion = CL.State.detectReducedMotion();
    }

    CL.UI.fillIcons(document);
    wireHud();
    const refreshHome = wireHome();
    refreshHome();
    registerScreens();

    CL.Router.show("home");
    CL.Achievements.check();
    CL.Storage.saveSoon();

    // prueba de consola
    window.__complexityLab = {
      math: CL.Math,
      state: CL.State.get,
      test: runTests
    };
  }

  /* ---- auto-prueba matemática (consola) ---- */
  function runTests() {
    const M = CL.Math;
    const cases = [
      [1, 0], [2, 1], [3, 3], [4, 6], [5, 10], [6, 15], [12, 66], [20, 190]
    ];
    const results = [];
    cases.forEach(([n, expect]) => {
      const ok = M.maxRelations(n) === expect;
      results.push(ok ? "✓ R(" + n + ")=" + expect : "✗ R(" + n + ")=" + M.maxRelations(n) + " esperado " + expect);
    });
    results.push(M.maxComplexity(12) === 78 ? "✓ C(12)=78" : "✗ C(12)=" + M.maxComplexity(12));
    results.push(M.edgeKey(2, 5) === M.edgeKey(5, 2) ? "✓ edgeKey canónico" : "✗ edgeKey");
    results.push(M.edgeKey(3, 3) === null ? "✓ auto-relación rechazada" : "✗ auto-relación");
    results.push(M.edgeKey(1, 20) === "1|20" ? "✓ orden a<b" : "✗ orden");
    console.log("%cCOMPLEXITY LAB · auto-prueba", "font-weight:bold");
    results.forEach((r) => console.log(r));
    return results;
  }

  document.addEventListener("DOMContentLoaded", boot);
})(window.ComplexityLab = window.ComplexityLab || {});
