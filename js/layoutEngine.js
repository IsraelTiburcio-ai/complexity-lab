/* ============================================================
   COMPLEXITY LAB · js/layoutEngine.js
   Disposiciones de red: CIRCULAR, ORGÁNICA, CUADRÍCULA, RADIAL.
   La matemática no cambia; solo cambia la representación.
   ============================================================ */
(function (CL) {
  "use strict";

  const TAU = Math.PI * 2;

  function circular(n, W, H, opts) {
    opts = opts || {};
    const cx = opts.cx !== undefined ? opts.cx : W / 2;
    const cy = opts.cy !== undefined ? opts.cy : H / 2;
    const radius = opts.radius || Math.min(W, H) * 0.36;
    const angle0 = opts.angle0 || -Math.PI / 2;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = angle0 + (i / Math.max(1, n)) * TAU;
      pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
    }
    return pts;
  }

  function grid(n, W, H, opts) {
    opts = opts || {};
    const cols = opts.cols || Math.ceil(Math.sqrt(n * (W / H)));
    const rows = Math.ceil(n / cols);
    const padX = opts.padX !== undefined ? opts.padX : W * 0.12;
    const padY = opts.padY !== undefined ? opts.padY : H * 0.14;
    const cellW = (W - padX * 2) / Math.max(1, cols - 1 || 1);
    const cellH = (H - padY * 2) / Math.max(1, rows - 1 || 1);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const spread = cols > 1 ? (cols - 1) : 1;
      const x = cols > 1 ? padX + c * (W - padX * 2) / (cols - 1) : W / 2;
      const y = rows > 1 ? padY + r * (H - padY * 2) / (rows - 1) : H / 2;
      pts.push({ x: x, y: y });
    }
    return pts;
  }

  function radial(n, W, H, opts) {
    opts = opts || {};
    const cx = W / 2;
    const cy = H / 2;
    if (n <= 1) return [{ x: cx, y: cy }];
    const inner = Math.min(W, H) * 0.16;
    const outer = Math.min(W, H) * 0.4;
    const ring = (idx) => (idx < 3 ? inner : outer);
    const pts = [];
    let ringCount = 0;
    let ringIdx = -1;
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        pts.push({ x: cx, y: cy });
        continue;
      }
      if (i === 1 || i === 3) { ringCount = (i === 1) ? 3 : n - 3; ringIdx = 0; }
      const count = i === 1 ? 3 : n - 3;
      const r = ring(i);
      const a = -Math.PI / 2 + (ringIdx / Math.max(1, count)) * TAU;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      ringIdx++;
    }
    return pts;
  }

  /* ---- Física orgánica ligera (Fruchterman–Reingold simplificado) ---- */
  function stepForces(pos, W, H, edges, opts) {
    opts = opts || {};
    const n = pos.length;
    if (n === 0) return;
    const area = W * H;
    const k = opts.k || Math.sqrt(area / Math.max(1, n)) * 0.32;
    const repulsion = opts.repulsion || 4200;
    const spring = opts.spring || 0.018;
    const damping = opts.damping || 0.78;
    const speed = opts.speed || 1;

    const fx = new Array(n).fill(0);
    const fy = new Array(n).fill(0);
    const fixed = opts.fixed || [];

    // repulsión entre todos los pares
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x;
        let dy = pos[i].y - pos[j].y;
        let d2 = dx * dx + dy * dy;
        let d = Math.sqrt(d2) || 0.001;
        let f = (repulsion * k * k) / Math.max(d2, 400);
        dx /= d; dy /= d;
        fx[i] += dx * f; fy[i] += dy * f;
        fx[j] -= dx * f; fy[j] -= dy * f;
      }
    }
    // atracción a lo largo de aristas
    const emap = edges || [];
    for (let e = 0; e < emap.length; e++) {
      const a = emap[e].a, b = emap[e].b;
      let dx = pos[a].x - pos[b].x;
      let dy = pos[a].y - pos[b].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const ideal = opts.ideal || Math.min(W, H) * 0.22;
      let f = (d - ideal) * spring;
      dx /= d; dy /= d;
      fx[a] -= dx * f; fy[a] -= dy * f;
      fx[b] += dx * f; fy[b] += dy * f;
    }
    // suave gravedad hacia el centro (mantiene la red junta)
    const cx = W / 2, cy = H / 2;
    for (let i = 0; i < n; i++) {
      fx[i] += (cx - pos[i].x) * 0.0012;
      fy[i] += (cy - pos[i].y) * 0.0012;
    }
    for (let i = 0; i < n; i++) {
      if (fixed[i]) { pos[i].vx = 0; pos[i].vy = 0; continue; }
      pos[i].vx = ((pos[i].vx || 0) + fx[i]) * damping;
      pos[i].vy = ((pos[i].vy || 0) + fy[i]) * damping;
      pos[i].x += pos[i].vx * speed;
      pos[i].y += pos[i].vy * speed;
      pos[i].x = CL.UI.clamp(pos[i].x, W * 0.05, W * 0.95);
      pos[i].y = CL.UI.clamp(pos[i].y, H * 0.08, H * 0.92);
    }
  }

  function energy(pos) {
    let sum = 0;
    for (let i = 0; i < pos.length; i++) sum += Math.abs(pos[i].vx || 0) + Math.abs(pos[i].vy || 0);
    return sum / Math.max(1, pos.length);
  }

  function randomScatter(n, W, H) {
    const pts = [];
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.3;
    for (let i = 0; i < n; i++) {
      const a = (i / Math.max(1, n)) * TAU;
      const r = R * (0.7 + Math.random() * 0.6);
      pts.push({
        x: cx + r * Math.cos(a),
        y: cy + r * Math.sin(a),
        vx: 0, vy: 0
      });
    }
    return pts;
  }

  function compute(type, n, W, H, opts) {
    switch (type) {
      case "circular": return circular(n, W, H, opts);
      case "grid": return grid(n, W, H, opts);
      case "radial": return radial(n, W, H, opts);
      case "organic":
      default: return randomScatter(n, W, H);
    }
  }

  CL.Layout = {
    compute: compute,
    circular: circular,
    grid: grid,
    radial: radial,
    randomScatter: randomScatter,
    stepForces: stepForces,
    energy: energy
  };
})(window.ComplexityLab = window.ComplexityLab || {});
