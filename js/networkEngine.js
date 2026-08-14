/* ============================================================
   COMPLEXITY LAB · js/networkEngine.js
   REACTOR DE COMPLEJIDAD — red SVG interactiva.
   Nodos que respiran, relaciones animadas, layouts con
   transición suave, física ligera opcional, selección y
   creación de vínculos por toque/click/teclado.
   ============================================================ */
(function (CL) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const LOGICAL_W = 1000;

  function Network(container, opts) {
    this.container = container;
    this.opts = Object.assign({
      labels: true,
      heat: false,
      layout: "organic",
      interactive: true,
      mode: "link",        // 'link' | 'inspect'
      edgesAllowed: true,
      onNodeClick: null,
      onEdgeClick: null,
      onBackgroundClick: null,
      onLink: null,        // (a, b) => boolean aceptado
      onDragEnd: null,
      capacity: null,      // map id -> etiqueta de capacidad (sinergia)
      nodeLabelPrefix: "E"
    }, opts || {});

    this.W = LOGICAL_W;
    this.H = 640;
    this.nodes = [];       // {id, fx, fy, vx, vy, fixed}
    this.edges = [];       // [{a, b, key}]
    this.edgeEls = {};     // key -> {line, glow, pulse}
    this.pending = null;
    this.selectedNode = null;
    this.selectedEdge = null;
    this.layout = this.opts.layout;
    this.mode = this.opts.mode;
    this.animQueue = [];   // animaciones de interpolación de posiciones
    this.dragging = null;
    this.pointer = { x: 0, y: 0, active: false };
    this.destroyed = false;
    this.reducedMotion = CL.State.detectReducedMotion();

    this._build();
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(container);
    this._bind();
    this._loop = requestAnimationFrame(this._tick.bind(this));
  }

  /* ---------------- Construcción SVG ---------------- */
  Network.prototype._build = function () {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "net-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Red de sistema");
    this.svg = svg;

    const defs = document.createElementNS(NS, "defs");
    const uid = Math.floor(Math.random() * 1e6);
    const glow = document.createElementNS(NS, "filter");
    glow.setAttribute("id", "net-glow-" + uid);
    glow.setAttribute("x", "-80%"); glow.setAttribute("y", "-80%");
    glow.setAttribute("width", "260%"); glow.setAttribute("height", "260%");
    const blur = document.createElementNS(NS, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "3");
    const merge = document.createElementNS(NS, "feMerge");
    merge.append(
      document.createElementNS(NS, "feMergeNode"),
      document.createElementNS(NS, "feMergeNode")
    );
    glow.append(blur, merge);
    defs.appendChild(glow);
    this.glowId = glow.getAttribute("id");

    // degradado de nodos (cian → turquesa)
    const ng = document.createElementNS(NS, "radialGradient");
    ng.setAttribute("id", "node-grad-" + uid);
    ng.setAttribute("cx", "35%"); ng.setAttribute("cy", "30%"); ng.setAttribute("r", "75%");
    const s1 = document.createElementNS(NS, "stop"); s1.setAttribute("offset", "0%"); s1.setAttribute("stop-color", "#3deaff");
    const s2 = document.createElementNS(NS, "stop"); s2.setAttribute("offset", "70%"); s2.setAttribute("stop-color", "#1ea8d8");
    const s3 = document.createElementNS(NS, "stop"); s3.setAttribute("offset", "100%"); s3.setAttribute("stop-color", "#0d6aa0");
    ng.append(s1, s2, s3);
    defs.appendChild(ng);
    this.nodeGrad = "url(#node-grad-" + uid + ")";

    // degradado de aristas (violeta → azul brillante)
    const eg = document.createElementNS(NS, "linearGradient");
    eg.setAttribute("id", "edge-grad-" + uid);
    eg.setAttribute("gradientUnits", "userSpaceOnUse");
    eg.setAttribute("x1", "0"); eg.setAttribute("y1", "0"); eg.setAttribute("x2", "1000"); eg.setAttribute("y2", "640");
    const e1 = document.createElementNS(NS, "stop"); e1.setAttribute("offset", "0%"); e1.setAttribute("stop-color", "#9a7bff");
    const e2 = document.createElementNS(NS, "stop"); e2.setAttribute("offset", "100%"); e2.setAttribute("stop-color", "#5d9dff");
    eg.append(e1, e2);
    defs.appendChild(eg);
    this.edgeGrad = "url(#edge-grad-" + uid + ")";

    const gEdges = document.createElementNS(NS, "g");
    gEdges.setAttribute("class", "net-edges");
    const gPulses = document.createElementNS(NS, "g");
    gPulses.setAttribute("class", "net-pulses");
    const gNodes = document.createElementNS(NS, "g");
    gNodes.setAttribute("class", "net-nodes");
    this.gEdges = gEdges; this.gPulses = gPulses; this.gNodes = gNodes;
    svg.append(defs, gEdges, gPulses, gNodes);
    this.container.appendChild(svg);
  };

  Network.prototype._resize = function () {
    const r = this.container.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const aspect = r.width / Math.max(1, r.height);
    this.H = CL.UI.clamp(LOGICAL_W / aspect, 480, 860);
    this.W = LOGICAL_W;
    this.svg.setAttribute("viewBox", "0 0 " + this.W.toFixed(0) + " " + this.H.toFixed(0));
    this._renderAll();
  };

  /* ---------------- Interacción ---------------- */
  Network.prototype._bind = function () {
    const self = this;
    this.svg.addEventListener("pointerdown", (e) => {
      if (!self.opts.interactive) return;
      if (e.target.closest && e.target.closest(".node-group")) {
        self._nodePointerDown(e);
      }
    });
    this.svg.addEventListener("pointerdown", (e) => {
      if (!self.opts.interactive) return;
      if (e.target === self.svg || e.target.closest(".net-edges") && e.target === self.gEdges) {
        self._clearPending();
        self.selectedEdge = null;
        self._syncEdgeSelection();
        if (self.opts.onBackgroundClick) self.opts.onBackgroundClick();
      }
    });
    this.svg.addEventListener("pointermove", (e) => {
      const pt = this._svgPoint(e);
      this.pointer.x = pt.x; this.pointer.y = pt.y; this.pointer.active = true;
      if (this.dragging) this._dragTo(pt);
    });
    window.addEventListener("pointerup", (e) => this._endDrag(e));
    window.addEventListener("pointercancel", () => this._endDrag(null));
    this.svg.addEventListener("pointerleave", () => { this.pointer.active = false; });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { this._clearPending(); this.selectedEdge = null; this._syncEdgeSelection(); }
    });
  };

  Network.prototype._svgPoint = function (e) {
    const r = this.svg.getBoundingClientRect();
    const scaleX = this.W / Math.max(1, r.width);
    const scaleY = this.H / Math.max(1, r.height);
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY
    };
  };

  Network.prototype._nodePointerDown = function (e) {
    const group = e.target.closest(".node-group");
    if (!group) return;
    const id = parseInt(group.dataset.id, 10);
    const node = this.nodes.find((n) => n.id === id);
    if (!node) return;
    this.dragging = { id: id, startX: e.clientX, startY: e.clientY, moved: false };
    this.svg.setPointerCapture && this.svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  Network.prototype._dragTo = function (pt) {
    const d = this.dragging;
    const node = this.nodes.find((n) => n.id === d.id);
    if (!node) return;
    if (!d.moved) {
      if (Math.abs(this.pointer.x - node.fx * this.W) + Math.abs(this.pointer.y - node.fy * this.H) < 14) return;
      d.moved = true;
    }
    node.fx = pt.x / this.W;
    node.fy = pt.y / this.H;
    node.fixed = true;
    this._updateNode(node);
    this._updateEdgesFor(node);
    this._interpolate(null);
  };

  Network.prototype._endDrag = function () {
    if (this.dragging) {
      const d = this.dragging;
      this.dragging = null;
      if (!d.moved) {
        this._onNodeTap(d.id);
      } else if (this.opts.onDragEnd) {
        this.opts.onDragEnd(d.id);
      }
    }
  };

  Network.prototype._onNodeTap = function (id) {
    if (this.opts.onNodeClick) this.opts.onNodeClick(id, this);
    if (this.mode === "link" && this.opts.edgesAllowed) {
      if (this.pending === null) {
        this.pending = id;
        this._syncNodeSelection();
        if (this.opts.onLinkPending) this.opts.onLinkPending(id);
      } else if (this.pending === id) {
        this._clearPending();
      } else {
        const accepted = this.opts.onLink ? this.opts.onLink(this.pending, id) : true;
        if (accepted) {
          CL.Audio.play("link");
          this.addEdge(this.pending, id, { animate: true });
        } else {
          this._clearPending();
        }
        this.pending = null;
        this._syncNodeSelection();
      }
    } else if (this.mode === "inspect") {
      this._clearPending();
    }
  };

  Network.prototype._clearPending = function () {
    if (this.pending !== null) {
      this.pending = null;
      this._syncNodeSelection();
    }
  };

  Network.prototype._syncNodeSelection = function () {
    this.nodes.forEach((n) => {
      const g = this.nodeEls[n.id];
      if (!g) return;
      g.classList.toggle("is-pending", this.pending === n.id);
      g.classList.toggle("is-selected", this.selectedNode === n.id);
    });
  };

  Network.prototype._syncEdgeSelection = function () {
    for (const key in this.edgeEls) {
      this.edgeEls[key].line.classList.toggle("is-selected", this.selectedEdge === key);
    }
  };

  /* ---------------- Datos ---------------- */
  Network.prototype.setNodes = function (n, opts) {
    opts = opts || {};
    const prev = this.nodes.slice();
    // crear/eliminar
    const ids = [];
    for (let i = 1; i <= n; i++) ids.push(i);
    const removed = prev.filter((p) => !ids.includes(p.id));
    const added = ids.filter((id) => !prev.some((p) => p.id === id));
    // reutilizar posiciones existentes
    const pos = {};
    prev.forEach((p) => { pos[p.id] = { fx: p.fx, fy: p.fy, fixed: p.fixed }; });
    // centro para colocar nodos nuevos cerca
    const cx0 = 0.5, cy0 = 0.5;
    let sumX = 0, sumY = 0, cCount = 0;
    ids.forEach((id) => { if (pos[id]) { sumX += pos[id].fx; sumY += pos[id].fy; cCount++; } });
    const ncX = cCount ? sumX / cCount : cx0;
    const ncY = cCount ? sumY / cCount : cy0;
    this.nodes = ids.map((id) => {
      if (pos[id]) return { id: id, fx: pos[id].fx, fy: pos[id].fy, vx: 0, vy: 0, fixed: pos[id].fixed };
      return { id: id, fx: ncX + (Math.random() - 0.5) * 0.12, fy: ncY + (Math.random() - 0.5) * 0.12, vx: 0, vy: 0, fixed: false };
    });
    // eliminar aristas huérfanas
    const valid = new Set(ids);
    const kept = this.edges.filter((e) => valid.has(e.a) && valid.has(e.b));
    const removedKeys = this.edges.filter((e) => !valid.has(e.a) || !valid.has(e.b)).map((e) => e.key);
    this.edges = kept;
    removedKeys.forEach((k) => this._removeEdgeEl(k));
    this._rebuildNodes(opts);
    this._renderAll();
    this._updateAria();
    return { added: added, removed: removed.map((p) => p.id) };
  };

  Network.prototype._scatterOrganic = function () {
    const cx = 0.5, cy = 0.5, R = Math.min(1, this.H / this.W) * 0.32;
    this.nodes.forEach((n, i) => {
      if (n.fixed) return;
      const a = (i / Math.max(1, this.nodes.length)) * Math.PI * 2 + Math.random() * 0.5;
      n.fx = cx + R * Math.cos(a);
      n.fy = cy + R * Math.sin(a);
      n.vx = 0; n.vy = 0;
    });
  };

  Network.prototype._rebuildNodes = function (opts) {
    const self = this;
    if (this.nodeEls) Object.values(this.nodeEls).forEach((g) => g.remove());
    this.nodeEls = {};
    this.nodes.forEach((n) => {
      const g = this._buildNodeEl(n, opts);
      this.nodeEls[n.id] = g;
      this.gNodes.appendChild(g);
    });
  };

  Network.prototype._buildNodeEl = function (node, opts) {
    const self = this;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "node-group" + (opts && opts.entering ? " is-entering" : ""));
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("data-id", node.id);
    g.setAttribute("aria-label", "Elemento " + node.id);

    const hit = document.createElementNS(NS, "circle");
    hit.setAttribute("class", "node-hit");
    hit.setAttribute("r", "18");

    const ghost = document.createElementNS(NS, "circle");
    ghost.setAttribute("class", "node-ghost");
    ghost.setAttribute("r", "17");

    const core = document.createElementNS(NS, "circle");
    core.setAttribute("class", "node-core");
    core.setAttribute("r", "9.5");
    core.setAttribute("fill", this.nodeGrad);
    core.setAttribute("filter", "url(#" + this.glowId + ")");
    core.setAttribute("stroke", "rgba(55,217,255,0.6)");
    core.setAttribute("stroke-width", "1.2");

    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("class", "node-ring");
    ring.setAttribute("r", "14");

    const label = document.createElementNS(NS, "text");
    label.setAttribute("class", "node-label");
    label.setAttribute("y", "26");
    label.textContent = this.opts.nodeLabelPrefix + node.id;

    const badgeBg = document.createElementNS(NS, "circle");
    badgeBg.setAttribute("class", "node-badge-bg");
    badgeBg.setAttribute("r", "7");
    badgeBg.setAttribute("cy", "-12");
    badgeBg.setAttribute("fill", this.opts.heat ? "#9a7bff" : "transparent");
    const badge = document.createElementNS(NS, "text");
    badge.setAttribute("class", "node-badge");
    badge.setAttribute("y", "-9");
    badge.textContent = "0";

    g.append(hit, ghost, core, ring, label, badgeBg, badge);

    // capacidad (sinergia)
    if (this.opts.capacity && this.opts.capacity[node.id]) {
      const cap = document.createElementNS(NS, "text");
      cap.setAttribute("class", "capacity-chip-svg");
      cap.setAttribute("y", "-20");
      cap.textContent = this.opts.capacity[node.id];
      g.appendChild(cap);
    }

    g.addEventListener("pointerenter", () => g.classList.add("is-hover"));
    g.addEventListener("pointerleave", () => g.classList.remove("is-hover"));
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._onNodeTap(node.id);
      }
    });
    g.addEventListener("focus", () => this._updateAria());
    return g;
  };

  Network.prototype._updateNode = function (node) {
    const g = this.nodeEls[node.id];
    if (!g) return;
    const x = node.fx * this.W, y = node.fy * this.H;
    g.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")");
  };

  Network.prototype._updateEdgesFor = function (node) {
    const self = this;
    this.edges.forEach((e) => {
      if (e.a === node.id || e.b === node.id) this._positionEdge(e, this.edgeEls[e.key]);
    });
  };

  Network.prototype._positionEdge = function (edge, els) {
    const a = this._node(edge.a), b = this._node(edge.b);
    if (!a || !b || !els) return;
    const x1 = a.fx * this.W, y1 = a.fy * this.H;
    const x2 = b.fx * this.W, y2 = b.fy * this.H;
    const len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    els.line.setAttribute("x1", x1.toFixed(1)); els.line.setAttribute("y1", y1.toFixed(1));
    els.line.setAttribute("x2", x2.toFixed(1)); els.line.setAttribute("y2", y2.toFixed(1));
    els.glow.setAttribute("x1", x1.toFixed(1)); els.glow.setAttribute("y1", y1.toFixed(1));
    els.glow.setAttribute("x2", x2.toFixed(1)); els.glow.setAttribute("y2", y2.toFixed(1));
    els.pulse.setAttribute("x1", x1.toFixed(1)); els.pulse.setAttribute("y1", y1.toFixed(1));
    els.pulse.setAttribute("x2", x2.toFixed(1)); els.pulse.setAttribute("y2", y2.toFixed(1));
    els.line.style.setProperty("--len", len.toFixed(1));
    els.pulse.style.setProperty("--len", len.toFixed(1));
  };

  Network.prototype._node = function (id) {
    return this.nodes.find((n) => n.id === id) || null;
  };

  /* ---------------- Aristas ---------------- */
  Network.prototype.setEdges = function (edgePairs, opts) {
    opts = opts || {};
    const next = new Set();
    const nextEdges = [];
    edgePairs.forEach((p) => {
      const key = CL.Math.edgeKey(p.a, p.b);
      if (key && !next.has(key)) { next.add(key); nextEdges.push({ a: p.a, b: p.b, key: key }); }
    });
    // agregar nuevas
    nextEdges.forEach((e) => {
      if (!this.edgeEls[e.key]) this._addEdgeEl(e, opts);
    });
    // eliminar sobrantes
    for (const key in this.edgeEls) {
      if (!next.has(key)) this._removeEdgeEl(key);
    }
    this.edges = nextEdges;
    this._updateAria();
  };

  Network.prototype.addEdge = function (a, b, opts) {
    const key = CL.Math.edgeKey(a, b);
    if (!key) return false;
    if (this.edgeEls[key]) return false;
    const e = { a: a, b: b, key: key };
    this.edges.push(e);
    this._addEdgeEl(e, opts || {});
    this._updateAria();
    return true;
  };

  Network.prototype.removeEdge = function (a, b) {
    const key = CL.Math.edgeKey(a, b);
    if (!key || !this.edgeEls[key]) return false;
    this.edges = this.edges.filter((e) => e.key !== key);
    this._removeEdgeEl(key);
    this._updateAria();
    return true;
  };

  Network.prototype.clearEdges = function () {
    this.edges = [];
    for (const key in this.edgeEls) this._removeEdgeEl(key);
    this._updateAria();
  };

  Network.prototype._addEdgeEl = function (edge, opts) {
    const self = this;
    const g = document.createElementNS(NS, "g");

    const glow = document.createElementNS(NS, "line");
    glow.setAttribute("class", "edge-glow");
    glow.setAttribute("stroke", "#9a7bff");
    glow.setAttribute("stroke-width", "7");
    glow.setAttribute("stroke-linecap", "round");

    const line = document.createElementNS(NS, "line");
    line.setAttribute("class", "edge");
    line.setAttribute("stroke", this.edgeGrad);
    line.setAttribute("data-key", edge.key);

    const pulse = document.createElementNS(NS, "line");
    pulse.setAttribute("class", "pulse-line");
    pulse.setAttribute("stroke", "#2fe8c0");

    g.append(glow, line, pulse);
    this.gEdges.appendChild(g);

    const els = { line: line, glow: glow, pulse: pulse, g: g };
    this.edgeEls[edge.key] = els;
    this._positionEdge(edge, els);

    line.addEventListener("pointerenter", () => { line.classList.add("is-hover"); });
    line.addEventListener("pointerleave", () => { line.classList.remove("is-hover"); });
    line.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectedEdge = edge.key;
      this._syncEdgeSelection();
      if (this.opts.onEdgeClick) this.opts.onEdgeClick(edge, this);
    });

    if (opts.animate && !this.reducedMotion) {
      line.classList.add("is-drawing");
      setTimeout(() => line.classList.remove("is-drawing"), 600);
    }
    if (opts.delay) {
      pulse.style.animationDelay = opts.delay + "s";
    }
    return els;
  };

  Network.prototype._removeEdgeEl = function (key) {
    const els = this.edgeEls[key];
    if (!els) return;
    els.g.remove();
    delete this.edgeEls[key];
  };

  Network.prototype.pulse = function (edgeKeys, stagger) {
    const self = this;
    edgeKeys.forEach((k, i) => {
      const els = this.edgeEls[k];
      if (!els) return;
      els.pulse.classList.remove("is-running");
      els.pulse.style.animationDelay = (stagger !== undefined ? i * stagger : 0) + "s";
      // reiniciar
      void els.pulse.getBoundingClientRect();
      els.pulse.classList.add("is-running");
      setTimeout(() => els.pulse.classList.remove("is-running"), 3000 + i * 120);
    });
  };

  Network.prototype.pulseAll = function (stagger) {
    this.pulse(Object.keys(this.edgeEls), stagger || 0.03);
  };

  /* ---------------- Layout ---------------- */
  Network.prototype.setLayout = function (type, opts) {
    opts = opts || {};
    if (this.layout === type) return;
    this.layout = type;
    const targets = this._layoutTargets(type);
    this._animateTo(targets, opts.duration || 800);
  };

  Network.prototype._layoutTargets = function (type) {
    const pts = CL.Layout.compute(type, this.nodes.length, this.W, this.H);
    const map = {};
    this.nodes.forEach((n, i) => { map[n.id] = pts[i]; });
    return map;
  };

  Network.prototype._animateTo = function (targets, duration) {
    const self = this;
    if (this.reducedMotion) {
      this.nodes.forEach((n) => {
        if (targets[n.id]) { n.fx = targets[n.id].x / this.W; n.fy = targets[n.id].y / this.H; }
        n.fixed = false;
      });
      this._renderAll();
      return;
    }
    const start = {};
    this.nodes.forEach((n) => { start[n.id] = { fx: n.fx, fy: n.fy }; });
    this.animQueue.push({
      start: start, targets: targets, t0: performance.now(), dur: duration
    });
  };

  Network.prototype._interpolate = function (now) {
    const self = this;
    this.animQueue = this.animQueue.filter((anim) => {
      const p = Math.min(1, (now - anim.t0) / anim.dur);
      const e = 1 - Math.pow(1 - p, 3);
      let any = false;
      this.nodes.forEach((n) => {
        if (!anim.start[n.id] || !anim.targets[n.id]) return;
        any = true;
        n.fx = anim.start[n.id].fx + (anim.targets[n.id].x / this.W - anim.start[n.id].fx) * e;
        n.fy = anim.start[n.id].fy + (anim.targets[n.id].y / this.H - anim.start[n.id].fy) * e;
      });
      if (p >= 1) {
        // fijar destino y liberar pin del layout
        this.nodes.forEach((n) => { if (anim.targets[n.id]) n.fixed = false; });
        return false;
      }
      return any;
    });
    this._renderAll();
  };

  Network.prototype.unpinAll = function () {
    this.nodes.forEach((n) => { n.fixed = false; });
  };

  /* ---------------- Render ---------------- */
  Network.prototype._renderAll = function () {
    if (!this.svg || !this.svg.isConnected) return;
    this.nodes.forEach((n) => this._updateNode(n));
    this.edges.forEach((e) => this._positionEdge(e, this.edgeEls[e.key]));
    this._updateHeat();
  };

  Network.prototype._updateHeat = function () {
    if (!this.opts.heat) return;
    const counts = {};
    this.edges.forEach((e) => { counts[e.a] = (counts[e.a] || 0) + 1; counts[e.b] = (counts[e.b] || 0) + 1; });
    this.nodes.forEach((n) => {
      const g = this.nodeEls[n.id];
      if (!g) return;
      const badge = g.querySelector(".node-badge");
      const bg = g.querySelector(".node-badge-bg");
      const c = counts[n.id] || 0;
      badge.textContent = c;
      bg.setAttribute("fill", c > 0 ? "#9a7bff" : "transparent");
    });
  };

  Network.prototype.setLabels = function (v) {
    this.opts.labels = v;
    Object.values(this.nodeEls).forEach((g) => {
      g.querySelector(".node-label").style.display = v ? "" : "none";
    });
  };

  Network.prototype.setHeat = function (v) {
    this.opts.heat = v;
    Object.values(this.nodeEls).forEach((g) => {
      const bg = g.querySelector(".node-badge-bg");
      const b = g.querySelector(".node-badge");
      bg.setAttribute("fill", "transparent");
      b.textContent = "";
    });
    this._updateHeat();
  };

  Network.prototype.setMode = function (m) {
    this.mode = m;
    this._clearPending();
    this.selectedNode = null;
    this._syncNodeSelection();
  };

  Network.prototype.selectNode = function (id) {
    this.selectedNode = id;
    this._syncNodeSelection();
  };

  Network.prototype.clearSelection = function () {
    this.selectedNode = null;
    this.selectedEdge = null;
    this._syncNodeSelection();
    this._syncEdgeSelection();
  };

  /* ---------------- Bucle ---------------- */
  Network.prototype._tick = function () {
    if (this.destroyed) return;
    const now = performance.now();
    if (this.animQueue.length) this._interpolate(now);
    if (this.layout === "organic" && this.nodes.length > 0) {
      const pos = this.nodes.map((n) => ({
        x: n.fx * this.W, y: n.fy * this.H, vx: n.vx, vy: n.vy
      }));
      const fixed = this.nodes.map((n) => n.fixed);
      const emap = this.edges.map((e) => ({ a: this.nodes.findIndex((n) => n.id === e.a), b: this.nodes.findIndex((n) => n.id === e.b) }));
      // repulsión sutil desde el puntero
      if (this.pointer.active && !this.dragging) {
        const px = this.pointer.x, py = this.pointer.y;
        this.nodes.forEach((n, i) => {
          if (n.fixed) return;
          const dx = (n.fx * this.W - px), dy = (n.fy * this.H - py);
          const d2 = dx * dx + dy * dy;
          if (d2 < 160000 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            pos[i].vx = (pos[i].vx || 0) + (dx / d) * 0.35 * (160000 - d2) / 160000;
            pos[i].vy = (pos[i].vy || 0) + (dy / d) * 0.35 * (160000 - d2) / 160000;
          }
        });
      }
      const settled = CL.Layout.energy(pos) < 0.35;
      CL.Layout.stepForces(pos, this.W, this.H, emap, { fixed: fixed, speed: settled ? 0 : 1 });
      this.nodes.forEach((n, i) => {
        n.fx = pos[i].x / this.W;
        n.fy = pos[i].y / this.H;
        n.vx = pos[i].vx; n.vy = pos[i].vy;
      });
      this._renderAll();
    }
    this._loop = requestAnimationFrame(this._tick.bind(this));
  };

  /* ---------------- Accesibilidad ---------------- */
  Network.prototype._updateAria = function () {
    const n = this.nodes.length;
    const r = this.edges.length;
    this.svg.setAttribute("aria-label",
      "Red de sistema con " + n + " elementos y " + r + " relaciones. " +
      "Cada elemento puede conectarse con los demás; selecciona dos elementos para crear una relación.");
    // barrido de foco: aristas no enfocables, pero estado legible por lectores
  };

  /* ---------------- Utilidades ---------------- */
  Network.prototype.nodePosition = function (id) {
    const n = this._node(id);
    if (!n) return null;
    const rect = this.svg.getBoundingClientRect();
    return {
      x: rect.left + (n.fx * this.W / this.W) * rect.width,
      y: rect.top + (n.fy * this.H / this.H) * rect.height,
      fx: n.fx, fy: n.fy
    };
  };

  Network.prototype.getEdges = function () {
    return this.edges.map((e) => ({ a: e.a, b: e.b, key: e.key }));
  };

  Network.prototype.getEdgeCount = function () {
    return this.edges.length;
  };

  Network.prototype.isComplete = function () {
    return this.edges.length === CL.Math.maxRelations(this.nodes.length);
  };

  Network.prototype.completeAll = function (opts) {
    const n = this.nodes.length;
    const pairs = [];
    for (let i = 1; i <= n; i++) for (let j = i + 1; j <= n; j++) pairs.push({ a: i, b: j });
    this.setEdges(pairs, opts);
  };

  Network.prototype.destroy = function () {
    this.destroyed = true;
    cancelAnimationFrame(this._loop);
    this._ro && this._ro.disconnect();
    this.svg.remove();
  };

  /* ---------------- Fábrica ---------------- */
  function create(container, opts) {
    return new Network(container, opts);
  }

  CL.Network = { create: create };
})(window.ComplexityLab = window.ComplexityLab || {});
