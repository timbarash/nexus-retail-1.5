import React, { useState, useEffect, useRef, useCallback } from 'react';
import NexusIcon from '../components/NexusIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens — warm parchment palette (matches NexusMarketingV2)
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg: '#EDE8DC',
  surface: '#F7F4EC',
  deep: '#E4DFD0',
  darker: '#D8D2C4',
  text: '#2C2416',
  secondary: '#5C5243',
  muted: '#706858',
  gold: '#7A5F12',
  goldLight: '#9A7B2E',
  green: '#0B6E44',
  border: '#D5CEBC',
  ink: '#1A1510',
};

const FONT_HEADING = "'DM Sans', system-ui, -apple-system, sans-serif";
const FONT_BODY = "'Inter', system-ui, -apple-system, sans-serif";
const TOTAL_DURATION = 65; // seconds

// ─────────────────────────────────────────────────────────────────────────────
// Audio Engine — warm, organic, C major fifth
// ─────────────────────────────────────────────────────────────────────────────
class WarmAudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.osc1 = null;
    this.osc2 = null;
    this.osc3 = null;
    this.osc3Gain = null;
    this.started = false;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 500;
    this.filter.Q.value = 0.7;
    this.filter.connect(this.master);
    this.master.connect(this.ctx.destination);

    // C3 + G3 — warm perfect fifth
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.value = 130.81; // C3
    const g1 = this.ctx.createGain();
    g1.gain.value = 0.04;
    this.osc1.connect(g1);
    g1.connect(this.filter);

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sine';
    this.osc2.frequency.value = 196; // G3
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.04;
    this.osc2.connect(g2);
    g2.connect(this.filter);

    // Third oscillator (E4) — added later for major chord warmth
    this.osc3 = this.ctx.createOscillator();
    this.osc3.type = 'sine';
    this.osc3.frequency.value = 329.63; // E4
    this.osc3Gain = this.ctx.createGain();
    this.osc3Gain.gain.value = 0;
    this.osc3.connect(this.osc3Gain);
    this.osc3Gain.connect(this.filter);
  }

  start() {
    if (this.started || !this.ctx) return;
    this.started = true;
    this.osc1.start();
    this.osc2.start();
    this.osc3.start();
  }

  // Update audio state based on current time (new 65s timeline)
  update(t) {
    if (!this.ctx || !this.started) return;
    const now = this.ctx.currentTime;

    // Opening (0-5s): fade in, warm pad only
    if (t < 5) {
      const fade = Math.min(t / 3, 1);
      this.master.gain.setTargetAtTime(fade * 0.04, now, 0.1);
      this.filter.frequency.setTargetAtTime(500, now, 0.1);
      this.osc3Gain.gain.setTargetAtTime(0, now, 0.1);
    }
    // Morning Briefing (11-22s): filter opens slightly
    else if (t >= 11 && t < 22) {
      this.master.gain.setTargetAtTime(0.04, now, 0.1);
      this.filter.frequency.setTargetAtTime(700, now, 0.3);
      this.osc3Gain.gain.setTargetAtTime(0, now, 0.1);
    }
    // Inventory Transfers (23-32s): gentle ascending
    else if (t >= 23 && t < 32) {
      this.master.gain.setTargetAtTime(0.05, now, 0.1);
      this.filter.frequency.setTargetAtTime(800, now, 0.3);
      this.osc3Gain.gain.setTargetAtTime(0, now, 0.1);
    }
    // Purchase Orders (33-42s): fuller warmth
    else if (t >= 33 && t < 42) {
      this.master.gain.setTargetAtTime(0.06, now, 0.3);
      this.filter.frequency.setTargetAtTime(900, now, 0.3);
      this.osc3Gain.gain.setTargetAtTime(0.02, now, 0.3);
    }
    // Marketing Campaigns (43-52s): full warmth, major chord
    else if (t >= 43 && t < 52) {
      this.master.gain.setTargetAtTime(0.07, now, 0.3);
      this.filter.frequency.setTargetAtTime(1000, now, 0.5);
      this.osc3Gain.gain.setTargetAtTime(0.04, now, 0.5);
    }
    // The Data (53-58s): warm and open
    else if (t >= 53 && t < 58) {
      this.master.gain.setTargetAtTime(0.06, now, 0.3);
      this.filter.frequency.setTargetAtTime(900, now, 0.3);
      this.osc3Gain.gain.setTargetAtTime(0.03, now, 0.3);
    }
    // The Close (58-65s): fade out
    else if (t >= 58) {
      const remaining = Math.max(0, (65 - t) / 7);
      this.master.gain.setTargetAtTime(remaining * 0.04, now, 0.5);
      this.filter.frequency.setTargetAtTime(500, now, 0.5);
      this.osc3Gain.gain.setTargetAtTime(0, now, 1);
    }
    // Between sections: gentle pad
    else {
      this.master.gain.setTargetAtTime(0.04, now, 0.1);
      this.filter.frequency.setTargetAtTime(500, now, 0.1);
    }
  }

  // Soft tick for KPI / element appearances
  tick() {
    if (!this.ctx || !this.started) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    const g = this.ctx.createGain();
    g.gain.value = 0.015;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // Gold line sweep sound
  sweep() {
    if (!this.ctx || !this.started) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 200;
    osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 1);
    const g = this.ctx.createGain();
    g.gain.value = 0.01;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 1);
  }

  // Soft chime for "done" moments
  chime() {
    if (!this.ctx || !this.started) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 880;
    const g = this.ctx.createGain();
    g.gain.value = 0.02;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Softest tick for promise words
  softTick() {
    if (!this.ctx || !this.started) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1320;
    const g = this.ctx.createGain();
    g.gain.value = 0.008;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  mute() {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  unmute(t) {
    if (!this.ctx) return;
    this.update(t);
  }

  destroy() {
    if (!this.ctx) return;
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.osc3?.stop();
    } catch (_) {}
    this.ctx.close();
    this.ctx = null;
    this.started = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: lerp for smooth time-based interpolation
// ─────────────────────────────────────────────────────────────────────────────
function progress(time, start, duration) {
  return Math.max(0, Math.min(1, (time - start) / duration));
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typewriter effect hook
// ─────────────────────────────────────────────────────────────────────────────
function useTypewriter(text, active, speed = 40) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    if (!active) { setDisplayed(''); idxRef.current = 0; return; }
    idxRef.current = 0;
    setDisplayed('');
    const iv = setInterval(() => {
      idxRef.current++;
      if (idxRef.current > text.length) { clearInterval(iv); return; }
      setDisplayed(text.slice(0, idxRef.current));
    }, speed);
    return () => clearInterval(iv);
  }, [active, text, speed]);

  return displayed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Counter animation hook
// ─────────────────────────────────────────────────────────────────────────────
function useCounter(target, active, duration = 1200, prefix = '', suffix = '') {
  const [display, setDisplay] = useState(prefix + '0' + suffix);

  useEffect(() => {
    if (!active) { setDisplay(prefix + '0' + suffix); return; }
    const start = performance.now();
    const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ''));
    function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      const ep = easeOut(p);
      const current = ep * numericTarget;
      if (target.includes('.')) {
        const decimals = target.split('.')[1]?.replace(/[^0-9]/g, '').length || 0;
        setDisplay(prefix + current.toFixed(decimals) + suffix);
      } else {
        setDisplay(prefix + Math.round(current) + suffix);
      }
      if (p < 1) requestAnimationFrame(frame);
      else setDisplay(prefix + target + suffix);
    }
    requestAnimationFrame(frame);
  }, [active, target, duration, prefix, suffix]);

  return display;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Label — "01 / YOUR MORNING" style
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ number, label, opacity }) {
  return (
    <div style={{
      position: 'absolute', top: 48, left: 48,
      fontFamily: FONT_BODY, fontSize: 11, fontWeight: 500,
      color: T.gold, letterSpacing: '0.12em', textTransform: 'uppercase',
      opacity,
    }}>
      {number} / {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gold line transition — draws horizontally across the center
// ─────────────────────────────────────────────────────────────────────────────
function GoldLineTransition({ time, start }) {
  const p = easeInOut(progress(time, start, 0.8));
  if (p <= 0) return null;

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 10,
      opacity: p < 1 ? 1 : Math.max(0, 1 - progress(time, start + 0.8, 0.2)),
    }}>
      <div style={{
        width: 200, height: 1, background: T.border,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          background: T.gold, width: `${p * 100}%`,
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Caption below mockups
// ─────────────────────────────────────────────────────────────────────────────
function Caption({ text, opacity }) {
  return (
    <div style={{
      fontFamily: FONT_BODY, fontSize: 14, color: T.secondary,
      marginTop: 24, opacity, textAlign: 'center',
      fontStyle: 'italic', maxWidth: 480,
    }}>
      {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Video Component
// ─────────────────────────────────────────────────────────────────────────────
export default function NexusVideoV3() {
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [finished, setFinished] = useState(false);

  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(0);
  const audioRef = useRef(null);

  // Audio-triggering events tracker
  const audioEventsRef = useRef(new Set());

  const triggerAudioOnce = useCallback((key, fn) => {
    if (!audioEventsRef.current.has(key)) {
      audioEventsRef.current.add(key);
      fn();
    }
  }, []);

  // ─── Start playback ───
  const handleStart = useCallback(() => {
    const engine = new WarmAudioEngine();
    engine.init();
    engine.start();
    audioRef.current = engine;
    setStarted(true);
    setTime(0);
    startTimeRef.current = performance.now();
    pausedAtRef.current = 0;
    audioEventsRef.current.clear();
  }, []);

  // ─── Animation loop ───
  useEffect(() => {
    if (!started || paused) return;
    function tick(now) {
      const elapsed = (now - startTimeRef.current) / 1000 + pausedAtRef.current;
      if (elapsed >= TOTAL_DURATION) {
        setTime(TOTAL_DURATION);
        setFinished(true);
        audioRef.current?.destroy();
        return;
      }
      setTime(elapsed);
      audioRef.current?.update(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    }
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [started, paused]);

  // ─── Pause / Resume ───
  const togglePause = useCallback(() => {
    if (!started || finished) return;
    if (paused) {
      startTimeRef.current = performance.now();
      setPaused(false);
    } else {
      pausedAtRef.current = time;
      setPaused(true);
    }
  }, [started, paused, time, finished]);

  // ─── Mute toggle ───
  const toggleMute = useCallback(() => {
    setMuted(m => {
      if (m) { audioRef.current?.unmute(time); }
      else { audioRef.current?.mute(); }
      return !m;
    });
  }, [time]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'm' || e.key === 'M') toggleMute();
      if (e.key === 'Escape') { window.location.hash = '/marketing-v2'; }
      if (e.key === ' ') { e.preventDefault(); togglePause(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMute, togglePause]);

  // ─── Cleanup ───
  useEffect(() => {
    return () => { audioRef.current?.destroy(); };
  }, []);

  // ─── Audio event triggers based on new timeline ───
  useEffect(() => {
    if (!audioRef.current || muted) return;

    // Morning briefing KPI ticks (13.5s, 15s, 16.5s)
    if (time >= 13.5 && time < 14.5) triggerAudioOnce('kpi1', () => audioRef.current?.tick());
    if (time >= 15 && time < 16) triggerAudioOnce('kpi2', () => audioRef.current?.tick());
    if (time >= 16.5 && time < 17.5) triggerAudioOnce('kpi3', () => audioRef.current?.tick());
    // Morning alert tick
    if (time >= 19 && time < 20) triggerAudioOnce('alert1', () => audioRef.current?.tick());

    // Gold line transitions (sweeps)
    if (time >= 22 && time < 23) triggerAudioOnce('sweep1', () => audioRef.current?.sweep());
    if (time >= 32 && time < 33) triggerAudioOnce('sweep2', () => audioRef.current?.sweep());
    if (time >= 42 && time < 43) triggerAudioOnce('sweep3', () => audioRef.current?.sweep());

    // Inventory transfer chime (button fills)
    if (time >= 27 && time < 28) triggerAudioOnce('chime1', () => audioRef.current?.chime());
    // Transfer done tick
    if (time >= 28 && time < 29) triggerAudioOnce('transferDone', () => audioRef.current?.tick());

    // PO line item ticks
    if (time >= 35.5 && time < 36.5) triggerAudioOnce('poLine1', () => audioRef.current?.tick());
    if (time >= 36.5 && time < 37.5) triggerAudioOnce('poLine2', () => audioRef.current?.tick());
    if (time >= 37.5 && time < 38.5) triggerAudioOnce('poLine3', () => audioRef.current?.tick());
    // PO discount badge
    if (time >= 38.5 && time < 39.5) triggerAudioOnce('poDiscount', () => audioRef.current?.chime());
    // PO submit chime
    if (time >= 40 && time < 41) triggerAudioOnce('poSubmit', () => audioRef.current?.chime());

    // Campaign channel ticks
    if (time >= 47 && time < 48) triggerAudioOnce('channel1', () => audioRef.current?.tick());
    if (time >= 47.8 && time < 48.8) triggerAudioOnce('channel2', () => audioRef.current?.tick());
    if (time >= 48.6 && time < 49.6) triggerAudioOnce('channel3', () => audioRef.current?.tick());
    // Campaign create chime
    if (time >= 50 && time < 51) triggerAudioOnce('campaignCreate', () => audioRef.current?.chime());

    // Data section soft ticks
    if (time >= 55.5 && time < 56) triggerAudioOnce('dataWord1', () => audioRef.current?.softTick());
    if (time >= 56 && time < 56.5) triggerAudioOnce('dataWord2', () => audioRef.current?.softTick());
    if (time >= 56.5 && time < 57) triggerAudioOnce('dataWord3', () => audioRef.current?.softTick());
  }, [time, muted, triggerAudioOnce]);

  const t = time;

  // ─── RENDER ───
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: T.bg, overflow: 'hidden',
        fontFamily: FONT_BODY, cursor: 'default',
      }}
      onClick={started && !finished ? togglePause : undefined}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&family=Inter:wght@300;400;500&display=swap');
      `}</style>

      {/* ─── PLAY BUTTON OVERLAY ─── */}
      {!started && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', zIndex: 100,
            background: T.bg, cursor: 'pointer',
          }}
          onClick={handleStart}
        >
          <div style={{
            width: 80, height: 80, borderRadius: '50%', border: `2px solid ${T.ink}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.3s, border-color 0.3s',
          }}>
            <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
              <path d="M4 2L22 14L4 26V2Z" fill={T.ink} />
            </svg>
          </div>
          <p style={{
            marginTop: 20, fontFamily: FONT_HEADING, fontWeight: 300,
            fontSize: 14, color: T.muted, letterSpacing: '0.08em',
          }}>
            PLAY FILM
          </p>
        </div>
      )}

      {/* ─── VIDEO CANVAS ─── */}
      {started && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* === OPENING (0-5s) === */}
          <Opening time={t} />

          {/* === THE QUESTION (5-10s) === */}
          <TheQuestion time={t} />

          {/* === GOLD LINE TRANSITION (10-11s) === */}
          <GoldLineTransition time={t} start={10} />

          {/* === PRODUCT 1: MORNING BRIEFING (11-22s) === */}
          <Product1Morning time={t} />

          {/* === GOLD LINE TRANSITION (22-23s) === */}
          <GoldLineTransition time={t} start={22} />

          {/* === PRODUCT 2: INVENTORY TRANSFERS (23-32s) === */}
          <Product2Inventory time={t} />

          {/* === GOLD LINE TRANSITION (32-33s) === */}
          <GoldLineTransition time={t} start={32} />

          {/* === PRODUCT 3: PURCHASE ORDERS (33-42s) === */}
          <Product3PurchaseOrder time={t} />

          {/* === GOLD LINE TRANSITION (42-43s) === */}
          <GoldLineTransition time={t} start={42} />

          {/* === PRODUCT 4: MARKETING CAMPAIGNS (43-52s) === */}
          <Product4Marketing time={t} />

          {/* === THE DATA (53-58s) === */}
          <TheData time={t} />

          {/* === THE CLOSE (58-65s) === */}
          <TheClose time={t} finished={finished} />
        </div>
      )}

      {/* ─── PAUSED INDICATOR ─── */}
      {started && paused && !finished && (
        <div style={{
          position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)',
          fontFamily: FONT_HEADING, fontWeight: 300, fontSize: 13,
          color: T.muted, letterSpacing: '0.12em', zIndex: 50,
        }}>
          PAUSED
        </div>
      )}

      {/* ─── MUTE TOGGLE ─── */}
      {started && (
        <button
          onClick={e => { e.stopPropagation(); toggleMute(); }}
          style={{
            position: 'absolute', bottom: 20, left: 20, zIndex: 50,
            background: 'none', border: `1px solid ${T.border}`, borderRadius: 6,
            padding: '6px 12px', cursor: 'pointer',
            fontFamily: FONT_BODY, fontSize: 11, color: T.muted,
            letterSpacing: '0.05em',
          }}
        >
          {muted ? 'UNMUTE (M)' : 'MUTE (M)'}
        </button>
      )}

      {/* ─── PROGRESS BAR ─── */}
      {started && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: T.border, zIndex: 50,
        }}>
          <div style={{
            height: '100%', background: T.gold,
            width: `${(time / TOTAL_DURATION) * 100}%`,
            transition: 'width 0.1s linear',
          }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Opening (0-5s) — kept exactly as-is
// ─────────────────────────────────────────────────────────────────────────────
function Opening({ time }) {
  if (time > 6) return null;
  const t = time;

  const lineProgress = easeInOut(progress(t, 0.3, 3));
  const textOpacity = easeOut(progress(t, 2, 1.5));
  const fadeOut = t > 4 ? 1 - progress(t, 4, 1.5) : 1;

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      {/* "by Dutchie" above the line */}
      <div style={{
        fontFamily: FONT_BODY, fontSize: 11, color: T.muted,
        letterSpacing: '0.06em', marginBottom: 12,
        opacity: textOpacity,
      }}>
        by Dutchie
      </div>

      {/* Gold line */}
      <div style={{
        width: 200, height: 1, background: T.border, position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          background: T.gold, width: `${lineProgress * 100}%`,
        }} />
      </div>

      {/* "nexus" below the line */}
      <div style={{
        fontFamily: FONT_HEADING, fontWeight: 200, fontSize: 60,
        color: T.ink, letterSpacing: '0.15em', marginTop: 12,
        opacity: textOpacity,
      }}>
        nexus
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: The Question (5-10s) — kept as-is
// ─────────────────────────────────────────────────────────────────────────────
function TheQuestion({ time }) {
  if (time < 5 || time > 11) return null;
  const t = time;

  const q1Opacity = easeOut(progress(t, 5, 1.2));
  const q2Opacity = easeOut(progress(t, 7, 1));
  const fadeOut = t > 9 ? 1 - progress(t, 9, 1.5) : 1;

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut, padding: '0 40px',
    }}>
      <div style={{
        fontFamily: FONT_HEADING, fontWeight: 300, fontSize: 28,
        color: T.ink, textAlign: 'center', lineHeight: 1.4,
        opacity: q1Opacity, maxWidth: 540,
      }}>
        How much time do you spend managing your business?
      </div>
      <div style={{
        fontFamily: FONT_BODY, fontWeight: 400, fontSize: 18,
        color: T.secondary, fontStyle: 'italic', textAlign: 'center',
        marginTop: 16, opacity: q2Opacity,
      }}>
        Instead of growing it.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT 1: The Morning Briefing (11-22s) — ALONE on screen
// ─────────────────────────────────────────────────────────────────────────────
function Product1Morning({ time }) {
  if (time < 10.5 || time > 22.5) return null;
  const t = time;

  const containerFadeIn = easeOut(progress(t, 11, 1));
  const fadeOut = t > 21 ? 1 - progress(t, 21, 1) : 1;
  const labelOpacity = easeOut(progress(t, 11.2, 0.8));

  const greetingOpacity = easeOut(progress(t, 12, 1));
  const kpi1Opacity = easeOut(progress(t, 13.5, 0.8));
  const kpi2Opacity = easeOut(progress(t, 15, 0.8));
  const kpi3Opacity = easeOut(progress(t, 16.5, 0.8));
  const narrativeActive = t >= 17.5;
  const alertOpacity = easeOut(progress(t, 19, 0.8));
  const captionOpacity = easeOut(progress(t, 20, 0.8));

  const kpi1Active = t >= 13.5;
  const kpi2Active = t >= 15;
  const kpi3Active = t >= 16.5;

  const narrative = "2,840 transactions across 3 locations. 3.2 items per basket. Pre-roll category up 12%.";
  const narrativeText = useTypewriter(narrative, narrativeActive, 25);

  const rev = useCounter('1.2', kpi1Active, 1200, '$', 'M');
  const margin = useCounter('48.2', kpi2Active, 1200, '', '%');
  const aov = useCounter('98', kpi3Active, 1000, '$', '');

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: containerFadeIn * fadeOut, padding: '0 20px',
    }}>
      {/* Section label */}
      <SectionLabel number="01" label="YOUR MORNING" opacity={labelOpacity} />

      {/* Command Center mockup — large, centered, alone */}
      <div style={{
        width: '100%', maxWidth: 600, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 12,
        padding: '32px 36px', position: 'relative',
      }}>
        {/* Greeting */}
        <div style={{
          fontFamily: FONT_HEADING, fontWeight: 400, fontSize: 20,
          color: T.text, opacity: greetingOpacity, marginBottom: 24,
        }}>
          Good morning, Sarah
        </div>

        {/* KPI Cards — each gets space */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          <KPICard label="Net Revenue" value={rev} delta="+6.8%" opacity={kpi1Opacity} />
          <KPICard label="Gross Margin" value={margin} delta="+0.8pp" opacity={kpi2Opacity} />
          <KPICard label="AOV" value={aov} delta="+$4" opacity={kpi3Opacity} />
        </div>

        {/* Operating narrative */}
        {narrativeActive && (
          <div style={{
            fontFamily: FONT_BODY, fontSize: 13, color: T.secondary,
            lineHeight: 1.7, marginBottom: 20, minHeight: 40,
          }}>
            {narrativeText}
            <span style={{ opacity: 0.4 }}>|</span>
          </div>
        )}

        {/* Smart alert */}
        <div style={{
          background: T.deep, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          opacity: alertOpacity,
          transform: `translateY(${(1 - alertOpacity) * 16}px)`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#C4421A', flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
              color: T.text,
            }}>
              Blue Dream 3.5g — Out of stock
            </div>
            <div style={{
              fontFamily: FONT_BODY, fontSize: 11, color: T.muted, marginTop: 3,
            }}>
              Logan Square
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <Caption text="Everything you need. Before your first coffee." opacity={captionOpacity} />
    </div>
  );
}

