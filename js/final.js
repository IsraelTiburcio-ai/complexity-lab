/* ============================================================
   COMPLEXITY LAB · js/final.js
   PROTOCOLO CAOS — experimento final por etapas
   + pantalla de ANÁLISIS COMPLETADO
   ============================================================ */
(function (CL) {
  "use strict";

  const $ = CL.UI.el;

  function build(host, api) {
    host.innerHTML = "";
    const phase = { v: 1 };
    const n = { v: 3 };
    const finalR = 66;
    const finalC = 78;
    let createdR = 0;
    let guessR = 20;
    let precision = 0;

    /* ---- caparazón ---- */
    const bar = $("div", { class: "exp-topbar" });
    const left = $("div", { style: { display: "flex", alignItems: "center", gap: "10px" } });
    const back = $("button", { class: "btn btn-ghost btn-sm", html: CL.UI.icon("back", 14) + " Mapa" });
    back.addEventListener("click", () => api.goMap());
    const title = $("div", { class: "exp-title", html: "EXPERIMENTO FINAL · <span>PROTOCOLO CAOS</span>" });
    left.append(back, title);
    const steps = $("div", { class: "step-track" });
    bar.append(left, steps);

    const grid = $("div", { class: "lab-grid" });
    const main = $("div", { class: "lab-main" });
    const side = $("div", { class: "lab-side" });
    grid.append(main, side);
    host.append(bar, grid);

    function setSteps() {
      steps.innerHTML = "";
      const total = 5;
      const cur = Math.min(phase.v, total) - 1;
      for (let i = 0; i < total; i++) {
        const d = $("span", { class: "step-dot" + (i < cur ? " is-done" : i === cur ? " is-current" : "") });
        steps.appendChild(d);
      }
    }

    const reactor = CL.ExperimentsHost.makeReactor(main, {
      netOpts: { labels: true, heat: true, layout: "organic", interactive: true, mode: "inspect", edgesAllowed: false },
      hint: ""
    });

    const coachBox = $("div", { class: "panel-block" });
    const coach = $("div", { class: "coach" });
    coachBox.appendChild(coach);
    const controls = $("div", { class: "panel-block" });
    const counters = CL.LabPanel.countersEl();
    const counterPanel = $("div", { class: "panel-block" });
    counterPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>CONTADORES' }), counters);

    function updateCounters() {
      CL.LabPanel.updateCounters(counters, n.v, reactor.net.getEdgeCount());
    }

    /* ---- FASE 1 · núcleo inicial ---- */
    function phase1() {
      setSteps();
      n.v = 3;
      reactor.net.setNodes(3);
      reactor.net.clearEdges();
      reactor.net.setMode("inspect");
      reactor.setHint("");
      updateCounters();
      coach.innerHTML = "<b>Etapa 1 · NÚCLEO INICIAL.</b> El sistema comienza pequeño: <strong>3 elementos</strong> y ninguna relación. " +
        "Tu misión: llevarlo desde una estructura simple hasta una estructura <em>altamente relacionada</em>, manteniendo el control sobre su complejidad.";
      controls.innerHTML = "";
      const btn = $("button", { class: "btn btn-primary btn-lg", html: "AGREGAR ELEMENTOS →" });
      btn.addEventListener("click", () => { phase.v = 2; phase2(); });
      controls.appendChild($("div", { class: "btn-row", style: { justifyContent: "center" }, children: [btn] }));
    }

    /* ---- FASE 2 · crecimiento ---- */
    function phase2() {
      setSteps();
      reactor.net.setMode("inspect");
      coach.innerHTML = "<b>Etapa 2 · CRECIMIENTO.</b> Agrega elementos hasta llegar a <strong>12</strong>. " +
        "Observa: con cada elemento nuevo, el número de relaciones <em>posibles</em> crece mucho más que los elementos.";
      controls.innerHTML = "";
      const add = $("button", { class: "btn btn-primary", html: CL.UI.icon("plus", 14) + " AGREGAR ELEMENTO" });
      const rm = $("button", { class: "btn btn-ghost btn-sm", html: "− QUITAR" });
      const fast = $("button", { class: "btn btn-ghost btn-sm", html: "IR A 12" });
      const status = $("div", { style: { marginTop: "8px", fontSize: "14px", color: "var(--text-1)" } });
      const refresh = () => {
        status.innerHTML = "Elementos: <b>" + n.v + "</b> · Relaciones posibles: <b>" + CL.Math.maxRelations(n.v) + "</b>";
        if (n.v >= 12) {
          coach.innerHTML = "<b>Etapa 2 · completada.</b> Tienes <strong>12 elementos</strong> y ahora existen <strong>66 relaciones posibles</strong>. " +
            "El número de elementos creció hasta 12, pero las conexiones posibles crecieron mucho más rápido.";
          const go = $("button", { class: "btn btn-primary btn-lg", html: "CREAR RELACIONES →" });
          go.addEventListener("click", () => { phase.v = 3; phase3(); });
          controls.appendChild($("div", { class: "btn-row", style: { justifyContent: "center", marginTop: "10px" }, children: [go] }));
        }
      };
      add.addEventListener("click", () => { if (n.v < 12) { n.v++; reactor.net.setNodes(n.v); CL.Audio.play("nodeAdd"); refresh(); } });
      rm.addEventListener("click", () => { if (n.v > 3) { n.v--; reactor.net.setNodes(n.v); refresh(); } });
      fast.addEventListener("click", () => { n.v = 12; reactor.net.setNodes(12); refresh(); });
      controls.append($("div", { class: "btn-row", children: [add, rm, fast] }), status);
      refresh();
    }

    /* ---- FASE 3 · relaciones ---- */
    function phase3() {
      setSteps();
      reactor.net.clearEdges();
      reactor.net.setMode("link");
      reactor.net.setEdges([], {});
      reactor.setHint("Pulsa un elemento y luego otro para crear relaciones");
      coach.innerHTML = "<b>Etapa 3 · RELACIONES.</b> Crea algunas relaciones manualmente. Conecta los pares de elementos que quieras. " +
        "Después conectaremos <em>todas</em> las posibles.";
      controls.innerHTML = "";
      const status = $("div", { style: { fontSize: "14px", color: "var(--text-1)", marginBottom: "8px" } });
      const next = $("button", { class: "btn btn-primary btn-lg", html: "TERMINAR DE CONECTAR →" });
      const refresh = () => {
        createdR = reactor.net.getEdgeCount();
        status.innerHTML = "Relaciones creadas: <b>" + createdR + "</b> de " + CL.Math.maxRelations(n.v) + " posibles.";
        CL.LabPanel.updateCounters(counters, n.v, createdR);
      };
      const onLink = reactor.net.opts.onLink;
      reactor.net.opts.onLink = (a, b) => {
        if (reactor.net.addEdge(a, b, { animate: true })) { CL.Audio.play("link"); refresh(); return true; }
        CL.UI.toast("Esa relación ya existe.", "err");
        return false;
      };
      next.addEventListener("click", () => { phase.v = 4; phase4(); });
      controls.append(status, $("div", { class: "btn-row", style: { justifyContent: "center" }, children: [next] }));
      refresh();
    }

    /* ---- FASE 4 · predicción ---- */
    function phase4() {
      setSteps();
      reactor.net.setMode("inspect");
      reactor.setHint("");
      coach.innerHTML = "<b>Etapa 4 · PREDICCIÓN.</b> Antes de activar todas las relaciones: " +
        "¿cuántas relaciones crees que aparecerán si conectamos cada elemento con todos los demás?";
      controls.innerHTML = "";
      const pred = CL.LabPanel.sliderEl({ min: 0, max: finalR, value: guessR, label: "Tu predicción de RELACIONES" });
      const val = pred.querySelector(".slider-value");
      pred.querySelector("input").addEventListener("input", (e) => { guessR = parseInt(e.target.value, 10); val.textContent = guessR; });
      const sim = $("button", { class: "btn btn-complex btn-lg", html: "SIMULAR" });
      sim.addEventListener("click", () => { phase.v = 5; phase5(); });
      controls.append(pred, $("div", { class: "btn-row", style: { justifyContent: "center", marginTop: "10px" }, children: [sim] }));
    }

    /* ---- FASE 5 · simulación ---- */
    function phase5() {
      setSteps();
      reactor.net.completeAll({ animate: true });
      reactor.net.pulseAll(0.02);
      CL.Audio.play("complete");
      const diff = Math.abs(guessR - finalR);
      precision = Math.max(40, Math.round(100 - diff * 2.4));
      const s = CL.State.get();
      if (diff === 0) s.stats.exactPredictions = (s.stats.exactPredictions || 0) + 1;
      if (s.bestPrecision === null || precision > s.bestPrecision) s.bestPrecision = precision;
      CL.Scoring.prediction(guessR, finalR);
      s.stats.finalCompleted = true;
      s.progress.sandboxUnlocked = true;
      s.progress.final = Object.assign({}, s.progress.final, { done: true, precision: precision, guess: guessR });
      CL.Storage.saveSoon();
      CL.Achievements.check();

      updateCounters();
      coach.innerHTML = "<b>Etapa 5 · SIMULACIÓN COMPLETADA.</b><br/>Elementos: <strong>12</strong><br/>" +
        "Relaciones construidas: <strong>66</strong><br/>Complejidad final: <strong class='ck'>C = 78</strong><br/><br/>" +
        "Tu predicción: <b>" + guessR + "</b> · Resultado: <b>" + finalR + "</b> · Diferencia: <b>" + diff + "</b>";
      controls.innerHTML = "";
      const analysis = $("button", { class: "btn btn-complex btn-lg", html: "VER ANÁLISIS COMPLETO" });
      analysis.addEventListener("click", () => api.goResults());
      controls.appendChild($("div", { class: "btn-row", style: { justifyContent: "center" }, children: [analysis] }));
      CL.Audio.play("final");
    }

    side.appendChild(coachBox);
    side.appendChild(counterPanel);
    side.appendChild(controls);

    phase1();
    return () => reactor.net.destroy();
  }

  /* ---- RESULTADOS / ANÁLISIS COMPLETADO ---- */
  function renderResults(container, api) {
    const s = CL.State.get();
    const f = s.progress.final || {};
    const doneChallenges = Object.keys(s.progress.challenges).filter((k) => s.progress.challenges[k].done).length;
    const totalChallenges = CL.Challenges.DEFS.length;
    const precision = f.precision !== undefined ? f.precision : (s.bestPrecision !== null ? s.bestPrecision : 0);

    container.innerHTML = "";
    const wrap = $("div", { class: "panel-card", style: { padding: "22px", marginTop: "6px" } });

    const precisionRing = $("div", { class: "precision-ring" });
    const CIRC = 2 * Math.PI * 54;
    precisionRing.innerHTML =
      '<svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true">' +
      '<circle cx="65" cy="65" r="54" fill="none" stroke="rgba(120,170,255,0.12)" stroke-width="9"/>' +
      '<circle cx="65" cy="65" r="54" fill="none" stroke="#2fe8c0" stroke-width="9" stroke-linecap="round" ' +
      'stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + (CIRC * (1 - precision / 100)) + '" style="transition:stroke-dashoffset 1s ease"/>' +
      "</svg>" +
      '<div style="position:relative;text-align:center"><div class="pr-val">' + precision + "%</div><div class='pr-lbl'>PRECISIÓN DE PREDICCIONES</div></div>";
    const ringLabel = $("div", { style: { textAlign: "center" } });
    ringLabel.appendChild(precisionRing);

    const grid = $("div", { class: "results-grid" });
    const cells = [
      ["12", "ELEMENTOS ANALIZADOS", ""],
      ["66", "RELACIONES CONSTRUIDAS", ""],
      ["78", "COMPLEJIDAD FINAL", "result-cell--complex"],
      [doneChallenges + "/" + totalChallenges, "DESAFÍOS", doneChallenges === totalChallenges ? "result-cell--ok" : ""],
      [String(s.hintsUsed), "PISTAS UTILIZADAS", "result-cell--warn"],
      [String(s.score), "PUNTOS TOTALES", "result-cell--ok"]
    ];
    cells.forEach((c) => {
      const cell = $("div", { class: "result-cell " + c[2] });
      cell.append($("div", { class: "rv", html: c[0] }), $("div", { class: "rl", html: c[1] }));
      grid.appendChild(cell);
    });

    const msg = $("div", { class: "inst-block", style: { textAlign: "center", marginTop: "6px" } });
    if (s.stats.finalCompleted) {
      msg.innerHTML = "Completaste el <b>Protocolo Caos</b>: llevaste el sistema desde 3 elementos hasta una red con <strong>12 elementos y 66 relaciones</strong>.<br/>" +
        "Agregar un elemento puede generar <em>varias relaciones nuevas</em>. La complejidad de un sistema no depende solo de la cantidad de elementos, sino también de las relaciones existentes entre ellos.";
    } else {
      msg.innerHTML = "El análisis final aún no está completo. Regresa al Protocolo Caos para terminar el experimento.";
    }

    const actions = $("div", { class: "btn-row", style: { justifyContent: "center", marginTop: "18px" } });
    if (s.stats.finalCompleted) {
      const sand = $("button", { class: "btn btn-primary btn-lg", html: "ABRIR MODO LIBRE" });
      sand.addEventListener("click", () => api.goSandbox());
      actions.appendChild(sand);
    }
    const home = $("button", { class: "btn btn-ghost btn-lg", html: "VOLVER AL MAPA" });
    home.addEventListener("click", () => api.goMap());
    actions.appendChild(home);

    wrap.append(ringLabel, grid, msg, actions);
    container.appendChild(wrap);
  }

  CL.FinalHost = {
    build: build,
    renderResults: renderResults
  };
})(window.ComplexityLab = window.ComplexityLab || {});
