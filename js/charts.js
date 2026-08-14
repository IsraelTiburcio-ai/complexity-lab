/* ============================================================
   COMPLEXITY LAB · js/charts.js
   Gráfica de crecimiento (SVG ligero, sin librerías).
   Eje X: número de elementos · Eje Y: cantidad.
   Dos curvas: Elementos (uniforme) y Relaciones máximas (rápida).
   ============================================================ */
(function (CL) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  function Chart(container) {
    this.container = container;
    this.n = 1;
    this.build();
  }

  Chart.prototype.build = function () {
    this.container.innerHTML = "";
    const title = document.createElement("div");
    title.className = "chart-title";
    title.innerHTML = "<span>Crecimiento del sistema</span><span class='chart-sub' id='chart-cap'></span>";
    this.cap = title.querySelector("#chart-cap");

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "chart-svg");
    svg.setAttribute("viewBox", "0 0 320 150");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Gráfica de crecimiento: elementos y relaciones máximas");
    this.svg = svg;

    // gradientes de área
    const defs = document.createElementNS(NS, "defs");
    const g1 = document.createElementNS(NS, "linearGradient"); g1.id = "chart-grad-e";
    g1.setAttribute("x1", "0"); g1.setAttribute("y1", "0"); g1.setAttribute("x2", "0"); g1.setAttribute("y2", "1");
    g1.append(this.stop("0.4", "rgba(55,217,255,0.18)"), this.stop("1", "rgba(55,217,255,0)"));
    const g2 = document.createElementNS(NS, "linearGradient"); g2.id = "chart-grad-r";
    g2.setAttribute("x1", "0"); g2.setAttribute("y1", "0"); g2.setAttribute("x2", "0"); g2.setAttribute("y2", "1");
    g2.append(this.stop("0.4", "rgba(154,123,255,0.22)"), this.stop("1", "rgba(154,123,255,0)"));
    defs.append(g1, g2);
    svg.appendChild(defs);

    this.grid = document.createElementNS(NS, "g");
    svg.appendChild(this.grid);
    this.areaE = document.createElementNS(NS, "path"); this.areaE.setAttribute("class", "chart-area-e");
    this.areaR = document.createElementNS(NS, "path"); this.areaR.setAttribute("class", "chart-area-r");
    this.lineE = document.createElementNS(NS, "path"); this.lineE.setAttribute("class", "chart-series-elements chart-line");
    this.lineR = document.createElementNS(NS, "path"); this.lineR.setAttribute("class", "chart-series-relations chart-line");
    this.dots = document.createElementNS(NS, "g");
    svg.append(this.areaE, this.areaR, this.lineE, this.lineR, this.dots);

    const legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.innerHTML =
      '<span class="legend-chip"><span class="legend-line legend-line--e"></span><b>Elementos</b></span>' +
      '<span class="legend-chip"><span class="legend-line legend-line--r"></span><b>Relaciones máximas</b></span>';
    this.container.append(title, svg, legend);
    this.update(1);
  };

  Chart.prototype.stop = function (offset, color) {
    const s = document.createElementNS(NS, "stop");
    s.setAttribute("offset", offset);
    s.setAttribute("stop-color", color);
    return s;
  };

  Chart.prototype.update = function (n) {
    this.n = Math.max(1, n);
    const W = 320, H = 150;
    const padL = 30, padR = 12, padT = 16, padB = 26;
    const iw = W - padL - padR, ih = H - padT - padB;
    const maxX = Math.max(this.n, 1);
    const maxY = Math.max(this.n, CL.Math.maxRelations(this.n), 2);

    // rejilla
    this.grid.innerHTML = "";
    for (let g = 0; g <= 3; g++) {
      const y = padT + (ih * g) / 3;
      const line = document.createElementNS(NS, "line");
      line.setAttribute("class", "chart-grid-line");
      line.setAttribute("x1", padL); line.setAttribute("x2", W - padR);
      line.setAttribute("y1", y); line.setAttribute("y2", y);
      this.grid.appendChild(line);
      const lbl = document.createElementNS(NS, "text");
      lbl.setAttribute("class", "chart-axis-label");
      lbl.setAttribute("x", padL - 6); lbl.setAttribute("y", y + 3);
      lbl.setAttribute("text-anchor", "end");
      lbl.textContent = Math.round(maxY - (maxY * g) / 3);
      this.grid.appendChild(lbl);
    }
    // eje X
    const xl = document.createElementNS(NS, "text");
    xl.setAttribute("class", "chart-axis-label");
    xl.setAttribute("x", W / 2); xl.setAttribute("y", H - 6);
    xl.setAttribute("text-anchor", "middle");
    xl.textContent = "Elementos (n)";
    this.grid.appendChild(xl);
    const yl = document.createElementNS(NS, "text");
    yl.setAttribute("class", "chart-axis-label");
    yl.setAttribute("x", 10); yl.setAttribute("y", 10);
    yl.textContent = "Cantidad";
    this.grid.appendChild(yl);

    const X = (v) => padL + (iw * (v - 1)) / Math.max(1, maxX - 1);
    const Y = (v) => padT + ih - (ih * v) / maxY;

    // series
    let dE = "", dR = "", aE = "", aR = "";
    for (let i = 1; i <= this.n; i++) {
      const x = X(i), yE = Y(i), yR = Y(CL.Math.maxRelations(i));
      dE += (i === 1 ? "M" : "L") + x.toFixed(1) + " " + yE.toFixed(1) + " ";
      dR += (i === 1 ? "M" : "L") + x.toFixed(1) + " " + yR.toFixed(1) + " ";
    }
    const baseY = Y(0);
    aE = dE + "L" + X(this.n).toFixed(1) + " " + baseY.toFixed(1) + " L" + X(1).toFixed(1) + " " + baseY.toFixed(1) + " Z";
    aR = dR + "L" + X(this.n).toFixed(1) + " " + baseY.toFixed(1) + " L" + X(1).toFixed(1) + " " + baseY.toFixed(1) + " Z";
    this.lineE.setAttribute("d", dE);
    this.lineR.setAttribute("d", dR);
    this.areaE.setAttribute("d", aE);
    this.areaR.setAttribute("d", aR);

    // puntos
    this.dots.innerHTML = "";
    if (this.n <= 20) {
      for (let i = 1; i <= this.n; i++) {
        const de = document.createElementNS(NS, "circle");
        de.setAttribute("class", "chart-dot chart-dot-e");
        de.setAttribute("r", "2.6");
        de.setAttribute("cx", X(i)); de.setAttribute("cy", Y(i));
        this.dots.appendChild(de);
        const dr = document.createElementNS(NS, "circle");
        dr.setAttribute("class", "chart-dot chart-dot-r");
        dr.setAttribute("r", "2.6");
        dr.setAttribute("cx", X(i)); dr.setAttribute("cy", Y(CL.Math.maxRelations(i)));
        this.dots.appendChild(dr);
        // etiqueta en el último punto de cada serie
        if (i === this.n) {
          const le = document.createElementNS(NS, "text");
          le.setAttribute("class", "chart-point-label");
          le.setAttribute("x", Math.min(X(i) + 5, W - 20));
          le.setAttribute("y", Math.max(Y(i) - 6, 10));
          le.textContent = i;
          this.dots.appendChild(le);
          const lr = document.createElementNS(NS, "text");
          lr.setAttribute("class", "chart-point-label");
          lr.setAttribute("x", Math.min(X(i) + 5, W - 20));
          lr.setAttribute("y", Math.max(Y(CL.Math.maxRelations(i)) - 6, 10));
          lr.textContent = CL.Math.maxRelations(i);
          this.dots.appendChild(lr);
        }
      }
    }

    this.cap.textContent = "n = " + this.n + " · R máx = " + CL.Math.maxRelations(this.n);
    this.svg.setAttribute("aria-label",
      "Gráfica de crecimiento. Con " + this.n + " elementos, las relaciones máximas posibles son " + CL.Math.maxRelations(this.n) + ". La curva de relaciones crece más rápido que la de elementos.");
  };

  Chart.prototype.destroy = function () {
    this.container.innerHTML = "";
  };

  CL.Chart = { create: function (c) { return new Chart(c); } };
})(window.ComplexityLab = window.ComplexityLab || {});