function KPICard({ label, value, delta, opacity }) {
  return (
    <div style={{
      flex: 1, background: T.bg, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '16px 14px', opacity,
      transform: `translateY(${(1 - opacity) * 12}px)`,
      transition: 'transform 0.3s ease-out',
    }}>
      <div style={{
        fontFamily: FONT_BODY, fontSize: 10, color: T.muted,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: FONT_HEADING, fontWeight: 300, fontSize: 24,
        color: T.ink, marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: FONT_BODY, fontSize: 11, color: T.green, fontWeight: 500,
      }}>
        {delta}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT 2: Inventory Transfers (23-32s) — ALONE on screen
// ─────────────────────────────────────────────────────────────────────────────
function Product2Inventory({ time }) {
  if (time < 22.5 || time > 32.5) return null;
  const t = time;

  const containerFadeIn = easeOut(progress(t, 23, 0.8));
  const fadeOut = t > 31 ? 1 - progress(t, 31, 1) : 1;
  const labelOpacity = easeOut(progress(t, 23.2, 0.8));

  const titleOpacity = easeOut(progress(t, 23.5, 0.8));
  const detailOpacity = easeOut(progress(t, 24.5, 0.8));
  const buttonPulse = progress(t, 26, 1);
  const isDone = t >= 27.5;
  const doneOpacity = easeOut(progress(t, 27.5, 0.6));
  const metrcOpacity = easeOut(progress(t, 28.2, 0.6));
  const captionOpacity = easeOut(progress(t, 29, 0.8));

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: containerFadeIn * fadeOut, padding: '0 20px',
    }}>
      {/* Section label */}
      <SectionLabel number="02" label="INVENTORY" opacity={labelOpacity} />

      {/* Alert card — centered, large */}
      <div style={{
        width: '100%', maxWidth: 480, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 12,
        padding: '32px 36px',
      }}>
        {/* Product name */}
        <div style={{
          fontFamily: FONT_HEADING, fontWeight: 500, fontSize: 20,
          color: T.text, marginBottom: 8, opacity: titleOpacity,
        }}>
          Blue Dream 3.5g
        </div>

        {/* Status detail */}
        <div style={{ opacity: detailOpacity, marginBottom: 24 }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 14, color: '#C4421A',
            fontWeight: 500, marginBottom: 6,
          }}>
            Out of stock on floor
          </div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 14, color: T.secondary,
          }}>
            45 units available in vault
          </div>
        </div>

        {/* Transfer button */}
        <div style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 8,
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
          background: isDone ? T.green : `linear-gradient(90deg, ${T.green} ${buttonPulse * 100}%, ${T.deep} ${buttonPulse * 100}%)`,
          color: isDone ? '#fff' : (buttonPulse > 0.5 ? '#fff' : T.text),
          border: `1px solid ${isDone ? T.green : T.border}`,
          transition: 'color 0.3s',
          cursor: 'default',
        }}>
          {isDone ? 'Transferred. 45 units moved to floor.' : 'Transfer from Vault'}
        </div>

        {/* METRC badge */}
        {isDone && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 16, opacity: metrcOpacity,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: T.green,
            }} />
            <div style={{
              fontFamily: FONT_BODY, fontSize: 12, color: T.green, fontWeight: 500,
            }}>
              METRC updated automatically
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      <Caption text="Stockouts resolved in seconds. Compliance built in." opacity={captionOpacity} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT 3: Purchase Orders (33-42s) — ALONE on screen
// ─────────────────────────────────────────────────────────────────────────────
function Product3PurchaseOrder({ time }) {
  if (time < 32.5 || time > 42.5) return null;
  const t = time;

  const containerFadeIn = easeOut(progress(t, 33, 0.8));
  const fadeOut = t > 41 ? 1 - progress(t, 41, 1) : 1;
  const labelOpacity = easeOut(progress(t, 33.2, 0.8));

  const headerOpacity = easeOut(progress(t, 33.5, 0.8));
  const line1Opacity = easeOut(progress(t, 35, 0.8));
  const line2Opacity = easeOut(progress(t, 36, 0.8));
  const line3Opacity = easeOut(progress(t, 37, 0.8));
  const discountOpacity = easeOut(progress(t, 38, 0.8));
  const totalOpacity = easeOut(progress(t, 38.5, 0.6));
  const submitDone = t >= 40;
  const submitProgress = progress(t, 39, 1);
  const captionOpacity = easeOut(progress(t, 40.5, 0.8));

  const lineItems = [
    { name: 'Jeeter Infused Pre-Roll 1g', qty: 56, price: '$672', opacity: line1Opacity },
    { name: 'Jeeter Liquid Diamonds 0.5g', qty: 28, price: '$504', opacity: line2Opacity },
    { name: 'Jeeter Baby Jeeter 5pk', qty: 14, price: '$308', opacity: line3Opacity },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: containerFadeIn * fadeOut, padding: '0 20px',
    }}>
      {/* Section label */}
      <SectionLabel number="03" label="PURCHASING" opacity={labelOpacity} />

      {/* PO Card — centered, large */}
      <div style={{
        width: '100%', maxWidth: 540, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 12,
        padding: '32px 36px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 24, opacity: headerOpacity,
        }}>
          {/* Vendor logo placeholder */}
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: T.deep,
            border: `1px solid ${T.border}`, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 500, color: T.gold,
          }}>
            J
          </div>
          <div>
            <div style={{
              fontFamily: FONT_HEADING, fontWeight: 500, fontSize: 18, color: T.text,
            }}>
              Reorder — Jeeter
            </div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ marginBottom: 20 }}>
          {lineItems.map(({ name, qty, price, opacity }) => (
            <div key={name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: `1px solid ${T.border}`,
              opacity,
              transform: `translateY(${(1 - opacity) * 8}px)`,
            }}>
              <div style={{
                fontFamily: FONT_BODY, fontSize: 13, color: T.text,
              }}>
                {name}
                <span style={{ color: T.muted, marginLeft: 8 }}>&times; {qty}</span>
              </div>
              <div style={{
                fontFamily: FONT_HEADING, fontSize: 14, fontWeight: 500, color: T.ink,
              }}>
                {price}
              </div>
            </div>
          ))}
        </div>

        {/* Discount badge */}
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 6,
          background: `${T.gold}15`, border: `1px solid ${T.gold}30`,
          fontFamily: FONT_BODY, fontSize: 12, fontWeight: 500,
          color: T.gold, marginBottom: 16, opacity: discountOpacity,
        }}>
          20% Brand-Funded Discount — saves $100
        </div>

        {/* Total + submit */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 16, borderTop: `1px solid ${T.border}`,
          opacity: totalOpacity,
        }}>
          <div style={{
            fontFamily: FONT_HEADING, fontWeight: 500, fontSize: 22, color: T.ink,
          }}>
            $1,384
          </div>
          <div style={{
            display: 'inline-block', padding: '10px 24px', borderRadius: 8,
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
            background: submitDone ? T.green : `linear-gradient(90deg, ${T.green} ${submitProgress * 100}%, ${T.deep} ${submitProgress * 100}%)`,
            color: submitDone ? '#fff' : (submitProgress > 0.5 ? '#fff' : T.text),
            border: `1px solid ${submitDone ? T.green : T.border}`,
            transition: 'color 0.3s',
            cursor: 'default',
          }}>
            {submitDone ? 'Submitted' : 'Submit via Dutchie Connect'}
          </div>
        </div>
      </div>

      {/* Caption */}
      <Caption text="Bundled by vendor. Discounts surfaced. One click to order." opacity={captionOpacity} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT 4: Marketing Campaigns (43-52s) — ALONE on screen
