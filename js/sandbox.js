/* ============================================================
   COMPLEXITY LAB · js/sandbox.js
   MODO LIBRE — sin puntuación, experimentación ilimitada.
   1–20 elementos · relaciones manuales · conectividad máxima ·
   borrar · congelar · disposiciones · fórmulas · gráfica ·
   etiquetas.
   ============================================================ */
(function (CL) {
  "use strict";

  const $ = CL.UI.el;

  function build(host, api) {
    host.innerHTML = "";
    const n = { v: 6 };
    let frozen = false;

    const bar = $("div", { class: "exp-topbar" });
    const left = $("div", { style: { display: "flex", alignItems: "center", gap: "10px" } });
    const back = $("button", { class: "btn btn-ghost btn-sm", html: CL.UI.icon("back", 14) + " Volver" });
    back.addEventListener("click", () => api.goMap());
    const title = $("div", { class: "exp-title", html: "MODO LIBRE · <span>SANDBOX</span>" });
    const badge = $("span", { class: "note-chip", html: "sin puntuación · experimenta" });
    left.append(back, title);
    bar.append(left, badge);

    const grid = $("div", { class: "lab-grid" });
    const main = $("div", { class: "lab-main" });
    const side = $("div", { class: "lab-side" });
    grid.append(main, side);
    host.append(bar, grid);

    const reactor = CL.ExperimentsHost.makeReactor(main, {
      netOpts: {
        labels: true, heat: true, layout: "organic", interactive: true, mode: "link", edgesAllowed: true,
        onLink: (a, b) => {
          if (reactor.net.addEdge(a, b, { animate: true })) { CL.Audio.play("link"); update(); return true; }
          return false;
        },
        onEdgeClick: (edge) => {
          CL.ExperimentsHost.edgeInspect(reactor.net, edge);
          CL.Audio.play("select");
        },
        onNodeClick: (id) => {
          if (inspectMode) CL.ExperimentsHost.nodeInspect(reactor.net, id);
        }
      },
      hint: "Pulsa dos elementos para crear una relación"
    });

    // contadores + fórmula + gráfica
    const counters = CL.LabPanel.countersEl();
    const counterPanel = $("div", { class: "panel-block" });
    counterPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>CONTADORES EN TIEMPO REAL' }), counters);
    const formula = CL.LabPanel.formulaEl();
    const formulaPanel = $("div", { class: "panel-block" });
    formulaPanel.append($("div", { class: "panel-title", html: '<span class="dot"></span>ANALIZADOR MATEMÁTICO' }), formula);
    const chartHost = $("div", { class: "chart-shell" });
    const chart = CL.Chart.create(chartHost);
    const chartPanel = $("div", { class: "panel-block" });
    chartPanel.append($("div", { class: "chart-title", html: "GRÁFICA" }), chartHost);

    const slider = CL.LabPanel.sliderEl({
      min: 1, max: 20, value: n.v, label: "ELEMENTOS",
      onInput: (v) => { n.v = v; reactor.net.setNodes(v); update(); }
    });

    const modeToggle = $("div", { class: "mode-toggle" });
    const bPartial = $("button", { html: "Manual" });
    const bMax = $("button", { html: "Máxima" });
    bPartial.addEventListener("click", () => setMode("partial"));
    bMax.addEventListener("click", () => setMode("max"));
    modeToggle.append(bPartial, bMax);
    function setMode(m) {
      reactor.net.setMode(m === "max" ? "inspect" : "link");
      bPartial.classList.toggle("is-active", m === "partial");
      bMax.classList.toggle("is-active", m === "max");
      if (m === "max") {
        reactor.net.completeAll({ animate: true });
        reactor.net.pulseAll(0.03);
        update();
      }
    }
    setMode("partial");

    const layoutRow = $("div", { class: "reactor-tools" });
    ["organic", "circular", "grid", "radial"].forEach((l) => {
      const b = $("button", { class: "btn btn-ghost btn-sm", html: l.toUpperCase() });
      b.addEventListener("click", () => reactor.net.setLayout(l));
      layoutRow.appendChild(b);
    });
    reactor.shell.appendChild(layoutRow);

    let inspectMode = false;
    function update() {
      const r = reactor.net.getEdgeCount();
      CL.LabPanel.updateCounters(counters, n.v, r);
      CL.LabPanel.updateFormula(formula, n.v, r);
      chart.update(n.v);
      CL.Storage.saveSoon();
    }

    // botones de herramientas
    const clearBtn = $("button", { class: "btn btn-ghost btn-sm", html: "BORRAR RELACIONES" });
    const completeBtn = $("button", { class: "btn btn-ghost btn-sm", html: "COMPLETAR MÁXIMO" });
    const freezeBtn = $("button", { class: "btn btn-ghost btn-sm", html: "CONGELAR NODOS" });
    const labelsBtn = $("button", { class: "btn btn-ghost btn-sm", html: "ETIQUETAS: SÍ" });
    const inspectBtn = $("button", { class: "btn btn-ghost btn-sm", html: "INSPECCIONAR" });

    clearBtn.addEventListener("click", () => { reactor.net.clearEdges(); update(); });
    completeBtn.addEventListener("click", () => { reactor.net.completeAll({ animate: true }); reactor.net.pulseAll(0.03); update(); });
    freezeBtn.addEventListener("click", () => {
      frozen = !frozen;
      reactor.net.nodes.forEach((node) => { node.fixed = frozen; });
      freezeBtn.classList.toggle("btn-primary", frozen);
      freezeBtn.classList.toggle("btn-ghost", !frozen);
      freezeBtn.textContent = frozen ? "DESCONGELAR NODOS" : "CONGELAR NODOS";
    });
    let labelsOn = true;
    labelsBtn.addEventListener("click", () => {
      labelsOn = !labelsOn;
      reactor.net.setLabels(labelsOn);
      labelsBtn.textContent = labelsOn ? "ETIQUETAS: SÍ" : "ETIQUETAS: NO";
    });
    inspectBtn.addEventListener("click", () => {
      inspectMode = !inspectMode;
      inspectBtn.classList.toggle("btn-primary", inspectMode);
      inspectBtn.classList.toggle("btn-ghost", !inspectMode);
    });

    reactor.net.setNodes(n.v);
    update();

    side.append(
      $("div", { class: "panel-block", children: [modeToggle, $("div", { style: { height: "10px" } }), slider] }),
      counterPanel,
      formulaPanel,
      chartPanel,
      $("div", { class: "panel-block", children: [
        $("div", { class: "btn-row", children: [clearBtn, completeBtn] }),
        $("div", { class: "btn-row", style: { marginTop: "8px" }, children: [freezeBtn, labelsBtn, inspectBtn] })
      ] })
    );

    return () => { chart.destroy(); reactor.net.destroy(); };
  }

  CL.Sandbox = { build: build };
})(window.ComplexityLab = window.ComplexityLab || {});
