/* ============================================================
   COMPLEXITY LAB · js/challenges.js
   Cámara de desafíos: 7 retos interactivos definidos como datos.
   Motores:
     build-complexity · complete-network · estimate-reveal · inverse-slider
   ============================================================ */
(function (CL) {
  "use strict";

  const $ = CL.UI.el;

  /* ============================================================
     Motores de desafío
     ============================================================ */

  /* ---- CONSTRUYE: n + R = C objetivo ---- */
  function engineBuildComplexity(host, def, api, finish) {
    const p = def.params;
    const ctx = { n: Math.min(p.maxNodes, p.minNodes + 2), overshot: false, validatedWrong: false };

    const shell = buildShell(host, def, api);
    const reactor = CL.ExperimentsHost.makeReactor(shell.main, {
      netOpts: {
        labels: true, heat: true, layout: "organic", interactive: true, mode: "link", edgesAllowed: true,
        onLink: (a, b) => {
          if (reactor.net.addEdge(a, b, { animate: true })) { CL.Audio.play("link"); afterChange(); return true; }
          CL.Audio.play("error");
          CL.UI.toast("Esa relación ya existe entre los Elemento " + a + " y " + b + ".", "err");
          return false;
        }
      },
      hint: "Agrega elementos y relaciones hasta que C = " + p.targetC
    });
    const counters = CL.LabPanel.countersEl();
    const formula = CL.LabPanel.formulaEl();

    const counterPanel = $("div", { class: "panel-block" });
    counterPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>TU RED' }), counters);

    const formulaPanel = $("div", { class: "panel-block" });
    formulaPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>ANALIZADOR MATEMÁTICO' }), formula);

    const slider = CL.LabPanel.sliderEl({
      min: p.minNodes, max: p.maxNodes, value: ctx.n, label: "ELEMENTOS",
      onInput: (v) => { ctx.n = v; rebuild(); }
    });

    const statusBox = $("div", { class: "coach", html: "Tu meta: <b>C = n + R = " + p.targetC + "</b>" });

    function currentC() {
      return CL.Math.complexity(ctx.n, reactor.net.getEdgeCount());
    }
    function rebuild() {
      reactor.net.setNodes(ctx.n);
      afterChange(false);
    }
    function afterChange(check) {
      const r = reactor.net.getEdgeCount();
      CL.LabPanel.updateCounters(counters, ctx.n, r);
      CL.LabPanel.updateFormula(formula, ctx.n, r);
      const C = currentC();
      statusBox.innerHTML = "Elementos: <b>" + ctx.n + "</b> · Relaciones: <b>" + r + "</b> · <strong>C = " + C + "</strong> (meta " + p.targetC + ")";
      if (C > p.targetC) ctx.overshot = true;
      if (check !== false && C === p.targetC) {
        finish({ firstAttempt: !ctx.overshot && !ctx.validatedWrong });
      }
    }

    const addBtn = $("button", { class: "btn btn-primary", html: CL.UI.icon("plus", 14) + " AGREGAR ELEMENTO" });
    const rmBtn = $("button", { class: "btn btn-ghost btn-sm", html: "− ELEMENTO" });
    addBtn.addEventListener("click", () => {
      if (ctx.n < p.maxNodes) { ctx.n++; slider.querySelector("input").value = ctx.n; slider.querySelector(".slider-value").textContent = ctx.n; rebuild(); }
    });
    rmBtn.addEventListener("click", () => {
      if (ctx.n > p.minNodes) { ctx.n--; slider.querySelector("input").value = ctx.n; slider.querySelector(".slider-value").textContent = ctx.n; rebuild(); }
    });

    const clearBtn = $("button", { class: "btn btn-ghost btn-sm", html: "LIMPIAR RELACIONES" });
    clearBtn.addEventListener("click", () => { reactor.net.clearEdges(); afterChange(); });
    const checkBtn = $("button", { class: "btn btn-complex", html: "COMPROBAR" });
    checkBtn.addEventListener("click", () => {
      if (currentC() === p.targetC) finish({ firstAttempt: !ctx.overshot && !ctx.validatedWrong });
      else {
        ctx.validatedWrong = true;
        CL.Audio.play("error");
        CL.UI.toast("Todavía no: C = " + currentC() + ", necesitas C = " + p.targetC + ". Revisa cuántos elementos y relaciones tienes.", "err");
      }
    });

    shell.side.append(
      $("div", { class: "panel-block", children: [statusBox, $("div", { style: { height: "10px" } }), slider, $("div", { class: "btn-row", style: { marginTop: "8px" }, children: [addBtn, rmBtn] })] }),
      counterPanel,
      formulaPanel,
      $("div", { class: "panel-block", children: [$("div", { class: "btn-row", children: [checkBtn, clearBtn] })] })
    );

    rebuild();
    return () => reactor.net.destroy();
  }

  /* ---- COMPLETA LA RED ---- */
  function engineCompleteNetwork(host, def, api, finish) {
    const p = def.params;
    const n = p.n;
    const target = p.targetRelations;
    const ctx = { firstAttempt: true };

    const shell = buildShell(host, def, api);
    const reactor = CL.ExperimentsHost.makeReactor(shell.main, {
      netOpts: {
        labels: true, heat: true, layout: "organic", interactive: true, mode: "link", edgesAllowed: true,
        onLink: (a, b) => {
          const exists = reactor.net.getEdges().some((e) => e.key === CL.Math.edgeKey(a, b));
          if (exists) {
            CL.Audio.play("error");
            ctx.firstAttempt = false;
            CL.UI.toast("Esa relación ya existe. Recuerda: cada par de elementos distintos se conecta una sola vez.", "err");
            return false;
          }
          reactor.net.addEdge(a, b, { animate: true });
          CL.Audio.play("link");
          afterChange();
          return true;
        }
      },
      hint: "Conecta los elementos hasta completar R = " + target
    });
    const counters = CL.LabPanel.countersEl();
    const progress = CL.LabPanel.progressBarEl(target, 0);
    const statusBox = $("div", { class: "coach", html: "" });

    const counterPanel = $("div", { class: "panel-block" });
    counterPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>PROGRESO' }), progress, $("div", { style: { height: "8px" } }), counters);

    // estado inicial
    reactor.net.setNodes(n);
    if (p.initialCount) {
      // generar initialCount aristas aleatorias
      const pairs = allPairs(n);
      shuffle(pairs);
      reactor.net.setEdges(pairs.slice(0, p.initialCount).map((x) => ({ a: x[0], b: x[1] })), { animate: true });
    } else if (p.initialEdges && p.initialEdges.length) {
      const given = new Set(p.initialEdges.map((x) => CL.Math.edgeKey(x[0], x[1])));
      const all = allPairs(n);
      const initial = all.filter((x) => !given.has(CL.Math.edgeKey(x[0], x[1])));
      reactor.net.setEdges(initial.map((x) => ({ a: x[0], b: x[1] })), { animate: true });
      // los faltantes son los del parámetro missing
    } else if (p.missing) {
      const missingSet = new Set(p.missing.map((x) => CL.Math.edgeKey(x[0], x[1])));
      const all = allPairs(n);
      const initial = all.filter((x) => !missingSet.has(CL.Math.edgeKey(x[0], x[1])));
      reactor.net.setEdges(initial.map((x) => ({ a: x[0], b: x[1] })), { animate: true });
    }

    function afterChange() {
      const r = reactor.net.getEdgeCount();
      CL.LabPanel.updateCounters(counters, n, r);
      progress._set(r);
      statusBox.innerHTML = "Relaciones: <b>" + r + "</b> / <b>" + target + "</b>";
      if (r === target) {
        reactor.net.pulseAll(0.02);
        reactor.net.setOverlay("RED COMPLETA", true);
        setTimeout(() => reactor.net.setOverlay("", false), 2200);
        CL.Audio.play("complete");
        CL.Scoring.fullNetwork();
        finish({ firstAttempt: ctx.firstAttempt });
      }
    }
    afterChange();

    const clearBtn = $("button", { class: "btn btn-ghost btn-sm", html: "LIMPIAR RELACIONES" });
    clearBtn.addEventListener("click", () => { ctx.firstAttempt = false; reactor.net.clearEdges(); afterChange(); });

    shell.side.append(
      counterPanel,
      $("div", { class: "panel-block", children: [statusBox, $("div", { style: { height: "8px" } }), $("div", { class: "btn-row", children: [clearBtn] })] })
    );

    return () => reactor.net.destroy();
  }

  /* ---- n = 12: estimar y revelar ---- */
  function engineEstimateReveal(host, def, api, finish) {
    const p = def.params;
    const shell = buildShell(host, def, api);
    const reactor = CL.ExperimentsHost.makeReactor(shell.main, {
      netOpts: { labels: true, heat: false, layout: "radial", interactive: false, edgesAllowed: false },
      hint: "Primero estima, después SIMULA"
    });

    const counters = CL.LabPanel.countersEl();
    const counterPanel = $("div", { class: "panel-block" });
    counterPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>CONTADORES' }), counters);

    // fase 1: estimación
    const guessR = { v: 20 };
    const guessC = { v: 20 };
    const predR = CL.LabPanel.sliderEl({ min: 0, max: p.revealRel, value: guessR.v, label: "Estima las RELACIONES MÁXIMAS" });
    const predC = CL.LabPanel.sliderEl({ min: 0, max: p.revealC, value: guessC.v, label: "Estima el ORDEN DE COMPLEJIDAD" });
    const rVal = predR.querySelector(".slider-value");
    const cVal = predC.querySelector(".slider-value");
    predR.querySelector("input").addEventListener("input", (e) => { guessR.v = parseInt(e.target.value, 10); rVal.textContent = guessR.v; });
    predC.querySelector("input").addEventListener("input", (e) => { guessC.v = parseInt(e.target.value, 10); cVal.textContent = guessC.v; });

    const status = $("div", { class: "coach", html: "<b>El clásico del Gimnasio.</b> Con 12 elementos, ¿cuántas relaciones <em>máximas</em> pueden existir entre pares de elementos? Y ¿cuál es el orden de complejidad <strong>C = n + R</strong>?" });

    const simBtn = $("button", { class: "btn btn-complex btn-lg", html: "SIMULAR" });
    const stages = p.steps || [2, 4, 8, 12];
    let simulating = false;

    reactor.net.setNodes(p.n);
    afterChange(0);

    function afterChange(r) {
      CL.LabPanel.updateCounters(counters, p.n, r);
    }

    simBtn.addEventListener("click", () => {
      if (simulating) return;
      simulating = true;
      // registrar predicciones
      const resR = CL.Scoring.prediction(guessR.v, p.revealRel);
      CL.Scoring.prediction(guessC.v, p.revealC);
      CL.Audio.play("prediction");
      status.innerHTML = "Tu predicción: <b>" + guessR.v + "</b> relaciones y <b>C = " + guessC.v + "</b>.<br/>" +
        "El resultado real es <b>" + p.revealRel + "</b> relaciones y <b>C = " + p.revealC + "</b>.<br/>" +
        (resR.exact ? "Predicción exacta de relaciones: +" + resR.gained + " pts." : "Diferencia: " + resR.diff + ". Sigue explorando.");
      const msg = resR.exact
        ? "Predicción exacta: <b>" + p.revealRel + "</b> relaciones. <strong class='ck'>¡+" + resR.gained + " pts!</strong>"
        : "Tu estimación fue de <b>" + guessR.v + "</b>; el máximo real es <b>" + p.revealRel + "</b> (diferencia de " + resR.diff + ").";
      let i = 0;
      const progress = CL.LabPanel.progressBarEl(stages.length, 0);
      const revealPanel = $("div", { class: "panel-block" });
      revealPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>REVELACIÓN GRADUAL' }), progress);
      shell.side.appendChild(revealPanel);
      const tick = () => {
        const st = stages[i];
        reactor.net.setNodes(st);
        reactor.net.completeAll({ animate: true });
        afterChange(CL.Math.maxRelations(st));
        progress._set(i + 1);
        i++;
        if (i < stages.length) setTimeout(tick, 900);
        else {
          setTimeout(() => {
            reactor.net.pulseAll(0.03);
            CL.Audio.play("complete");
            const s = CL.State.get();
            s.stats.case78Solved = true;
            CL.Storage.saveSoon();
            CL.Achievements.check();
            status.innerHTML = "Elementos: <b>12</b> · Relaciones máximas: <b>66</b> · Orden de complejidad: <strong class='ck'>C = 12 + 66 = 78</strong>. " +
              msg + " Las relaciones representan la mayor parte de la complejidad.";
            finish({ firstAttempt: true, skipToast: true });
          }, 500);
        }
      };
      setTimeout(tick, 700);
    });

    shell.side.append(
      $("div", { class: "panel-block", children: [status] }),
      counterPanel,
      $("div", { class: "panel-block prediction-panel", children: [
        $("div", { class: "panel-title", html: '<span class="dot"></span>PREDICCIÓN ANTES DE SIMULAR' }),
        predR, $("div", { style: { height: "8px" } }), predC,
        $("div", { class: "btn-row", style: { marginTop: "10px", justifyContent: "center" }, children: [simBtn] })
      ] })
    );

    return () => reactor.net.destroy();
  }

  /* ---- INVERSO: C = 21, descubre n ---- */
  function engineInverseSlider(host, def, api, finish) {
    const p = def.params;
    const ctx = { n: 1, firstAttempt: true };
    const shell = buildShell(host, def, api);
    const reactor = CL.ExperimentsHost.makeReactor(shell.main, {
      netOpts: { labels: true, heat: false, layout: "organic", interactive: false, edgesAllowed: false },
      hint: "Mueve el control y descubre cuántos elementos dan C = 21"
    });
    const counters = CL.LabPanel.countersEl();
    const counterPanel = $("div", { class: "panel-block" });
    counterPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>CONTADORES' }), counters);
    const formula = CL.LabPanel.formulaEl();
    const formulaPanel = $("div", { class: "panel-block" });
    formulaPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>ANALIZADOR MATEMÁTICO' }), formula);

    const status = $("div", { class: "coach", html: "Este sistema tiene orden de complejidad <b>máxima</b> <strong class='ck'>C = 21</strong>. ¿Cuántos elementos tiene? Muévelo y descúbrelo." });

    const slider = CL.LabPanel.sliderEl({
      min: 1, max: p.maxN, value: 1, label: "ELEMENTOS (n)",
      onInput: (v) => {
        ctx.n = v;
        reactor.net.setNodes(v);
        reactor.net.completeAll({ animate: false });
        const R = CL.Math.maxRelations(v);
        const C = CL.Math.maxComplexity(v);
        CL.LabPanel.updateCounters(counters, v, R);
        CL.LabPanel.updateFormula(formula, v, R);
        status.innerHTML = "Con <b>" + v + "</b> elementos: <b>" + R + "</b> relaciones máximas → <strong>C = " + C + "</strong>";
        if (C === p.targetC) {
          status.innerHTML = "¡Descubierto! Con <b>" + v + "</b> elementos y <b>" + R + "</b> relaciones máximas, <strong class='ck'>C = " + C + "</strong>. La fórmula C = n + n(n−1)/2 confirma el resultado.";
          CL.Audio.play("complete");
          finish({ firstAttempt: true });
        }
      }
    });

    shell.side.append(
      $("div", { class: "panel-block", children: [status, $("div", { style: { height: "10px" } }), slider] }),
      counterPanel,
      formulaPanel
    );

    return () => reactor.net.destroy();
  }

  /* ============================================================
     Caparazón de desafío
     ============================================================ */
  function buildShell(host, def, api) {
    host.innerHTML = "";
    const bar = $("div", { class: "exp-topbar" });
    const left = $("div", { style: { display: "flex", alignItems: "center", gap: "10px" } });
    const back = $("button", { class: "btn btn-ghost btn-sm", html: CL.UI.icon("back", 14) + " Cámara" });
    back.addEventListener("click", () => api.goChallengeHub());
    const title = $("div", { class: "exp-title", html: "DESAFÍO · <span>" + def.name + "</span>" });
    left.append(back, title);
    const right = $("div", { style: { fontSize: "12px", color: "var(--text-2)", fontFamily: "var(--font-mono)" }, html: "+" + def.points + " pts" });
    bar.append(left, right);

    const grid = $("div", { class: "lab-grid" });
    const main = $("div", { class: "lab-main" });
    const side = $("div", { class: "lab-side" });
    grid.append(main, side);

    // tarjeta de objetivo + pistas
    const goalPanel = $("div", { class: "panel-block" });
    goalPanel.append(
      $("div", { class: "panel-title", html: '<span class="dot"></span>OBJETIVO' }),
      $("div", { class: "inst-block", html: def.desc })
    );
    side.appendChild(goalPanel);

    // AYUDAS escalonadas
    const hintsPanel = $("div", { class: "panel-block" });
    const hintsTitle = $("div", { class: "panel-title", html: '<span class="dot"></span>AYUDAS · ANALIZAR' });
    const analizarBtn = $("button", { class: "btn btn-ghost btn-sm", html: "ANALIZAR" });
    const hintItems = $("div", { class: "hints" });
    let hintLevel = 0;
    analizarBtn.addEventListener("click", () => {
      if (hintLevel >= def.hints.length) { CL.UI.toast("Sin más pistas. ¡Inténtalo!", "info"); return; }
      CL.Audio.play("hint");
      CL.Scoring.useHint();
      const item = $("div", {
        class: "hint-item is-visible",
        html: '<span class="hint-tag">PISTA ' + (hintLevel + 1) + "</span>" + def.hints[hintLevel]
      });
      hintItems.appendChild(item);
      hintLevel++;
    });
    hintsPanel.append(hintsTitle, $("div", { class: "btn-row", children: [analizarBtn] }), $("div", { style: { height: "6px" } }), hintItems);
    side.appendChild(hintsPanel);

    host.append(bar, grid);
    return { main: main, side: side, hintItems: hintItems };
  }

  /* ============================================================
     Utilidades
     ============================================================ */
  function allPairs(n) {
    const out = [];
    for (let i = 1; i <= n; i++) for (let j = i + 1; j <= n; j++) out.push([i, j]);
    return out;
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  const ENGINES = {
    "build-complexity": engineBuildComplexity,
    "complete-network": engineCompleteNetwork,
    "estimate-reveal": engineEstimateReveal,
    "inverse-slider": engineInverseSlider
  };

  /* ============================================================
     Flujo de finalización
     ============================================================ */
  function complete(def, opts) {
    opts = opts || {};
    const gained = CL.Scoring.challengeSolved(def.id, opts.firstAttempt !== false);
    const s = CL.State.get();
    const doneCount = Object.keys(s.progress.challenges).filter((k) => s.progress.challenges[k].done).length;
    if (doneCount >= CL.Challenges.DEFS.length) {
      CL.Achievements.check();
    }
    if (!opts.skipToast) {
      CL.UI.toast("<b>" + def.name + "</b> superado. " + (gained ? "+" + gained + " pts" : ""), "ok");
    }
    CL.Storage.saveSoon();
    return gained;
  }

  function build(host, id, api) {
    const def = CL.Challenges.get(id);
    if (!def) return () => {};
    const engine = ENGINES[def.type];
    if (!engine) return () => {};
    const done = { v: false };
    const finishOnce = (opts) => {
      if (done.v) return;
      done.v = true;
      complete(def, opts);
      api.onChallengeSuccess(def);
    };
    return engine(host, def, api, finishOnce);
  }

  function renderHub(container, api) {
    const s = CL.State.get();
    const experimentsDone = s.progress.experiments.synergy && s.progress.experiments.synergy.done;
    const unlockedAll = experimentsDone;

    container.innerHTML = "";
    container.classList.add("ach-grid");

    CL.Challenges.DEFS.forEach((def, i) => {
      const done = s.progress.challenges[def.id] && s.progress.challenges[def.id].done;
      // desbloqueo secuencial
      let unlocked = unlockedAll && (i === 0 || (s.progress.challenges[CL.Challenges.DEFS[i - 1].id] && s.progress.challenges[CL.Challenges.DEFS[i - 1].id].done));
      if (done) unlocked = true;

      const card = $("button", {
        class: "challenge-card" + (done ? " is-done" : unlocked ? "" : " is-locked"),
        html:
          '<span class="ch-ico">' + CL.UI.icon(unlocked || done ? def.icon : "lock", 20) + "</span>" +
          '<span class="ch-name">' + def.name + "</span>" +
          '<span class="ch-desc">' + (unlocked || done ? def.desc : "Completa los desafíos anteriores para desbloquear.") + "</span>" +
          '<span class="ch-meta">' + (done ? "✓ Completado · +" + def.points + " pts" : unlocked ? "Objetivo · " + def.points + " pts" : "🔒") + "</span>"
      });
      card.addEventListener("click", () => {
        if (!unlocked) {
          CL.Audio.play("error");
          CL.UI.toast("Aún bloqueado. Completa los retos anteriores.", "err");
          return;
        }
        api.openChallenge(def.id);
      });
      container.appendChild(card);
    });
  }

  CL.ChallengesHost = {
    build: build,
    renderHub: renderHub,
    complete: complete,
    isUnlocked: function (i) {
      const s = CL.State.get();
      const expDone = s.progress.experiments.synergy && s.progress.experiments.synergy.done;
      if (!expDone) return false;
      if (i === 0) return true;
      const prev = CL.Challenges.DEFS[i - 1];
      return !!(s.progress.challenges[prev.id] && s.progress.challenges[prev.id].done);
    }
  };
})(window.ComplexityLab = window.ComplexityLab || {});