// ─────────────────────────────────────────────────────────────────────────────
function Product4Marketing({ time }) {
  if (time < 42.5 || time > 52.5) return null;
  const t = time;

  const containerFadeIn = easeOut(progress(t, 43, 0.8));
  const fadeOut = t > 51 ? 1 - progress(t, 51, 1) : 1;
  const labelOpacity = easeOut(progress(t, 43.2, 0.8));

  const headerOpacity = easeOut(progress(t, 43.5, 0.8));
  const segmentOpacity = easeOut(progress(t, 44.5, 0.8));
  const channel1Opacity = easeOut(progress(t, 46, 0.6));
  const channel2Opacity = easeOut(progress(t, 46.8, 0.6));
  const channel3Opacity = easeOut(progress(t, 47.6, 0.6));
  const offerOpacity = easeOut(progress(t, 48.5, 0.6));
  const buttonDone = t >= 50;
  const buttonProgress = progress(t, 49, 1);
  const captionOpacity = easeOut(progress(t, 50.5, 0.8));

  const channels = [
    { name: 'Email', reach: '1,180 reach', opacity: channel1Opacity },
    { name: 'SMS', reach: '892 reach', opacity: channel2Opacity },
    { name: 'Push', reach: '340 reach', opacity: channel3Opacity },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: containerFadeIn * fadeOut, padding: '0 20px',
    }}>
      {/* Section label */}
      <SectionLabel number="04" label="GROWTH" opacity={labelOpacity} />

      {/* Campaign card — centered, large */}
      <div style={{
        width: '100%', maxWidth: 520, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 12,
        padding: '32px 36px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 20, opacity: headerOpacity,
        }}>
          <div style={{
            fontFamily: FONT_HEADING, fontWeight: 500, fontSize: 18, color: T.text,
          }}>
            Win-Back Campaign
          </div>
          <div style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 4,
            background: `${T.green}15`, border: `1px solid ${T.green}30`,
            fontFamily: FONT_BODY, fontSize: 10, fontWeight: 500,
            color: T.green, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Automated
          </div>
        </div>

        {/* Segment */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 24, opacity: segmentOpacity,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke={T.muted} strokeWidth="1.2" fill="none" />
            <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={T.muted} strokeWidth="1.2" fill="none" />
          </svg>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 14, color: T.secondary,
          }}>
            1,247 at-risk customers
          </div>
        </div>

        {/* Channel cards — appear one by one */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {channels.map(({ name, reach, opacity }) => (
            <div key={name} style={{
              flex: 1, background: T.bg, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '14px 12px', opacity,
              transform: `translateY(${(1 - opacity) * 10}px)`,
              transition: 'transform 0.3s ease-out',
            }}>
              <div style={{
                fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
                color: T.text, marginBottom: 4,
              }}>
                {name}
              </div>
              <div style={{
                fontFamily: FONT_BODY, fontSize: 11, color: T.muted,
              }}>
                {reach}
              </div>
            </div>
          ))}
        </div>

        {/* Offer */}
        <div style={{
          fontFamily: FONT_BODY, fontSize: 13, color: T.secondary,
          marginBottom: 20, opacity: offerOpacity,
          padding: '10px 14px', background: T.deep, borderRadius: 6,
        }}>
          15% off next visit — expires in 14 days
        </div>

        {/* Create Campaign button */}
        <div style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 8,
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
          background: buttonDone ? T.green : `linear-gradient(90deg, ${T.green} ${buttonProgress * 100}%, ${T.deep} ${buttonProgress * 100}%)`,
          color: buttonDone ? '#fff' : (buttonProgress > 0.5 ? '#fff' : T.text),
          border: `1px solid ${buttonDone ? T.green : T.border}`,
          transition: 'color 0.3s',
          cursor: 'default',
        }}>
          {buttonDone ? '4 system objects created' : 'Create Campaign Package'}
        </div>
      </div>

      {/* Caption */}
      <Caption text="Campaigns built from real POS data. You approve. They run." opacity={captionOpacity} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: The Data (53-58s) — simpler, centered
