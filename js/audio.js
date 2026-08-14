/* ============================================================
   COMPLEXITY LAB · js/audio.js
   Efectos de sonido procedurales (WebAudio). Sin archivos externos.
   ============================================================ */
(function (CL) {
  "use strict";

  let ctx = null;
  let master = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function enabled() {
    return !!(CL.State.get().settings.sound);
  }

  function tone(freq, dur, type, gain, delay) {
    const c = ensureCtx();
    if (!c || !enabled()) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.24, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function sweep(f0, f1, dur, gain, type, delay) {
    const c = ensureCtx();
    if (!c || !enabled()) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || "sawtooth";
    osc.frequency.setValueAtTime(Math.max(f0, 1), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  const SOUNDS = {
    click() { tone(700, 0.06, "sine", 0.12); },
    nodeAdd() { tone(420, 0.1, "triangle", 0.22); tone(560, 0.12, "sine", 0.16, 0.06); },
    nodeRemove() { sweep(500, 220, 0.16, 0.16, "triangle"); },
    link() { tone(660, 0.09, "sine", 0.2); tone(880, 0.12, "sine", 0.16, 0.05); },
    unlink() { sweep(700, 300, 0.12, 0.14, "sine"); },
    complete() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "sine", 0.2, i * 0.09)); },
    correct() { tone(620, 0.1, "sine", 0.2); tone(932, 0.16, "sine", 0.18, 0.08); },
    error() { sweep(260, 140, 0.22, 0.18, "sawtooth"); },
    hint() { tone(440, 0.08, "sine", 0.12); tone(440, 0.08, "sine", 0.1, 0.14); },
    achievement() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, "triangle", 0.2, i * 0.1)); },
    tick() { tone(980, 0.03, "square", 0.05); },
    select() { tone(500, 0.05, "sine", 0.14); },
    final() { [392, 523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.24, "triangle", 0.18, i * 0.16)); },
    prediction() { tone(520, 0.12, "sine", 0.16); tone(780, 0.16, "sine", 0.14, 0.1); }
  };

  function play(name) {
    const fn = SOUNDS[name];
    if (fn) fn();
  }

  CL.Audio = { play: play };
})(window.ComplexityLab = window.ComplexityLab || {});
