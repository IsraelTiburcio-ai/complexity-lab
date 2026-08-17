/* ============================================================
   NETWORK BOMB · js/game.js
   Microjuego: responde rápido para desactivar la red.
   R = n(n−1)/2 · C = n + R
   ============================================================ */
(function () {
  "use strict";

  const DATA = window.NB_DATA;
  const NS = "http://www.w3.org/2000/svg";

  /* ---------- Motor matemático (única fuente de verdad) ---------- */
  const maxRelations = (n) => (n * (n - 1)) / 2;
  const maxComplexity = (n) => n + maxRelations(n);

  /* ---------- Estado ---------- */
  const S = {
    round: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    answered: false,
    timeLeft: 0,
    timerId: null,
    history: [],
    best: parseInt(localStorage.getItem("networkbomb.best") || "0", 10) || 0
  };

  /* ---------- Audio (WebAudio procedural) ---------- */
  let AC = null;
  function ctx() {
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AC = new C();
    }
    if (AC.state === "suspended") AC.resume();
    return AC;
  }
  function soundOn() {
    return localStorage.getItem("networkbomb.sound") !== "off";
  }
  function tone(f, d, t, g, delay) {
    const c = ctx();
    if (!c || !soundOn()) return;
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const gN = c.createGain();
    o.type = t || "sine";
    o.frequency.setValueAtTime(f, t0);
    gN.gain.setValueAtTime(0.0001, t0);
    gN.gain.exponentialRampToValueAtTime(g || 0.22, t0 + 0.015);
    gN.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(gN);
    gN.connect(c.destination);
    o.start(t0);
    o.stop(t0 + d + 0.05);
  }
  function sweep(f0, f1, d, g) {
    const c = ctx();
    if (!c || !soundOn()) return;
    const t0 = c.currentTime;
    const o = c.createOscillator();
    const gN = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + d);
    gN.gain.setValueAtTime(0.0001, t0);
    gN.gain.exponentialRampToValueAtTime(g || 0.16, t0 + 0.02);
    gN.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(gN);
    gN.connect(c.destination);
    o.start(t0);
    o.stop(t0 + d + 0.05);
  }
  const SFX = {
    click: () => tone(700, 0.06, "sine", 0.12),
    correct: () => { tone(523, 0.12, "sine", 0.2); tone(784, 0.16, "sine", 0.18, 0.07); },
    combo: () => { tone(784, 0.1, "sine", 0.2); tone(988, 0.1, "sine", 0.18, 0.06); tone(1175, 0.18, "sine", 0.18, 0.12); },
    wrong: () => sweep(220, 120, 0.25, 0.18),
    timeout: () => sweep(300, 90, 0.5, 0.15),
    final: () => { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, "triangle", 0.2, i * 0.11)); }
  };

  /* ---------- Referencias DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const elHome = $("screen-home"), elGame = $("screen-game"), elResult = $("screen-result");
  const roundNum = $("round-num"), comboChip = $("combo-chip"), comboVal = $("combo-val"), scoreVal = $("score-val");
  const ringProg = $("ring-progress"), timerVal = $("timer-val");
  const netZone = $("net-zone"), stabilize = $("stabilize");
  const qN = $("q-n"), qText = $("q-text"), feedback = $("feedback"), hintEl = $("formula-hint");
  const optionsEl = $("options");
  const btnStart = $("btn-start"), btnAgain = $("btn-again"), btnMenu = $("btn-menu"), btnSound = $("btn-sound"), bestChip = $("best-score");
  const rCorrect = $("r-correct"), rCombo = $("r-combo"), rPts = $("r-pts"), rState = $("result-state"), rBest = $("r-best");

  const RING_C = 2 * Math.PI * 92;

  /* ---------- Barajar opciones (cada ronda) ---------- */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ---------- Transiciones de pantalla ---------- */
  function show(screenEl) {
    [elHome, elGame, elResult].forEach((s) => s.classList.add("is-leaving"));
    setTimeout(() => {
      [elHome, elGame, elResult].forEach((s) => { s.hidden = true; s.classList.remove("is-leaving"); });
      screenEl.hidden = false;
    }, 200);
  }

  /* ---------- Red (SVG) ---------- */
  let svg = null, nodeEls = [], edgeEls = [];

  function layout(n) {
    const pts = [];
    const R = n <= 3 ? 0.3 : n <= 6 ? 0.34 : 0.36;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * 2 * Math.PI;
      pts.push({ x: 50 + R * 100 * Math.cos(a), y: 50 + R * 100 * Math.sin(a), a: a });
    }
    return pts;
  }

  function buildNet() {
    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Red de elementos del dispositivo");
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = '<radialGradient id="ngrad" cx="35%" cy="30%" r="80%">' +
      '<stop offset="0%" stop-color="#3deaff"/><stop offset="70%" stop-color="#1ea8d8"/><stop offset="100%" stop-color="#0d6aa0"/>' +
      "</radialGradient>";
    svg.appendChild(defs);
    netZone.appendChild(svg);
  }

  function renderNetwork(n, opts) {
    opts = opts || {};
    svg.innerHTML = "";
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = '<radialGradient id="ngrad" cx="35%" cy="30%" r="80%">' +
      '<stop offset="0%" stop-color="#3deaff"/><stop offset="70%" stop-color="#1ea8d8"/><stop offset="100%" stop-color="#0d6aa0"/>' +
      "</radialGradient>";
    svg.appendChild(defs);

    const pts = layout(n);
    const r = n <= 4 ? 4.6 : n <= 6 ? 4 : 3.1;
    nodeEls = [];
    edgeEls = [];
    const gEdges = document.createElementNS(NS, "g");
    const gNodes = document.createElementNS(NS, "g");
    svg.appendChild(gEdges);
    svg.appendChild(gNodes);

    // nodos (etiquetas radiales, fuera del círculo)
    pts.forEach((p, i) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("transform", "translate(" + p.x.toFixed(2) + "," + p.y.toFixed(2) + ")");
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("class", "node-core" + (opts.enter ? " is-new" : ""));
      c.setAttribute("r", r);
      // etiqueta desplazada hacia afuera, anclada según el lado
      const fs = n <= 6 ? 5 : 3.2;
      const gap = n <= 6 ? 3.2 : 2.6;
      const cos = Math.cos(p.a), sin = Math.sin(p.a);
      const anchor = Math.abs(cos) > 0.35 ? (cos > 0 ? "start" : "end") : "middle";
      const lx = (r + gap) * cos;
      const ly = (r + gap) * sin + fs * 0.35;
      const lbl = document.createElementNS(NS, "text");
      lbl.setAttribute("class", "node-label");
      lbl.setAttribute("x", lx.toFixed(2));
      lbl.setAttribute("y", ly.toFixed(2));
      lbl.setAttribute("font-size", fs);
      lbl.setAttribute("text-anchor", anchor);
      lbl.setAttribute("paint-order", "stroke");
      lbl.setAttribute("stroke", "rgba(4,6,13,0.9)");
      lbl.setAttribute("stroke-width", "1.1");
      lbl.textContent = "E" + (i + 1);
      g.appendChild(c);
      g.appendChild(lbl);
      gNodes.appendChild(g);
      nodeEls.push({ g, x: p.x, y: p.y });
    });
    return pts;
  }

  function drawEdges(n, opts) {
    opts = opts || {};
    const pts = layout(n);
    const pairs = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
    const delay = n <= 3 ? 120 : n <= 6 ? 45 : 14;
    edgeEls = [];
    pairs.forEach(([i, j], k) => {
      const a = pts[i], b = pts[j];
      const line = document.createElementNS(NS, "line");
      line.setAttribute("class", "edge is-draw");
      line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
      line.setAttribute("x2", b.x); line.setAttribute("y2", b.y);
      const len = Math.hypot(b.x - a.x, b.y - a.y).toFixed(1);
      line.style.setProperty("--len", len);
      line.style.animationDelay = (k * delay) + "ms";
      line.style.animationDuration = (n === 12 ? 0.2 : 0.28) + "s";
      svg.insertBefore(line, svg.children[1]);
      edgeEls.push(line);
    });
    // pulsos que recorren las conexiones
    if (opts.pulse) {
      edgeEls.forEach((line, k) => {
        const p = document.createElementNS(NS, "line");
        p.setAttribute("class", "pulse-line is-on");
        p.setAttribute("x1", line.getAttribute("x1")); p.setAttribute("y1", line.getAttribute("y1"));
        p.setAttribute("x2", line.getAttribute("x2")); p.setAttribute("y2", line.getAttribute("y2"));
        p.style.setProperty("--len", line.style.getPropertyValue("--len"));
        p.style.animationDelay = (k * 18) + "ms";
        svg.insertBefore(p, svg.children[1]);
      });
    }
    return edgeEls;
  }

  /* ---------- Cuenta regresiva ---------- */
  function stopTimer() {
    if (S.timerId) { clearInterval(S.timerId); S.timerId = null; }
  }
  function startTimer() {
    stopTimer();
    S.timeLeft = DATA.roundTime;
    updateRing();
    S.timerId = setInterval(() => {
      S.timeLeft = Math.max(0, S.timeLeft - 0.1);
      updateRing();
      if (S.timeLeft <= 0) {
        stopTimer();
        onTimeout();
      }
    }, 100);
  }
  function updateRing() {
    const frac = S.timeLeft / DATA.roundTime;
    ringProg.setAttribute("stroke-dasharray", RING_C.toFixed(1));
    ringProg.setAttribute("stroke-dashoffset", (RING_C * (1 - frac)).toFixed(1));
    timerVal.textContent = Math.ceil(S.timeLeft);
    elGame.querySelector(".device").classList.toggle("is-danger", S.timeLeft <= 5 && !S.answered);
  }

  /* ---------- Flujo de ronda ---------- */
  function setupRound() {
    const r = DATA.rounds[S.round];
    S.answered = false;
    // opciones barajadas: la respuesta correcta cambia de botón en cada ronda
    S.currentOptions = shuffle(r.options.slice());
    roundNum.textContent = "R" + (S.round + 1) + "/" + DATA.rounds.length;
    qN.textContent = r.n;
    qText.textContent = r.question;
    hintEl.textContent = r.final ? "C = n + n(n−1)/2" : "R = n(n−1)/2";
    feedback.textContent = "";
    feedback.className = "feedback";
    comboChip.hidden = S.combo < 2;
    if (comboChip.hidden === false) comboVal.textContent = S.combo;
    stabilize.hidden = true;
    elGame.querySelector(".device").classList.remove("is-stable", "is-danger");

    // opciones
    optionsEl.querySelectorAll(".opt").forEach((b, i) => {
      b.textContent = S.currentOptions[i];
      b.className = "opt";
      b.disabled = false;
      b.setAttribute("aria-label", "Opción " + (i + 1) + ": " + S.currentOptions[i]);
    });

    renderNetwork(r.n, { enter: true });
    startTimer();
  }

  function answer(i) {
    if (S.answered) return;
    const r = DATA.rounds[S.round];
    S.answered = true;
    stopTimer();
    const btns = optionsEl.querySelectorAll(".opt");
    const chosen = S.currentOptions[i];

    if (chosen === r.answer) {
      // acierto
      S.combo++;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      S.correct++;
      S.history.push({ n: r.n, question: r.question, options: r.options, answer: r.answer, feedback: r.feedback, correct: true, chosen: r.answer });
      const gained = DATA.points * S.combo;
      S.score += gained;
      scoreVal.textContent = S.score;
      btns[i].classList.add("is-correct");
      feedback.textContent = "+" + gained + " · " + r.feedback;
      feedback.className = "feedback is-ok";
      if (S.combo >= 2) {
        comboChip.hidden = false;
        comboVal.textContent = S.combo;
        feedback.className = "feedback is-combo";
        SFX.combo();
      } else {
        SFX.correct();
      }
      burst(btns[i], "#3ddc84");
      drawEdges(r.n, { pulse: r.final });
      if (r.final) {
        setTimeout(() => {
          stabilize.hidden = false;
          elGame.querySelector(".device").classList.add("is-stable");
        }, 750);
      }
      advance(r.final ? 1800 : 1050);
    } else {
      // error
      S.combo = 0;
      comboChip.hidden = true;
      S.history.push({ n: r.n, question: r.question, options: r.options, answer: r.answer, feedback: r.feedback, correct: false, chosen: chosen });
      btns[i].classList.add("is-wrong");
      btns[S.currentOptions.indexOf(r.answer)].classList.add("is-reveal");
      feedback.textContent = "Observa: " + r.feedback;
      feedback.className = "feedback is-err";
      SFX.wrong();
      elGame.querySelector(".device").classList.add("shake");
      setTimeout(() => elGame.querySelector(".device").classList.remove("shake"), 450);
      drawEdges(r.n, {});
      advance(r.final ? 1700 : 1400);
    }
  }

  function onTimeout() {
    if (S.answered) return;
    const r = DATA.rounds[S.round];
    S.answered = true;
    S.combo = 0;
    comboChip.hidden = true;
    S.history.push({ n: r.n, question: r.question, options: r.options, answer: r.answer, feedback: r.feedback, correct: false, chosen: null, timedOut: true });
    const btns = optionsEl.querySelectorAll(".opt");
    btns[S.currentOptions.indexOf(r.answer)].classList.add("is-reveal");
    feedback.textContent = "Tiempo: " + r.feedback;
    feedback.className = "feedback is-err";
    SFX.timeout();
    drawEdges(r.n, {});
    advance(r.final ? 1700 : 1400);
  }

  function advance(delay) {
    setTimeout(() => {
      S.round++;
      if (S.round >= DATA.rounds.length) endGame();
      else setupRound();
    }, delay);
  }

  /* ---------- Fin de partida ---------- */
  function endGame() {
    stopTimer();
    const total = DATA.rounds.length;
    const won = S.correct === total;
    rState.textContent = won ? "RED ESTABILIZADA" : "RED AÚN ACTIVA";
    rState.classList.toggle("is-lost", !won);
    rCorrect.textContent = S.correct;
    rCombo.textContent = "×" + S.maxCombo;
    rPts.textContent = S.score;
    rBest.hidden = true;
    if (S.score > S.best) {
      S.best = S.score;
      localStorage.setItem("networkbomb.best", String(S.best));
      rBest.hidden = false;
      bestChip.hidden = false;
      bestChip.querySelector("b").textContent = S.best;
    }
    SFX.final();
    show(elResult);
  }

  /* ---------- Partículas ---------- */
  function burst(anchorEl, color) {
    if (matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = anchorEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      const size = 4 + Math.random() * 6;
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 70;
      p.style.width = p.style.height = size + "px";
      p.style.background = color;
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  /* ---------- Inicio ---------- */
  function startGame() {
    S.round = 0; S.score = 0; S.combo = 0; S.maxCombo = 0; S.correct = 0; S.history = [];
    scoreVal.textContent = "0";
    comboChip.hidden = true;
    $("review").hidden = true;
    setupRound();
    show(elGame);
  }

  /* ---------- Repaso de respuestas ---------- */
  function renderReview() {
    const list = $("review-list");
    list.innerHTML = "";
    let ok = 0;
    S.history.forEach((r, i) => {
      if (r.correct) ok++;
      const you = r.timedOut ? "— (tiempo agotado)" : (r.chosen !== null ? r.chosen : "—");
      const row = document.createElement("div");
      row.className = "review-row " + (r.correct ? "is-ok" : "is-err");
      row.innerHTML =
        '<div class="review-head"><span class="review-q">R' + (i + 1) + ' · <b>' + r.n + "</b> ELEMENTOS · " + r.question + "</span>" +
        '<span class="review-r">' + (r.correct ? "✓" : "✗") + "</span></div>" +
        '<div class="review-ans"><span class="you' + (r.correct ? " is-right" : "") + '">Tú: ' + you + "</span>" +
        '<span class="correct">Correcta: ' + r.answer + "</span></div>" +
        '<div class="review-formula">' + r.feedback + "</div>";
      list.appendChild(row);
    });
    $("review-summary").innerHTML = "Acertaste <b>" + ok + "/" + S.history.length + "</b> rondas";
    $("review").hidden = false;
  }

  /* ---------- Teclado ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("review").hidden) { $("review").hidden = true; return; }
    if (e.key === "Enter" || e.key === " ") {
      if (!elHome.hidden) { e.preventDefault(); startGame(); }
      else if (!elResult.hidden && $("review").hidden) { e.preventDefault(); startGame(); }
    }
    if (!elGame.hidden && !S.answered) {
      if (e.key === "1") answer(0);
      else if (e.key === "2") answer(1);
      else if (e.key === "3") answer(2);
    }
  });

  /* ---------- Inicialización ---------- */
  function init() {
    buildNet();
    btnStart.addEventListener("click", () => { SFX.click(); startGame(); });
    btnAgain.addEventListener("click", () => { SFX.click(); startGame(); });
    btnMenu.addEventListener("click", () => { SFX.click(); show(elHome); });
    $("btn-review").addEventListener("click", () => { SFX.click(); renderReview(); });
    $("review-close").addEventListener("click", () => { $("review").hidden = true; });
    $("review").addEventListener("click", (e) => { if (e.target === $("review")) $("review").hidden = true; });
    optionsEl.querySelectorAll(".opt").forEach((b, i) => b.addEventListener("click", () => answer(i)));

    const refreshSound = () => {
      btnSound.textContent = soundOn() ? "🔊" : "🔇";
    };
    btnSound.addEventListener("click", () => {
      localStorage.setItem("networkbomb.sound", soundOn() ? "off" : "on");
      refreshSound();
    });
    refreshSound();

    bestChip.hidden = S.best === 0;
    bestChip.querySelector("b").textContent = S.best;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
