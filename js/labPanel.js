/* ============================================================
   COMPLEXITY LAB · js/labPanel.js
   Componentes reutilizables de panel de laboratorio:
   contadores en vivo, analizador matemático, bloques de
   complejidad, slider, barra de progreso, contador grande.
   ============================================================ */
(function (CL) {
  "use strict";

  /* ---- Contadores en tiempo real ---- */
  function countersEl() {
    const cells = [
      ["ELEMENTOS", "stat-elements", "stat-cell--elements", "0"],
      ["RELACIONES", "stat-relations", "stat-cell--relations", "0"],
      ["RELACIONES POSIBLES", "stat-possible", "stat-cell--possible", "0"],
      ["ORDEN ACTUAL", "stat-actual", "stat-cell--actualC", "0"],
      ["COMPLEJIDAD MÁXIMA", "stat-max", "stat-cell--maxC", "0"]
    ];
    const strip = CL.UI.el("div", { class: "stat-strip" });
    cells.forEach((c) => {
      const cell = CL.UI.el("div", { class: "stat-cell " + c[2], dataset: { cell: c[1] } });
      cell.append(
        CL.UI.el("span", { class: "stat-label", html: c[0] }),
        CL.UI.el("b", { class: "stat-value", dataset: { v: "0" }, html: c[3] })
      );
      strip.appendChild(cell);
    });
    return strip;
  }

  function updateCounters(root, n, r, opts) {
    opts = opts || {};
    const R = CL.Math.maxRelations(n);
    const C = CL.Math.complexity(n, r);
    const Cm = CL.Math.maxComplexity(n);
    const set = (name, val, cellClass) => {
      const cell = root.querySelector('[data-cell="' + name + '"]');
      if (!cell) return;
      const v = cell.querySelector(".stat-value");
      const prev = parseInt(v.dataset.v || "0", 10);
      if (prev !== val) {
        if (opts.animate !== false) {
          if (opts.flash) { v.dataset.v = String(val); CL.UI.flash(v); }
          else CL.UI.animateNumber(v, val, 300, prev);
        } else {
          v.dataset.v = String(val);
          v.textContent = val;
        }
      }
      if (cellClass) cell.classList.remove("stat-cell--ok", "stat-cell--bad");
    };
    set("stat-elements", n);
    set("stat-relations", r);
    set("stat-possible", R);
    set("stat-actual", C);
    set("stat-max", Cm);
    // estados visuales de relación/complejidad
    const relCell = root.querySelector('[data-cell="stat-relations"]');
    if (relCell) {
      relCell.classList.toggle("stat-cell--ok", r === R);
      relCell.classList.toggle("stat-cell--bad", r > R);
    }
    const actCell = root.querySelector('[data-cell="stat-actual"]');
    if (actCell) {
      actCell.classList.toggle("stat-cell--ok", C === Cm);
    }
    return { R: R, C: C, Cm: Cm };
  }

  /* ---- Analizador matemático ---- */
  function formulaEl() {
    const box = CL.UI.el("div", { class: "formula-box" });
    const steps = CL.UI.el("div", { class: "formula-steps" });
    box.appendChild(steps);
    return box;
  }

  function frac(num, den) {
    return '<span class="fraction"><span class="num">' + num + "</span><span class=\"den\">" + den + "</span></span>";
  }

  function updateFormula(root, n, r, opts) {
    opts = opts || {};
    const steps = root.querySelector(".formula-steps");
    const R = CL.Math.maxRelations(n);
    const C = CL.Math.complexity(n, r);
    const nD = n;
    steps.innerHTML =
      '<div class="formula-step"><b>R</b><span class="f-op">=</span>' + frac(nD + "(" + (nD - 1) + ")", "2") +
      '<span class="f-op">=</span><b class="f-rel" data-v="R">' + R + "</b></div>" +
      '<hr class="formula-sep"/>' +
      '<div class="formula-step"><b>C</b><span class="f-op">=</span><span class="f-num">' + nD + "</span>" +
      '<span class="f-op">+</span><span class="f-rel">' + r + '</span><span class="f-op">=</span>' +
      '<b class="f-comp" data-v="C">' + C + "</b></div>" +
      '<div class="formula-step is-result">' +
      '<span class="f-num">' + nD + "</span><span class=\"f-op\">+</span><span class='f-rel'>" + r + "</span><span class='f-op'> = </span><b class='f-comp'>" + C + "</b></div>";
    if (opts.animate !== false && !CL.State.detectReducedMotion()) {
      const els = steps.querySelectorAll("[data-v]");
      els.forEach((e) => { e.classList.add("num-flash"); });
    }
  }

  /* ---- Bloques de complejidad (Exp 3) ---- */
  function blocksEl() {
    const wrap = CL.UI.el("div", { class: "blocks-wrap" });
    const wrapE = CL.UI.el("div", { class: "blocks-row", dataset: { row: "elements" } });
    const wrapR = CL.UI.el("div", { class: "blocks-row", dataset: { row: "relations" } });
    const total = CL.UI.el("div", { class: "complexity-total" });
    total.append(
      CL.UI.el("div", { class: "c-label", html: "ORDEN DE COMPLEJIDAD" }),
      CL.UI.el("div", { class: "c-value", dataset: { v: "0" }, html: "0" })
    );
    wrap.append(wrapE, wrapR, total);
    return wrap;
  }

  function updateBlocks(root, n, r, opts) {
    opts = opts || {};
    const rowE = root.querySelector('[data-row="elements"]');
    const rowR = root.querySelector('[data-row="relations"]');
    const total = root.querySelector(".c-value");
    const C = CL.Math.complexity(n, r);
    const capE = CL.UI.el("span", { class: "row-cap", html: "ELEMENTOS" });
    const capR = CL.UI.el("span", { class: "row-cap", html: "RELACIONES" });
    rowE.innerHTML = "";
    rowR.innerHTML = "";
    rowE.appendChild(capE);
    rowR.appendChild(capR);
    for (let i = 0; i < Math.min(n, 40); i++) {
      const b = document.createElement("span");
      b.className = "block-e";
      b.style.animationDelay = (i * 0.008) + "s";
      rowE.appendChild(b);
    }
    if (n > 40) rowE.appendChild(CL.UI.el("span", { class: "row-cap", html: "+" + (n - 40) }));
    for (let i = 0; i < Math.min(r, 80); i++) {
      const b = document.createElement("span");
      b.className = "block-r";
      b.style.animationDelay = (i * 0.004) + "s";
      rowR.appendChild(b);
    }
    if (r > 80) rowR.appendChild(CL.UI.el("span", { class: "row-cap", html: "+" + (r - 80) }));
    rowE.appendChild(CL.UI.el("span", { class: "row-sum", html: n }));
    rowR.appendChild(CL.UI.el("span", { class: "row-sum", html: r }));
    const prev = parseInt(total.dataset.v || "0", 10);
    total.dataset.v = String(C);
    if (prev !== C) {
      if (opts.animate !== false && !CL.State.detectReducedMotion()) CL.UI.animateNumber(total, C, 350, prev);
      else total.textContent = C;
    }
  }

  /* ---- Slider ---- */
  function sliderEl(opts) {
    const wrap = CL.UI.el("div", { class: "slider-wrap" });
    const label = CL.UI.el("div", { class: "slider-label" });
    const title = CL.UI.el("span", { html: opts.label || "Elementos" });
    const value = CL.UI.el("b", { class: "slider-value", html: String(opts.value || 1) });
    label.append(title, value);
    const input = CL.UI.el("input", {
      class: "lab-slider", type: "range", min: String(opts.min), max: String(opts.max),
      step: String(opts.step || 1), value: String(opts.value || 1)
    });
    input.addEventListener("input", () => {
      value.textContent = input.value;
      if (opts.onInput) opts.onInput(parseInt(input.value, 10), input);
    });
    wrap.append(label, input);
    return wrap;
  }

  /* ---- Barra de progreso ---- */
  function progressBarEl(max, current) {
    const bar = CL.UI.el("div", { class: "ch-progress-bar" });
    const fill = CL.UI.el("span", { style: { width: "0%" } });
    bar.appendChild(fill);
    bar._set = (cur) => {
      const p = Math.min(1, cur / Math.max(1, max)) * 100;
      fill.style.width = p + "%";
      bar.classList.toggle("is-complete", cur >= max);
    };
    bar._set(current || 0);
    return bar;
  }

  /* ---- Contador grande ---- */
  function bigCounterEl(label, initial) {
    const wrap = CL.UI.el("div", { class: "big-counter" });
    const num = CL.UI.el("div", { class: "big-number", dataset: { v: "0" }, html: String(initial || 1) });
    const lbl = CL.UI.el("div", { class: "big-label", html: label });
    wrap.append(num, lbl);
    return wrap;
  }

  function setBigCounter(el, val, animate) {
    const num = el.querySelector(".big-number");
    const prev = parseInt(num.dataset.v || "0", 10);
    num.dataset.v = String(val);
    if (animate !== false && !CL.State.detectReducedMotion() && prev !== val) CL.UI.animateNumber(num, val, 380, prev);
    else num.textContent = val;
  }

  CL.LabPanel = {
    countersEl: countersEl,
    updateCounters: updateCounters,
    formulaEl: formulaEl,
    updateFormula: updateFormula,
    blocksEl: blocksEl,
    updateBlocks: updateBlocks,
    sliderEl: sliderEl,
    progressBarEl: progressBarEl,
    bigCounterEl: bigCounterEl,
    setBigCounter: setBigCounter
  };
})(window.ComplexityLab = window.ComplexityLab || {});
