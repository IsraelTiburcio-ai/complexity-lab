/* ============================================================
   COMPLEXITY LAB · js/experiments.js
   Experimento 1 · Elementos
   Experimento 2 · Relaciones
   Experimento 3 · Orden de complejidad
   Experimento 4 · Simple vs. Complejo
   Experimento 5 · Sinergia
   ============================================================ */
(function (CL) {
  "use strict";

  const $ = CL.UI.el;

  /* ============================================================
     Utilidades compartidas de laboratorio
     ============================================================ */

  function makeReactor(main, opts) {
    opts = opts || {};
    const shell = $("div", { class: "reactor-shell" });
    const label = $("div", {
      class: "reactor-label",
      html: '<span class="r-status"></span>REACTOR DE COMPLEJIDAD'
    });
    const netHost = $("div", { class: "net-host", style: { position: "absolute", inset: "0" } });
    const hint = $("div", { class: "net-hint", html: opts.hint || "" });
    const overlay = $("div", { class: "net-overlay" });
    shell.append(label, netHost, hint, overlay);
    main.appendChild(shell);

    const net = CL.Network.create(netHost, opts.netOpts || {});
    return {
      shell: shell,
      net: net,
      hint: hint,
      overlay: overlay,
      setHint: (t) => { hint.innerHTML = t; hint.style.display = t ? "" : "none"; },
      setOverlay: (t, visible) => {
        if (t) overlay.innerHTML = '<div class="ov-text">' + t + "</div>";
        overlay.classList.toggle("is-visible", !!visible);
      }
    };
  }

  /* ---- Inspección de nodos (panel opcional) ---- */
  function nodeInspect(net, id, opts) {
    const pos = net.nodePosition(id);
    if (!pos) return;
    const edges = net.getEdges().filter((e) => e.a === id || e.b === id);
    const n = net.nodes.length;
    const maxR = CL.Math.maxRelations(n);
    const pct = maxR > 0 ? Math.round((edges.length / maxR) * 100) : 0;
    const chips = edges
      .map((e) => (e.a === id ? e.b : e.a))
      .sort((a, b) => a - b)
      .map((x) => '<span class="ip-chip">E' + x + "</span>")
      .join("");

    const pop = $("div", {
      class: "inspect-pop",
      html:
        '<button class="ip-close" aria-label="Cerrar">✕</button>' +
        '<div class="ip-title">ELEMENTO ' + id + "</div>" +
        '<div class="ip-row"><span>Relaciones actuales</span><b>' + edges.length + "</b></div>" +
        '<div class="ip-row"><span>% del total posible</span><b>' + pct + "%</b></div>" +
        '<div class="ip-list">' + (chips || '<span class="ip-chip">sin vínculos</span>') + "</div>"
    });
    const rect = net.container.getBoundingClientRect();
    const px = pos.x - rect.left;
    const py = pos.y - rect.top;
    pop.style.left = Math.max(4, Math.min(px + 14, rect.width - 200)) + "px";
    pop.style.top = Math.max(4, Math.min(py - 20, rect.height - 120)) + "px";
    pop.querySelector(".ip-close").addEventListener("click", () => pop.remove());
    net.container.appendChild(pop);
    return pop;
  }

  function edgeInspect(net, edge, opts) {
    const a = net._node(edge.a), b = net._node(edge.b);
    if (!a || !b) return;
    const x = ((a.fx + b.fx) / 2) * net.W;
    const y = ((a.fy + b.fy) / 2) * net.H;
    const rect = net.container.getBoundingClientRect();
    const pop = $("div", {
      class: "inspect-pop",
      html:
        '<button class="ip-close" aria-label="Cerrar">✕</button>' +
        '<div class="ip-title">RELACIÓN</div>' +
        '<div class="ip-row" style="justify-content:flex-start"><span>Esta relación conecta el Elemento ' + edge.a +
        ' con el Elemento ' + edge.b + ".</span></div>"
    });
    pop.style.left = Math.max(4, Math.min((x / net.W) * rect.width + 10, rect.width - 210)) + "px";
    pop.style.top = Math.max(4, Math.min((y / net.H) * rect.height + 10, rect.height - 90)) + "px";
    pop.querySelector(".ip-close").addEventListener("click", () => pop.remove());
    net.container.appendChild(pop);
  }

  /* ---- Panel de coach ---- */
  function coach(msg, type) {
    return $("div", { class: "coach " + (type || ""), html: msg });
  }

  /* ---- Barra de topo del experimento ---- */
  function expTopbar(expDef, opts) {
    const bar = $("div", { class: "exp-topbar" });
    const left = $("div", { style: { display: "flex", alignItems: "center", gap: "10px" } });
    const back = $("button", {
      class: "btn btn-ghost btn-sm",
      html: CL.UI.icon("back", 14) + " Mapa"
    });
    back.addEventListener("click", () => opts.onBack());
    const title = $("div", { class: "exp-title", html: "EXPERIMENTO " + expDef.num + " · <span>" + expDef.title + "</span>" });
    left.append(back, title);
    const right = $("div", { style: { display: "flex", alignItems: "center", gap: "12px" } });
    const steps = $("div", { class: "step-track" });
    right.appendChild(steps);
    bar.append(left, right);
    return { bar: bar, steps: steps };
  }

  function setSteps(steps, total, current) {
    steps.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const d = $("span", {
        class: "step-dot" + (i < current ? " is-done" : i === current ? " is-current" : "")
      });
      d.setAttribute("aria-hidden", "true");
      steps.appendChild(d);
    }
  }

  /* ============================================================
     Construcción por experimento
     ============================================================ */

  /* ---------- EXPERIMENTO 1 · ELEMENTOS ---------- */
  function buildExp1(host, expDef, api) {
    const shell = createShell(host, expDef, api);
    shell.mainTop.appendChild(
      $("div", { class: "panel-block", html: '<div class="inst-block">' +
        "<b>Un sistema crece al sumar elementos.</b> Agrega elementos y observa cómo se forma una red. " +
        "Por ahora, las relaciones están desactivadas.</div>" })
    );
    const big = CL.LabPanel.bigCounterEl("ELEMENTOS", 1);
    const counterPanel = $("div", { class: "panel-block", style: { textAlign: "center" } });
    counterPanel.appendChild(big);
    shell.mainTop.appendChild(counterPanel);

    const reactor = makeReactor(shell.main, {
      netOpts: {
        labels: true, heat: false, layout: "organic",
        interactive: true, mode: "inspect", edgesAllowed: false,
        onNodeClick: (id) => nodeInspect(reactor.net, id)
      },
      hint: "Pulsa + AGREGAR ELEMENTO"
    });

    const n = { v: 1 };
    let coachBox = $("div");
    let trans = $("div");
    const update = (opts) => {
      const r = reactor.net.setNodes(n.v, opts);
      r.added.forEach(() => CL.Audio.play("nodeAdd"));
      r.removed.forEach(() => CL.Audio.play("nodeRemove"));
      CL.LabPanel.setBigCounter(big, n.v);
      const maxR = CL.Math.maxRelations(n.v);
      coachBox.innerHTML = "";
      if (n.v === 1) coachBox.appendChild(coach("Comenzamos con <b>1 elemento</b>. Un sistema mínimo."));
      else if (n.v < 6) coachBox.appendChild(coach("Ahora el sistema tiene <b>" + n.v + " elementos</b>. Solo existen " + n.v + " nodos… todavía sin relaciones."));
      else {
        coachBox.appendChild(coach("Ya tienes <b>" + n.v + " elementos</b>. Pero, ¡atención! con " + n.v +
          " elementos <strong class='ck'>podrían existir hasta " + maxR + " relaciones</strong> entre ellos."));
      }
      if (n.v >= 10) markDone();
      renderTrans();
    };
    const markDone = () => {
      if (n.v >= 5) {
        api.markExperimentDone("elements");
        if (!(api.state.progress.experiments.elements || {}).done) {
          api.notifyDone();
        }
      }
    };
    update();

    const addBtn = $("button", { class: "btn btn-primary", html: CL.UI.icon("plus", 15) + " AGREGAR ELEMENTO" });
    const rmBtn = $("button", { class: "btn btn-ghost", html: CL.UI.icon("minus", 15) + " QUITAR" });
    const rstBtn = $("button", { class: "btn btn-ghost", html: CL.UI.icon("reset", 15) + " REINICIAR" });
    addBtn.addEventListener("click", () => {
      if (n.v >= 20) return;
      n.v++;
      update({ entering: true });
    });
    rmBtn.addEventListener("click", () => {
      if (n.v <= 1) return;
      n.v--;
      update();
    });
    rstBtn.addEventListener("click", () => { n.v = 1; update(); });

    const controls = $("div", { class: "btn-row" });
    controls.append(addBtn, rmBtn, rstBtn);

    // Transición a relaciones
    function renderTrans() {
      trans.innerHTML = "";
      if (n.v >= 3) {
        trans.appendChild(coach("Un sistema no depende únicamente de <b>cuántos elementos posee</b>.<br/>" +
          "También debemos observar <strong>cómo pueden relacionarse</strong>.", "coach--complex"));
        const btn = $("button", { class: "btn btn-complex btn-lg", html: "ACTIVAR RELACIONES" });
        btn.addEventListener("click", () => {
          api.goToExperiment(2, { initialN: n.v });
        });
        trans.appendChild($("div", { class: "btn-row", style: { justifyContent: "center", marginTop: "8px" } }, btn));
      }
    }
    renderTrans();

    shell.side.append(
      $("div", { class: "panel-block", children: [coachBox, controls] }),
      $("div", { class: "panel-block", children: [trans] })
    );
    return () => reactor.net.destroy();
  }

  /* ---------- EXPERIMENTO 2 · RELACIONES ---------- */
  function buildExp2(host, expDef, api, opts) {
    const shell = createShell(host, expDef, api);
    const initialN = Math.min(20, Math.max(1, (opts && opts.initialN) || 3));
    const n = { v: initialN };
    let mode = "partial"; // 'partial' | 'max'

    shell.mainTop.appendChild(
      $("div", { class: "panel-block", html: '<div class="inst-block">' +
        "En <b>relaciones parciales</b> tú decides qué conectar. En <b>relaciones máximas</b> el sistema genera todas las conexiones posibles: " +
        "<strong>R = n(n−1)/2</strong>.</div>" })
    );

    const reactor = makeReactor(shell.main, {
      netOpts: {
        labels: true, heat: true, layout: "organic", interactive: true, mode: "link", edgesAllowed: true,
        onLink: (a, b) => {
          if (mode === "max") return false;
          const added = reactor.net.addEdge(a, b, { animate: true });
          if (added) afterStructureChange(true);
          return added;
        },
        onEdgeClick: (edge) => edgeInspect(reactor.net, edge)
      },
      hint: "Pulsa un elemento y luego otro para crear una relación"
    });

    // contadores y fórmula
    const counters = CL.LabPanel.countersEl();
    const formula = CL.LabPanel.formulaEl();
    const counterPanel = $("div", { class: "panel-block" });
    counterPanel.append(
      $("div", { class: "panel-title", html: '<span class="dot"></span>CONTADORES EN TIEMPO REAL' }),
      counters
    );
    const formulaPanel = $("div", { class: "panel-block" });
    formulaPanel.append(
      $("div", { class: "panel-title", html: '<span class="dot"></span>ANALIZADOR MATEMÁTICO' }),
      formula
    );

    const chartHost = $("div", { class: "chart-shell" });
    const chart = CL.Chart.create(chartHost);

    const statsPanel = $("div", { class: "panel-block" });
    statsPanel.append($("div", { class: "chart-title", html: "GRÁFICA EN TIEMPO REAL" }), chartHost);

    const slider = CL.LabPanel.sliderEl({
      min: 1, max: 20, value: n.v, label: "ELEMENTOS",
      onInput: (v) => {
        n.v = v;
        reactor.net.setNodes(v);
        if (mode === "max") reactor.net.completeAll();
        afterStructureChange();
      }
    });

    const modeToggle = $("div", { class: "mode-toggle" });
    const btnPartial = $("button", { html: "Relaciones parciales" });
    const btnMax = $("button", { html: "Relaciones máximas" });
    btnPartial.addEventListener("click", () => setMode("partial"));
    btnMax.addEventListener("click", () => setMode("max"));
    modeToggle.append(btnPartial, btnMax);

    function setMode(m) {
      mode = m;
      btnPartial.classList.toggle("is-active", m === "partial");
      btnMax.classList.toggle("is-active", m === "max");
      reactor.net.setMode(m === "max" ? "inspect" : "link");
      reactor.setHint(m === "max" ? "Modo máximo: todas las conexiones posibles se dibujan" : "Pulsa un elemento y luego otro para crear una relación");
      if (m === "max") {
        CL.Audio.play("complete");
        reactor.net.completeAll({ animate: true });
        reactor.net.pulseAll(0.03);
        afterStructureChange();
      }
    }
    setMode(mode);

    const layoutRow = $("div", { class: "reactor-tools" });
    ["organic", "circular", "grid", "radial"].forEach((l) => {
      const b = $("button", { class: "btn btn-ghost btn-sm", html: l.toUpperCase() });
      b.addEventListener("click", () => reactor.net.setLayout(l));
      layoutRow.appendChild(b);
    });
    reactor.shell.appendChild(layoutRow);

    function afterStructureChange(linkAdded) {
      const r = reactor.net.getEdgeCount();
      CL.LabPanel.updateCounters(counters, n.v, r);
      CL.LabPanel.updateFormula(formula, n.v, r);
      chart.update(n.v);
      const Rmax = CL.Math.maxRelations(n.v);
      // momento pedagógico en n=10
      if (n.v >= 10) {
        const s = CL.State.get();
        if (!s.stats.reachedTen) {
          s.stats.reachedTen = true;
          CL.Audio.play("achievement");
          CL.UI.toast("<b>10 elementos</b> pero <b>45 relaciones máximas</b>. El número de elementos aumentó en 10 unidades, pero las relaciones posibles crecieron mucho más rápidamente.", "ach", "flame");
        }
      }
      if (r >= Rmax && Rmax > 0) {
        onFullNetwork(n.v);
      }
      CL.Storage.saveSoon();
    }

    let fullAwarded = false;
    const onFullNetwork = (vn) => {
      if (fullAwarded) return;
      fullAwarded = true;
      reactor.setOverlay("RED COMPLETA — TODAS LAS RELACIONES POSIBLES", true);
      setTimeout(() => reactor.setOverlay("", false), 2600);
      reactor.net.pulseAll(0.02);
      CL.Scoring.fullNetwork();
      if (vn >= 6) api.markExperimentDone("relations");
    };

    const afterAwardedReset = () => {
      if (reactor.net.getEdgeCount() < CL.Math.maxRelations(n.v)) fullAwarded = false;
    };

    // ---- VER CRECIMIENTO ----
    const growth = { running: false, timer: null, paused: false, target: 15 };
    const growBtn = $("button", { class: "btn btn-primary", html: CL.UI.icon("play", 14) + " VER CRECIMIENTO" });
    const pauseBtn = $("button", { class: "btn btn-ghost btn-sm", html: "PAUSAR", hidden: true });
    const stopBtn = $("button", { class: "btn btn-ghost btn-sm", html: "REINICIAR", hidden: true });

    function growthTick() {
      if (!growth.running || growth.paused) return;
      n.v++;
      if (n.v > growth.target) { stopGrowth(); return; }
      slider.querySelector("input").value = n.v;
      slider.querySelector(".slider-value").textContent = n.v;
      reactor.net.setNodes(n.v);
      if (mode === "max") reactor.net.completeAll({ animate: true });
      else if (mode === "partial") reactor.net.completeAll({ animate: true, }); // mostrar el potencial en parcial también
      afterStructureChange();
      growth.timer = setTimeout(growthTick, 620);
    }
    function startGrowth() {
      if (growth.running) return;
      n.v = 1;
      growth.running = true; growth.paused = false;
      growBtn.hidden = true; pauseBtn.hidden = false; stopBtn.hidden = false;
      slider.querySelector("input").value = 1;
      slider.querySelector(".slider-value").textContent = "1";
      reactor.net.setNodes(1);
      if (mode === "max") reactor.net.completeAll();
      afterStructureChange();
      growth.timer = setTimeout(growthTick, 620);
    }
    function stopGrowth() {
      growth.running = false;
      clearTimeout(growth.timer);
      growBtn.hidden = false; pauseBtn.hidden = true; stopBtn.hidden = true;
      growth.paused = false;
    }
    growBtn.addEventListener("click", startGrowth);
    pauseBtn.addEventListener("click", () => {
      growth.paused = !growth.paused;
      pauseBtn.textContent = growth.paused ? "CONTINUAR" : "PAUSAR";
    });
    stopBtn.addEventListener("click", stopGrowth);

    // acciones de relaciones
    const clearBtn = $("button", { class: "btn btn-ghost btn-sm", html: "LIMPIAR RELACIONES" });
    const completeBtn = $("button", { class: "btn btn-ghost btn-sm", html: "COMPLETAR TODAS" });
    clearBtn.addEventListener("click", () => {
      reactor.net.clearEdges();
      fullAwarded = false;
      afterStructureChange();
    });
    completeBtn.addEventListener("click", () => {
      reactor.net.completeAll({ animate: true });
      reactor.net.pulseAll(0.02);
      afterStructureChange();
    });

    // inspección toggle
    const inspectToggle = $("button", { class: "btn btn-ghost btn-sm", html: "INSPECCIONAR" });
    let inspectOn = false;
    inspectToggle.addEventListener("click", () => {
      inspectOn = !inspectOn;
      inspectToggle.classList.toggle("btn-primary", inspectOn);
      inspectToggle.classList.toggle("btn-ghost", !inspectOn);
      reactor.net.setMode(inspectOn ? "inspect" : "link");
      reactor.setHint(inspectOn ? "Pulsa un elemento para inspeccionarlo" : "Pulsa un elemento y luego otro para crear una relación");
    });

    shell.side.append(
      $("div", { class: "panel-block", children: [modeToggle, $("div", { style: { height: "10px" } }), slider] }),
      counterPanel,
      formulaPanel,
      statsPanel,
      $("div", { class: "panel-block", children: [
        $("div", { class: "btn-row", children: [growBtn, pauseBtn, stopBtn] }),
        $("div", { class: "btn-row", style: { marginTop: "8px" }, children: [clearBtn, completeBtn, inspectToggle] })
      ] })
    );

    reactor.net.setNodes(n.v);
    if (mode === "max") reactor.net.completeAll();
    afterStructureChange();

    return () => { stopGrowth(); reactor.net.destroy(); };
  }

  /* ---------- EXPERIMENTO 3 · ORDEN DE COMPLEJIDAD ---------- */
  function buildExp3(host, expDef, api) {
    const shell = createShell(host, expDef, api);
    const n = { v: 3 };

    shell.mainTop.appendChild(
      $("div", { class: "panel-block", html: '<div class="inst-block">' +
        "El <b>orden de complejidad</b> es <strong>C = n + R</strong>: la suma de sus elementos y sus relaciones. " +
        "Cuando existen todas las relaciones posibles, <strong>C = n + n(n−1)/2</strong>.</div>" })
    );

    const reactor = makeReactor(shell.main, {
      netOpts: { labels: true, heat: false, layout: "circular", interactive: true, mode: "inspect", edgesAllowed: false,
        onNodeClick: (id) => nodeInspect(reactor.net, id) },
      hint: "Desliza para cambiar la cantidad de elementos"
    });

    const blocks = CL.LabPanel.blocksEl();
    const legend = $("div", { class: "block-legend" });
    legend.innerHTML =
      '<span class="legend-chip"><span class="legend-swatch swatch-elements"></span>Elementos</span>' +
      '<span class="legend-chip"><span class="legend-swatch swatch-relations"></span>Relaciones máximas</span>';
    const formula = CL.LabPanel.formulaEl();

    const counterPanel = $("div", { class: "panel-block" });
    counterPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>ANALIZADOR MATEMÁTICO' }), formula);

    const blockPanel = $("div", { class: "panel-block" });
    blockPanel.append(
      $("div", { class: "panel-title", html: '<span class="dot"></span>VISUALIZACIÓN EN BLOQUES' }),
      legend, blocks
    );

    const slider = CL.LabPanel.sliderEl({
      min: 1, max: 20, value: n.v, label: "ELEMENTOS",
      onInput: (v) => { n.v = v; update(); }
    });

    let coachBox = $("div");
    function update() {
      const R = CL.Math.maxRelations(n.v);
      reactor.net.setNodes(n.v);
      reactor.net.completeAll({ animate: false });
      CL.LabPanel.updateBlocks(blocks, n.v, R);
      CL.LabPanel.updateFormula(formula, n.v, R);
      coachBox.innerHTML = "";
      const C = CL.Math.maxComplexity(n.v);
      if (n.v < 6) coachBox.appendChild(coach("Con <b>" + n.v + "</b> elementos: <b>" + R + "</b> relaciones máximas. El sistema es <strong>sencillo</strong>."));
      else if (n.v < 12) coachBox.appendChild(coach("Con <b>" + n.v + "</b> elementos ya hay <b>" + R + "</b> relaciones. Observa cómo <strong>las líneas empiezan a dominar</strong> la red."));
      else coachBox.appendChild(coach("Con <b>" + n.v + "</b> elementos: <b>" + R + "</b> relaciones máximas y C = <strong class='ck'>" + C + "</strong>. Las relaciones representan la mayor parte de la complejidad."));
      if (n.v >= 12) api.markExperimentDone("order");
    }
    update();

    // proporción visual n vs R
    function proportionPanel() {
      const wrap = $("div", { class: "panel-block" });
      const title = $("div", { class: "panel-title", html: '<span class="dot"></span>ELEMENTOS vs RELACIONES' });
      const bar = $("div", { class: "ch-progress-bar" });
      const fill = $("span", { style: { width: "0%", background: "var(--violet)" } });
      bar.appendChild(fill);
      const lbl = $("div", { class: "chart-legend", style: { marginTop: "8px" } });
      wrap.append(title, bar, lbl);
      return wrap;
    }
    const propPanel = proportionPanel();
    const propFill = propPanel.querySelector("span");
    const propLbl = propPanel.querySelector(".chart-legend");
    const updateProp = () => {
      const R = CL.Math.maxRelations(n.v);
      const tot = n.v + R;
      const p = tot > 0 ? (R / tot) * 100 : 0;
      propFill.style.width = p + "%";
      propLbl.innerHTML = '<span class="legend-chip"><span class="legend-line legend-line--r"></span>Relaciones: ' + p.toFixed(0) + "% de C</span>";
    };
    // enlazar update
    const _u = update;
    update = function () { _u(); updateProp(); };

    shell.side.append(
      $("div", { class: "panel-block", children: [slider] }),
      counterPanel,
      blockPanel,
      propPanel
    );

    return () => reactor.net.destroy();
  }

  /* ---------- EXPERIMENTO 4 · SIMPLE VS. COMPLEJO ---------- */
  /* ---------- EXPERIMENTO 4 · SIMPLE VS. COMPLEJO ---------- */
  function buildExp4(host, expDef, api) {
    const shell = createShell(host, expDef, api);
    const phase = { v: 1 }; // 1 manipular · 2 elegir mayor · 3 mismo nº de elementos

    const coachBox = $("div");
    shell.mainTop.appendChild($("div", { class: "panel-block", children: [coachBox] }));

    const compareWrap = $("div", { class: "compare-wrap" });
    shell.main.appendChild(compareWrap);

    const sysA = { n: 3, edges: [[1, 2], [2, 3]] };
    const sysB = { n: 6, edges: null }; // null = máximo

    function allPairs(n) {
      const out = [];
      for (let i = 1; i <= n; i++) for (let j = i + 1; j <= n; j++) out.push([i, j]);
      return out;
    }
    function pickEdges(n, count) {
      const all = allPairs(n);
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      return all.slice(0, Math.min(count, all.length));
    }

    function buildCard(name, klass) {
      const card = $("div", { class: "compare-card " + klass, dataset: { sys: name } });
      const head = $("div", { class: "compare-head" });
      const nm = $("div", { class: "compare-name", html: "SISTEMA " + name });
      const meta = $("div", { class: "compare-meta", html: "" });
      head.append(nm, meta);
      const netHost = $("div", {
        style: {
          height: "190px", position: "relative", borderRadius: "12px", overflow: "hidden",
          border: "1px solid var(--line-faint)", background: "rgba(6,10,24,0.5)"
        }
      });
      const net = CL.Network.create(netHost, {
        labels: true, heat: false, layout: "circular", interactive: false, edgesAllowed: false
      });
      const cRow = $("div", {
        class: "compare-meta", style: { marginTop: "6px" },
        html: "Orden de complejidad: <b style='color:var(--complex)'>C = 0</b>"
      });
      const cVal = cRow.querySelector("b");
      const controls = $("div", { style: { marginTop: "8px" } });
      card.append(head, netHost, cRow, controls);
      return { card: card, net: net, meta: meta, cVal: cVal, controls: controls };
    }

    const sysACard = buildCard("A", "compare-card--a");
    const sysBCard = buildCard("B", "compare-card--b");
    compareWrap.append(sysACard.card, sysBCard.card);

    function updateSys(card, sys, editable) {
      const R = sys.edges === null ? CL.Math.maxRelations(sys.n) : sys.edges.length;
      card.meta.innerHTML = sys.n + " elementos · " + R + " relaciones";
      card.net.setNodes(sys.n);
      if (sys.edges === null) card.net.completeAll({ animate: true });
      else card.net.setEdges(sys.edges, { animate: true });
      card.cVal.innerHTML = "C = " + CL.Math.complexity(sys.n, R);
      card.controls.innerHTML = "";
      if (editable) {
        const addN = $("button", { class: "btn btn-ghost btn-sm", html: "+ elemento" });
        const rmN = $("button", { class: "btn btn-ghost btn-sm", html: "− elemento" });
        addN.addEventListener("click", () => { if (sys.n < 10) { sys.n++; render(); } });
        rmN.addEventListener("click", () => { if (sys.n > 1) { sys.n--; render(); } });
        card.controls.append(addN, rmN);
        const addR = $("button", { class: "btn btn-ghost btn-sm", html: "+ relación" });
        const maxB = $("button", { class: "btn btn-ghost btn-sm", html: "Máximo" });
        addR.addEventListener("click", () => {
          if (sys.edges === null) return;
          const pairs = allPairs(sys.n).filter((p) => !sys.edges.some((e) => e[0] === p[0] && e[1] === p[1]));
          if (pairs.length) { sys.edges.push(pairs[0]); render(); }
        });
        maxB.addEventListener("click", () => { sys.edges = null; render(); });
        card.controls.append(addR, maxB);
      }
    }

    function Cval(sys) {
      return CL.Math.complexity(sys.n, sys.edges === null ? CL.Math.maxRelations(sys.n) : sys.edges.length);
    }

    function render() {
      sysACard.card.classList.remove("is-selected");
      sysBCard.card.classList.remove("is-selected");
      updateSys(sysACard, sysA, phase.v === 1);
      updateSys(sysBCard, sysB, phase.v === 1);
      renderPhase();
    }

    const side = $("div");

    function renderPhase() {
      coachBox.innerHTML = "";
      side.innerHTML = "";
      if (phase.v === 1) {
        coachBox.appendChild(coach("Compara dos sistemas manipulando <b>Sistema A</b> (pocos elementos, pocas relaciones) y <b>Sistema B</b> (más elementos, más relaciones). Observa sus <strong class='ck'>órdenes de complejidad</strong>."));
        const diff = $("div", { class: "panel-block" });
        const dv = $("div", {
          style: { fontSize: "18px", fontFamily: "var(--font-mono)" },
          html: "A = <b style='color:var(--cyan)'>" + Cval(sysA) + "</b> &nbsp;·&nbsp; B = <b style='color:var(--violet)'>" + Cval(sysB) + "</b>"
        });
        const note = $("div", { class: "inst-block", style: { marginTop: "8px" } });
        const refreshNote = () => {
          const higher = Cval(sysA) >= Cval(sysB) ? "A" : "B";
          note.innerHTML = "El sistema con <b>mayor orden de complejidad</b> es el <strong>Sistema " + higher + "</strong> (" + (higher === "A" ? Cval(sysA) : Cval(sysB)) + ").<br/><em>Complejidad ≠ cantidad de elementos: también cuentan las relaciones.</em>";
        };
        refreshNote();
        diff.append(dv, note);
        side.appendChild(diff);
        const btn = $("button", { class: "btn btn-primary", html: "PROBARSE: ELEGIR LA MÁS COMPLEJA →" });
        btn.addEventListener("click", () => { phase.v = 2; render(); });
        side.appendChild($("div", { class: "btn-row", style: { marginTop: "10px" }, children: [btn] }));
      } else if (phase.v === 2) {
        coachBox.appendChild(coach("<b>Desafío de comparación.</b> ¿Cuál de las dos redes tiene <strong class='ck'>mayor orden de complejidad</strong>? Toca directamente la red que elijas."));
        const nA2 = 3 + Math.floor(Math.random() * 2);
        const nB2 = 4 + Math.floor(Math.random() * 4);
        const rA = 1 + Math.floor(Math.random() * Math.max(1, CL.Math.maxRelations(nA2) - 1));
        const rB = Math.max(2, CL.Math.maxRelations(nB2) - Math.floor(Math.random() * 4));
        const sA2 = { n: nA2, edges: pickEdges(nA2, Math.min(rA, CL.Math.maxRelations(nA2))) };
        const sB2 = { n: nB2, edges: pickEdges(nB2, Math.min(rB, CL.Math.maxRelations(nB2))) };
        updateSys(sysACard, sA2, false);
        updateSys(sysBCard, sB2, false);
        const C2A = Cval(sA2), C2B = Cval(sB2);
        const answer = C2A >= C2B ? "A" : "B";
        let answered = false;
        [["A", sysACard], ["B", sysBCard]].forEach((pair) => {
          const lbl = pair[0], card = pair[1];
          card.card.addEventListener("click", function pick() {
            if (answered || phase.v !== 2) return;
            answered = true;
            card.card.classList.add("is-selected");
            if (lbl === answer) {
              CL.Audio.play("correct");
              side.appendChild(coach("Correcto. El <b>Sistema " + lbl + "</b> tiene mayor orden de complejidad. Cálculo: A = " + C2A + " (n=" + sA2.n + ", R=" + sA2.edges.length + ") y B = " + C2B + " (n=" + sB2.n + ", R=" + sB2.edges.length + "). La complejidad depende de los elementos <em>y</em> de sus relaciones.", "coach--ok"));
            } else {
              CL.Audio.play("error");
              side.appendChild(coach("Observa nuevamente la red. Revisa cuántos elementos y cuántas relaciones tiene cada sistema. El de mayor complejidad era el <b>Sistema " + answer + "</b> con C = " + (answer === "A" ? C2A : C2B) + ".", "coach--err"));
            }
            const next = $("button", { class: "btn btn-primary", html: "CONTINUAR →" });
            next.addEventListener("click", () => { phase.v = 3; render(); });
            side.appendChild($("div", { class: "btn-row", style: { marginTop: "10px" }, children: [next] }));
          });
        });
      } else {
        coachBox.appendChild(coach("<b>Escenario clave:</b> dos sistemas con <strong>6 elementos</strong>. El Sistema A tiene 5 relaciones; el Sistema B tiene 13. ¿Cuál presenta mayor complejidad?<br/><br/><em>Esto refuerza: no basta contar elementos.</em>"));
        const sA3 = { n: 6, edges: pickEdges(6, 5) };
        const sB3 = { n: 6, edges: pickEdges(6, 13) };
        updateSys(sysACard, sA3, false);
        updateSys(sysBCard, sB3, false);
        let answered3 = false;
        [["A", sysACard, 5], ["B", sysBCard, 13]].forEach((pair) => {
          const lbl = pair[0], card = pair[1], r = pair[2];
          card.card.addEventListener("click", function pick3() {
            if (answered3 || phase.v !== 3) return;
            answered3 = true;
            card.card.classList.add("is-selected");
            if (lbl === "B") {
              CL.Audio.play("correct");
              side.appendChild(coach("Correcto. El <b>Sistema B</b> presenta mayor complejidad: A = 6 + 5 = <b>11</b> mientras que B = 6 + 13 = <b>19</b>. Mismos elementos, distinta conectividad → distinta complejidad.", "coach--ok"));
              api.markExperimentDone("compare");
            } else {
              CL.Audio.play("error");
              side.appendChild(coach("Compara la cantidad de relaciones: con los mismos 6 elementos, el Sistema B tiene más relaciones (13 frente a 5), así que su orden de complejidad es mayor (19 frente a 11).", "coach--err"));
            }
            const fin = $("button", { class: "btn btn-complex", html: "SIGUIENTE: SINERGIA →" });
            fin.addEventListener("click", () => api.goToExperiment(5));
            side.appendChild($("div", { class: "btn-row", style: { marginTop: "10px" }, children: [fin] }));
          });
        });
      }
    }

    render();
    shell.side.appendChild(side);

    return () => { sysACard.net.destroy(); sysBCard.net.destroy(); };
  }
  /* ---------- EXPERIMENTO 5 · SINERGIA ---------- */
  function buildExp5(host, expDef, api) {
    const shell = createShell(host, expDef, api);
    const members = [
      { id: 1, name: "Análisis", cap: "ENTENDER EL PROBLEMA" },
      { id: 2, name: "Diseño", cap: "PLANEAR LA SOLUCIÓN" },
      { id: 3, name: "Desarrollo", cap: "CONSTRUIR" },
      { id: 4, name: "Pruebas", cap: "VERIFICAR" }
    ];
    const capacity = {};
    members.forEach((m) => { capacity[m.id] = m.cap; });
    const names = {};
    members.forEach((m) => { names[m.id] = m.name; });

    shell.mainTop.appendChild(
      $("div", { class: "panel-block", html: '<div class="inst-block">' +
        "<b>Sinergia:</b> el comportamiento del conjunto surge de la interacción entre sus partes. " +
        "Cada elemento por separado tiene una capacidad. Al relacionarse, aparece el <strong>comportamiento del conjunto</strong>.</div>" })
    );

    const reactor = makeReactor(shell.main, {
      netOpts: {
        labels: true, heat: false, layout: "circular", interactive: true, mode: "link", edgesAllowed: true,
        capacity: capacity, nodeLabelPrefix: "", // usamos nombres
        onLink: (a, b) => {
          const added = reactor.net.addEdge(a, b, { animate: true });
          if (added) { afterChange(); CL.Audio.play("link"); }
          return added;
        }
      },
      hint: "Conecta los miembros del equipo"
    });
    // etiquetas con nombre
    reactor.net._rebuildNodes = reactor.net._rebuildNodes; // no-op, usamos labels normales y overlay
    // Cambiamos etiquetas a nombres
    const setNames = () => {
      Object.keys(reactor.net.nodeEls).forEach((id) => {
        const g = reactor.net.nodeEls[id];
        const lbl = g.querySelector(".node-label");
        if (lbl) lbl.textContent = names[id] ? names[id].toUpperCase() : "E" + id;
      });
    };
    const _buildNodeEl = reactor.net._buildNodeEl.bind(reactor.net);
    reactor.net._buildNodeEl = function (node, opts) {
      const g = _buildNodeEl(node, opts);
      const lbl = g.querySelector(".node-label");
      if (lbl) lbl.textContent = names[node.id] ? names[node.id].toUpperCase() : "E" + node.id;
      return g;
    };
    reactor.net.setNodes(4);

    const partsBox = $("div", { class: "panel-block" });
    const emergentBox = $("div", { class: "emergent-box", hidden: true });

    const result = $("div", { class: "panel-block" });

    function afterChange() {
      const edges = reactor.net.getEdgeCount();
      const total = CL.Math.maxRelations(4);
      const connected = edges >= total;
      // partes + relaciones
      partsBox.innerHTML = "";
      partsBox.appendChild($("div", { class: "panel-title", html: '<span class="dot"></span>LAS PARTES' }));
      const caps = $("div", { class: "capacity-list" });
      members.forEach((m) => caps.appendChild($("span", { class: "capacity-chip", html: m.cap })));
      partsBox.appendChild(caps);

      const flow = $("div", { class: "synergy-flow" });
      flow.innerHTML =
        '<span class="sf-chip sf-parts">PARTES</span><span class="sf-arrow">+</span>' +
        '<span class="sf-chip sf-rel">RELACIONES (' + edges + '/' + total + ')</span><span class="sf-arrow">→</span>' +
        '<span class="sf-chip sf-out">COMPORTAMIENTO DEL CONJUNTO</span>';
      result.innerHTML = "";
      result.appendChild($("div", { class: "panel-title", html: '<span class="dot"></span>PARTES + RELACIONES → COMPORTAMIENTO DEL CONJUNTO' }));
      result.appendChild(flow);

      emergentBox.hidden = !connected;
      if (connected) {
        emergentBox.innerHTML = "";
        emergentBox.appendChild($("div", { class: "em-title", html: "COMPORTAMIENTO DEL CONJUNTO" }));
        emergentBox.appendChild($("p", { html: "El equipo <b>analiza</b>, <b>diseña</b>, <b>desarrolla</b> y <b>prueba</b> de manera coordinada: el resultado conjunto surge de la interacción de las partes, no de ninguna de ellas aislada. Eso es <strong>sinergia</strong>." }));
        CL.Audio.play("complete");
        reactor.net.pulseAll(0.06);
        api.markExperimentDone("synergy");
      }
    }
    afterChange();

    const toggleBtn = $("button", { class: "btn btn-primary", html: "CONECTAR EQUIPO" });
    const clearBtn = $("button", { class: "btn btn-ghost", html: "SEPARAR" });
    toggleBtn.addEventListener("click", () => {
      reactor.net.completeAll({ animate: true });
      reactor.net.pulseAll(0.04);
      afterChange();
    });
    clearBtn.addEventListener("click", () => {
      reactor.net.clearEdges();
      afterChange();
    });

    shell.side.append(
      result,
      partsBox,
      emergentBox,
      $("div", { class: "panel-block", children: [$("div", { class: "btn-row", children: [toggleBtn, clearBtn] })] })
    );
    setNames();

    return () => reactor.net.destroy();
  }

  /* ============================================================
     Caparazón común y despachador
     ============================================================ */
  function createShell(host, expDef, api) {
    host.innerHTML = "";
    const bar = expTopbar(expDef, { onBack: () => api.goMap() });
    const steps = bar.steps;
    setSteps(steps, 5, CL.Experiments.DEFS.findIndex((e) => e.id === expDef.id));

    const grid = $("div", { class: "lab-grid" });
    const main = $("div", { class: "lab-main" });
    const side = $("div", { class: "lab-side" });
    const mainTop = $("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } });
    main.appendChild(mainTop);
    grid.append(main, side);
    host.append(bar.bar, grid);
    return { mainTop: mainTop, main: main, side: side, host: host };
  }

  const BUILDERS = {
    elements: buildExp1,
    relations: buildExp2,
    order: buildExp3,
    compare: buildExp4,
    synergy: buildExp5
  };

  function build(host, index, api) {
    const def = CL.Experiments.byIndex(index);
    if (!def) return () => {};
    const builder = BUILDERS[def.id];
    if (!builder) return () => {};
    return builder(host, def, api);
  }

  CL.ExperimentsHost = {
    build: build,
    nodeInspect: nodeInspect,
    edgeInspect: edgeInspect,
    makeReactor: makeReactor
  };
})(window.ComplexityLab = window.ComplexityLab || {});