// ─────────────────────────────────────────────────────────────────────────────
function TheData({ time }) {
  if (time < 52 || time > 59) return null;
  const t = time;

  const containerFadeIn = easeOut(progress(t, 53, 1));
  const fadeOut = t > 57.5 ? 1 - progress(t, 57.5, 1) : 1;

  const numberOpacity = easeOut(progress(t, 53, 1));
  const subtextOpacity = easeOut(progress(t, 54, 0.8));
  const word1 = easeOut(progress(t, 55.5, 0.5));
  const word2 = easeOut(progress(t, 56, 0.5));
  const word3 = easeOut(progress(t, 56.5, 0.5));

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: containerFadeIn * fadeOut,
    }}>
      {/* $100B+ */}
      <div style={{
        fontFamily: FONT_HEADING, fontWeight: 200, fontSize: 72,
        color: T.ink, letterSpacing: '-0.02em', opacity: numberOpacity,
      }}>
        $100B+
      </div>

      {/* Subtext */}
      <div style={{
        fontFamily: FONT_BODY, fontSize: 16, color: T.secondary,
        marginTop: 16, opacity: subtextOpacity, textAlign: 'center',
        maxWidth: 440,
      }}>
        in cannabis transactions powering every recommendation
      </div>

      {/* Three words */}
      <div style={{ display: 'flex', gap: 32, marginTop: 32 }}>
        {[
          { label: 'Benchmark.', op: word1 },
          { label: 'Predict.', op: word2 },
          { label: 'Optimize.', op: word3 },
        ].map(({ label, op }) => (
          <div key={label} style={{
            fontFamily: FONT_HEADING, fontWeight: 300, fontSize: 20,
            color: T.secondary, opacity: op,
          }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: The Close (58-65s) — kept as-is
// ─────────────────────────────────────────────────────────────────────────────
function TheClose({ time, finished }) {
  if (time < 58) return null;
  const t = time;

  const iconOpacity = easeOut(progress(t, 59, 1.2));
  const nameOpacity = easeOut(progress(t, 59.5, 1));
  const taglineOpacity = easeOut(progress(t, 60, 1));
  const bylineOpacity = easeOut(progress(t, 60.5, 0.8));
  const ctaOpacity = easeOut(progress(t, 62, 1));

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* NexusIcon */}
      <div style={{ opacity: iconOpacity }}>
        <NexusIcon size={60} />
      </div>

      {/* nexus */}
      <div style={{
        fontFamily: FONT_HEADING, fontWeight: 200, fontSize: 48,
        color: T.ink, letterSpacing: '0.15em', marginTop: 16,
        opacity: nameOpacity,
      }}>
        nexus
      </div>

      {/* Tagline */}
      <div style={{
        fontFamily: FONT_BODY, fontSize: 14, color: T.secondary,
        marginTop: 12, opacity: taglineOpacity,
      }}>
        Intelligence for cannabis operations.
      </div>

      {/* by Dutchie */}
      <div style={{
        fontFamily: FONT_BODY, fontSize: 11, color: T.muted,
        marginTop: 8, opacity: bylineOpacity,
      }}>
        by Dutchie
      </div>

      {/* CTA link */}
      <a
        href="#/marketing-v2"
        onClick={e => e.stopPropagation()}
        style={{
          fontFamily: FONT_BODY, fontSize: 13, color: T.gold,
          marginTop: 32, opacity: ctaOpacity, textDecoration: 'none',
          letterSpacing: '0.02em',
        }}
      >
        Explore nexus &rarr;
      </a>
    </div>
  );
}
