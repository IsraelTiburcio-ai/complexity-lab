/* ============================================================
   COMPLEXITY LAB · js/ui.js
   Iconos SVG propios, toasts, modales, helpers DOM y utilidades.
   ============================================================ */
(function (CL) {
  "use strict";

  /* ---- Iconografía SVG propia ---- */
  const ICONS = {
    reactor: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
    nodes: '<circle cx="8" cy="8" r="3.2"/><circle cx="16" cy="7" r="3.2"/><circle cx="9" cy="16" r="3.2"/><circle cx="17" cy="16" r="3.2"/>',
    link: '<line x1="8" y1="14" x2="15" y2="8"/><circle cx="6" cy="16" r="2.6"/><circle cx="18" cy="6" r="2.6"/>',
    mesh: '<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="7" y1="8" x2="11" y2="16"/><line x1="17" y1="8" x2="13" y2="16"/>',
    reaction: '<polyline points="6 10 10 10 12 6 14 14 16 10 18 10"/><line x1="12" y1="19" x2="12" y2="21"/>',
    scale: '<line x1="12" y1="4" x2="12" y2="7"/><line x1="5" y1="8" x2="19" y2="8"/><path d="M8 8l-2.5 9M16 8l2.5 9"/><line x1="5.5" y1="17" x2="18.5" y2="17"/>',
    synergy: '<circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><circle cx="12" cy="6" r="2.4"/><line x1="8.4" y1="10.6" x2="10.4" y2="7.2"/><line x1="15.6" y1="10.6" x2="13.6" y2="7.2"/><line x1="7.5" y1="14.7" x2="10.5" y2="13.2"/><line x1="16.5" y1="14.7" x2="13.5" y2="13.2"/>',
    build: '<rect x="3" y="8" width="4" height="4" rx="1"/><rect x="17" y="8" width="4" height="4" rx="1"/><rect x="10" y="16" width="4" height="4" rx="1"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="9" y1="12" x2="12" y2="16"/><line x1="15" y1="12" x2="12" y2="16"/>',
    wrench: '<path d="M14 7a4 4 0 0 1 5-5l-3 3 1.5 1.5 3-3a4 4 0 0 1-5 5l-6 6a2.4 2.4 0 0 1-3.5-3.5z"/><line x1="8" y1="13" x2="11" y2="16"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><line x1="15" y1="15" x2="19" y2="19"/>',
    dial: '<circle cx="12" cy="12" r="8"/><line x1="12" y1="12" x2="12" y2="6"/><line x1="12" y1="12" x2="16" y2="13.5"/><circle cx="12" cy="12" r="1.4"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.4"/>',
    grid: '<rect x="4" y="4" width="5" height="5" rx="1"/><rect x="15" y="4" width="5" height="5" rx="1"/><rect x="4" y="15" width="5" height="5" rx="1"/><rect x="15" y="15" width="5" height="5" rx="1"/>',
    bolt: '<polygon points="13 2 5 13 11 13 10 22 19 10 13 10 13 2"/>',
    crown: '<path d="M4 17l-1.5-9 5 3.5L12 5l4.5 6.5 5-3.5-1.5 9z"/><line x1="5" y1="20" x2="19" y2="20"/>',
    trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.8 2.2c-.8.5-1.3 1-1.3 1.8"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none"/>',
    map: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M16 5v14M3 10h18M3 14h18"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
    sound_on: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M18.5 6.5a8 8 0 0 1 0 11"/>',
    sound_off: '<path d="M4 9v6h4l5 4V5L8 9z"/><line x1="16" y1="9" x2="21" y2="14"/><line x1="21" y1="9" x2="16" y2="14"/>',
    sandbox: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><line x1="10.5" y1="10.5" x2="13.5" y2="13.5"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/>',
    play: '<polygon points="7 5 19 12 7 19"/>',
    pause: '<rect x="7" y="5" width="3.4" height="14" rx="1"/><rect x="13.6" y="5" width="3.4" height="14" rx="1"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
    eye_off: '<path d="M3 3l18 18"/><path d="M10.5 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.7 3.7M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.5-1.1"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<polyline points="4 12 9 17 20 6"/>',
    warning: '<path d="M12 3L2 20h20z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none"/>',
    circle: '<circle cx="12" cy="12" r="8"/>',
    organic: '<circle cx="7" cy="8" r="2.2"/><circle cx="16" cy="6" r="2.2"/><circle cx="18" cy="15" r="2.2"/><circle cx="9" cy="18" r="2.2"/><circle cx="13" cy="12" r="1.4"/>',
    radial: '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="4" r="1.6"/><circle cx="20" cy="12" r="1.6"/><circle cx="12" cy="20" r="1.6"/><circle cx="4" cy="12" r="1.6"/><line x1="12" y1="6.6" x2="12" y2="9.6"/><line x1="17.4" y1="12" x2="14.6" y2="12"/><line x1="12" y1="17.4" x2="12" y2="14.6"/><line x1="6.6" y1="12" x2="9.4" y2="12"/>',
    flame: '<path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.5.8-3 2-4.5C9.5 9.5 10 12 11 12c0-3 .5-6.5 1-9z"/>'
  };

  function icon(name, size) {
    const inner = ICONS[name] || ICONS.nodes;
    const s = size || 20;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + s + '" height="' + s +
      '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      inner + "</svg>";
  }

  function fillIcons(root) {
    (root || document).querySelectorAll(".icon[data-icon]").forEach((el) => {
      el.innerHTML = icon(el.getAttribute("data-icon"), el.getAttribute("data-size") || 20);
    });
  }

  /* ---- el() : crear elemento con hijos y atributos ---- */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "class") node.className = attrs[k];
        else if (k === "style" && typeof attrs[k] === "object") {
          Object.assign(node.style, attrs[k]);
        } else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "dataset") Object.assign(node.dataset, attrs[k]);
        else if (k === "children") {
          (Array.isArray(attrs[k]) ? attrs[k] : [attrs[k]]).forEach((c) => {
            if (c === null || c === undefined) return;
            node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
          });
        }
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c === null || c === undefined) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  /* ---- Toast ---- */
  function toast(message, type, iconName) {
    const region = document.getElementById("toast-region");
    if (!region) return;
    const t = el("div", { class: "toast toast--" + (type || "info") });
    const ic = el("span", { class: "toast-icon", html: icon(iconName || (type === "ok" ? "check" : type === "err" ? "warning" : "circle"), 15) });
    const body = el("div", { html: message });
    t.append(ic, body);
    region.appendChild(t);
    setTimeout(() => t.classList.add("is-out"), 3400);
    setTimeout(() => t.remove(), 3800);
  }

  /* ---- Logro toast premium ---- */
  function achievementToast(ach) {
    const region = document.getElementById("toast-region");
    if (!region) return;
    const t = el("div", { class: "ach-toast", role: "status" });
    const ic = el("span", { class: "at-ico", html: icon(ach.icon, 26) });
    const body = el("div", {});
    body.append(
      el("div", { class: "at-title", html: "LOGRO DESBLOQUEADO" }),
      el("div", { class: "at-name", html: ach.name }),
      el("div", { class: "at-pts", html: "+" + ach.points + " pts" })
    );
    t.append(ic, body);
    region.appendChild(t);
    setTimeout(() => t.classList.add("is-out"), 5200);
    setTimeout(() => t.remove(), 5600);
  }

  /* ---- Modal ---- */
  function modal(opts) {
    const root = document.getElementById("modal-root");
    const backdrop = el("div", { class: "modal-backdrop" });
    const m = el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": opts.title || "" });
    m.append(el("h3", { html: opts.title || "" }));
    if (opts.html) m.append(el("div", { html: opts.html }));
    if (opts.body) m.append(opts.body);
    const actions = el("div", { class: "modal-actions" });
    (opts.buttons || []).forEach((b) => {
      const btn = el("button", {
        class: "btn " + (b.primary ? "btn-primary" : "btn-ghost"),
        html: b.label || "OK"
      });
      btn.addEventListener("click", () => {
        close();
        if (b.onClick) b.onClick();
      });
      actions.appendChild(btn);
    });
    m.appendChild(actions);
    backdrop.appendChild(m);
    root.appendChild(backdrop);
    function close() { backdrop.remove(); }
    function onKey(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
    }
    document.addEventListener("keydown", onKey);
    return { close: close, el: m };
  }

  /* ---- Confirmación propia ---- */
  function confirmModal(opts) {
    return modal({
      title: opts.title,
      html: opts.message,
      buttons: [
        { label: "Cancelar", onClick: opts.onCancel },
        { label: opts.okLabel || "Aceptar", primary: true, onClick: opts.onOk }
      ]
    });
  }

  /* ---- Números animados (count up) ---- */
  function animateNumber(el, target, dur, start) {
    const s0 = start !== undefined ? start : (parseInt(el.dataset.v || "0", 10) || 0);
    const end = target;
    const d = dur || 400;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / d);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(s0 + (end - s0) * eased);
      el.textContent = v;
      if (p < 1) requestAnimationFrame(step);
      else el.dataset.v = String(end);
    }
    el.dataset.v = String(s0);
    requestAnimationFrame(step);
  }

  /** Destaca un número brevemente mostrando el valor actual. */
  function flash(el) {
    if (CL.State.detectReducedMotion()) return;
    const val = el.dataset.v !== undefined ? el.dataset.v : el.textContent;
    const span = document.createElement("span");
    span.className = "num-flash";
    span.textContent = val;
    el.innerHTML = "";
    el.appendChild(span);
  }

  /* ---- utilidades ---- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  /* ---- SVG namespace helper ---- */
  function svgEl(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  CL.UI = {
    icon: icon,
    fillIcons: fillIcons,
    el: el,
    toast: toast,
    achievementToast: achievementToast,
    modal: modal,
    confirmModal: confirmModal,
    animateNumber: animateNumber,
    flash: flash,
    esc: esc,
    clamp: clamp,
    svgEl: svgEl
  };
})(window.ComplexityLab = window.ComplexityLab || {});
