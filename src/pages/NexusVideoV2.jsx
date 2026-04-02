import React, { useState, useEffect, useRef, useCallback } from 'react';
import NexusIcon from '../components/NexusIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: '#030303',
  text: '#F0EDE8',
  dim: '#6B6359',
  muted: '#3D3529',
  gold: '#D4A03A',
  goldDim: 'rgba(212,160,58,0.10)',
  green: '#00C27C',
  card: '#0C0B09',
  border: '#1C1A17',
  warmBg: '#0A0908',
};

const FONT = "'DM Sans', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";
const TOTAL_DURATION = 60; // seconds

// ─────────────────────────────────────────────────────────────────────────────
// Chaos dot labels
// ─────────────────────────────────────────────────────────────────────────────
const CHAOS_LABELS = [
  'Reports', 'Inventory', 'Pricing', 'Marketing', 'Compliance',
  'POS', 'Ecommerce', 'Spreadsheets', 'METRC', 'Vendors',
  'Analytics', 'Payroll', 'Scheduling', 'Taxes', 'Loyalty',
  'Delivery', 'Menus', 'Training', 'Security', 'Banking',
  'Audits', 'Procurement', 'Budgets', 'Waste', 'Returns',
];

// Generate deterministic scatter positions for chaos dots
function generateScatterPositions(count) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i * 0.7);
    const radius = 15 + (i % 5) * 8 + ((i * 7) % 11) * 2;
    positions.push({
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      driftX: (((i * 13) % 7) - 3) * 0.3,
      driftY: (((i * 17) % 7) - 3) * 0.3,
    });
  }
  return positions;
}

const SCATTER_POSITIONS = generateScatterPositions(CHAOS_LABELS.length);

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar nav items for dashboard mock
// ─────────────────────────────────────────────────────────────────────────────
const SIDEBAR_NAV = [
  'Command Center', 'Store Performance', 'Inventory',
  'Analytics', 'Brands', 'Customers', 'Connect Agent',
  'Pricing', 'Growth Agent',
];

// ─────────────────────────────────────────────────────────────────────────────
// Web Audio API — Full Cinematic Score
// ─────────────────────────────────────────────────────────────────────────────
function createCinematicAudio(audioCtx) {
  // Foundation oscillators
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 110; // A2
  osc2.type = 'sine';
  osc2.frequency.value = 164.81; // E3

  // Dissonance oscillator for chaos
  const oscDissonant = audioCtx.createOscillator();
  oscDissonant.type = 'sine';
  oscDissonant.frequency.value = 116.54; // Bb2
  const dissonantGain = audioCtx.createGain();
  dissonantGain.gain.value = 0;

  // Shimmer oscillator for convergence
  const oscShimmer = audioCtx.createOscillator();
  oscShimmer.type = 'triangle';
  oscShimmer.frequency.value = 1760; // A6
  const shimmerGain = audioCtx.createGain();
  shimmerGain.gain.value = 0;

  // Fifth oscillator for $100B swell
  const oscFifth = audioCtx.createOscillator();
  oscFifth.type = 'sine';
  oscFifth.frequency.value = 329.63; // E4
  const fifthGain = audioCtx.createGain();
  fifthGain.gain.value = 0;

  // Sweep oscillator for gold line
  const oscSweep = audioCtx.createOscillator();
  oscSweep.type = 'sine';
  oscSweep.frequency.value = 200;
  const sweepGain = audioCtx.createGain();
  sweepGain.gain.value = 0;

  // Master chain
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  filter.Q.value = 1;

  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;

  // Tick sound gain (for UI element appearances)
  const tickGain = audioCtx.createGain();
  tickGain.gain.value = 0;

  // Routing
  osc1.connect(filter);
  osc2.connect(filter);
  oscDissonant.connect(dissonantGain);
  dissonantGain.connect(filter);
  oscShimmer.connect(shimmerGain);
  shimmerGain.connect(masterGain);
  oscFifth.connect(fifthGain);
  fifthGain.connect(masterGain);
  oscSweep.connect(sweepGain);
  sweepGain.connect(masterGain);
  filter.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  // Start all oscillators
  osc1.start();
  osc2.start();
  oscDissonant.start();
  oscShimmer.start();
  oscFifth.start();
  oscSweep.start();

  // Track mute state for external mute toggle
  let isMuted = false;
  let targetGainBeforeMute = 0.06;

  function tick(loudness = 0.02) {
    if (isMuted) return;
    const tickOsc = audioCtx.createOscillator();
    const tGain = audioCtx.createGain();
    tickOsc.type = 'sine';
    tickOsc.frequency.value = 880;
    tGain.gain.value = loudness;
    tickOsc.connect(tGain);
    tGain.connect(masterGain);
    tickOsc.start();
    tGain.gain.setValueAtTime(loudness, audioCtx.currentTime);
    tGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    tickOsc.stop(audioCtx.currentTime + 0.06);
  }

  return {
    // Opening: fade in foundation
    fadeIn() {
      const t = audioCtx.currentTime;
      masterGain.gain.setValueAtTime(0, t);
      masterGain.gain.linearRampToValueAtTime(0.06, t + 3);
      targetGainBeforeMute = 0.06;
    },

    // Chaos: add dissonance, muffle filter
    startChaos() {
      const t = audioCtx.currentTime;
      dissonantGain.gain.setValueAtTime(0, t);
      dissonantGain.gain.linearRampToValueAtTime(1, t + 1);
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      filter.frequency.linearRampToValueAtTime(400, t + 1.5);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(0.08, t + 1);
      targetGainBeforeMute = 0.08;
    },

    // Convergence: remove dissonance, open filter, add shimmer
    startConvergence() {
      const t = audioCtx.currentTime;
      dissonantGain.gain.setValueAtTime(dissonantGain.gain.value, t);
      dissonantGain.gain.linearRampToValueAtTime(0, t + 1);
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      filter.frequency.linearRampToValueAtTime(1000, t + 6);
      shimmerGain.gain.setValueAtTime(0, t);
      shimmerGain.gain.linearRampToValueAtTime(0.01, t + 2);
    },

    // Dashboard: steady warm pad with ticks
    startDashboard() {
      const t = audioCtx.currentTime;
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      filter.frequency.linearRampToValueAtTime(800, t + 1);
      shimmerGain.gain.setValueAtTime(shimmerGain.gain.value, t);
      shimmerGain.gain.linearRampToValueAtTime(0, t + 1);
    },

    tick,

    // Actions: rhythmic pulse
    startActions() {
      // The gain modulation is handled via the component's tick calls
    },

    successTick() {
      tick(0.04);
    },

    // $100B swell
    startSwell() {
      const t = audioCtx.currentTime;
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      filter.frequency.linearRampToValueAtTime(1500, t + 2);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(0.12, t + 2);
      fifthGain.gain.setValueAtTime(0, t);
      fifthGain.gain.linearRampToValueAtTime(0.3, t + 2);
      targetGainBeforeMute = 0.12;
    },

    // Gold line sweep
    startSweep() {
      const t = audioCtx.currentTime;
      oscSweep.frequency.setValueAtTime(200, t);
      oscSweep.frequency.linearRampToValueAtTime(400, t + 2);
      sweepGain.gain.setValueAtTime(0, t);
      sweepGain.gain.linearRampToValueAtTime(0.015, t + 0.5);
      sweepGain.gain.linearRampToValueAtTime(0, t + 2);
    },

    // Close: fade everything out
    startClose() {
      const t = audioCtx.currentTime;
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      filter.frequency.linearRampToValueAtTime(600, t + 2);
      fifthGain.gain.setValueAtTime(fifthGain.gain.value, t);
      fifthGain.gain.linearRampToValueAtTime(0, t + 2);
      sweepGain.gain.setValueAtTime(sweepGain.gain.value, t);
      sweepGain.gain.linearRampToValueAtTime(0, t + 1);
      shimmerGain.gain.setValueAtTime(shimmerGain.gain.value, t);
      shimmerGain.gain.linearRampToValueAtTime(0, t + 1);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(0, t + 4);
      targetGainBeforeMute = 0;
    },

    mute() {
      isMuted = true;
      const t = audioCtx.currentTime;
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(0, t + 0.15);
    },

    unmute() {
      isMuted = false;
      const t = audioCtx.currentTime;
      masterGain.gain.setValueAtTime(0, t);
      masterGain.gain.linearRampToValueAtTime(targetGainBeforeMute, t + 0.15);
    },

    stop() {
      [osc1, osc2, oscDissonant, oscShimmer, oscFifth, oscSweep].forEach(o => {
        try { o.stop(); } catch (_) {}
      });
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useAnimationClock — a precise elapsed-time clock at 60fps
// ─────────────────────────────────────────────────────────────────────────────
function useAnimationClock(playing) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const pausedAtRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (playing) {
      startRef.current = performance.now() - pausedAtRef.current * 1000;
      const loop = () => {
        const now = performance.now();
        const t = (now - startRef.current) / 1000;
        setElapsed(Math.min(t, TOTAL_DURATION));
        if (t < TOTAL_DURATION) {
          rafRef.current = requestAnimationFrame(loop);
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing]);

  useEffect(() => {
    if (!playing) pausedAtRef.current = elapsed;
  }, [playing, elapsed]);

  return elapsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Easing helpers
// ─────────────────────────────────────────────────────────────────────────────
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function lerp(a, b, t) { return a + (b - a) * clamp01(t); }
function fadeIn(elapsed, start, dur) { return clamp01((elapsed - start) / dur); }
function fadeOut(elapsed, start, dur) { return 1 - clamp01((elapsed - start) / dur); }
function fadeInOut(elapsed, inStart, inDur, outStart, outDur) {
  return Math.min(fadeIn(elapsed, inStart, inDur), fadeOut(elapsed, outStart, outDur));
}

// Counter animation (for KPI numbers)
function animatedCount(elapsed, start, dur, targetStr) {
  const progress = easeOutCubic(clamp01((elapsed - start) / dur));
  // Parse numeric portion
  const match = targetStr.match(/^([^0-9]*)([0-9.]+)(.*)$/);
  if (!match) return targetStr;
  const [, prefix, numStr, suffix] = match;
  const target = parseFloat(numStr);
  const current = target * progress;
  // Match decimal places
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  return prefix + current.toFixed(decimals) + suffix;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// The breathing gold dot (Opening)
function BreathingDot({ elapsed }) {
  // 0-1s: invisible. 1-5s: grows from 2px to 8px
  if (elapsed < 1) return null;
  const growProgress = easeOutCubic(clamp01((elapsed - 1) / 4));
  const size = 2 + growProgress * 6;
  // Gentle breathing pulse
  const pulse = 1 + Math.sin(elapsed * 2) * 0.15;
  const actualSize = size * pulse;
  // Glow intensity grows with size
  const glowRadius = actualSize * 3;
  const opacity = clamp01((elapsed - 1) / 1);

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: actualSize, height: actualSize,
      borderRadius: '50%',
      background: C.gold,
      boxShadow: `0 0 ${glowRadius}px rgba(212,160,58,0.4), 0 0 ${glowRadius*2}px rgba(212,160,58,0.15)`,
      opacity,
      transition: 'none',
    }} />
  );
}

// Chaos dots (Act 1)
function ChaosDots({ elapsed }) {
  // 5-12s: dots scatter and drift
  // 12-18s: converge to center
  if (elapsed < 5) return null;
  const scatterProgress = easeOutCubic(clamp01((elapsed - 5) / 1.5));
  const labelFade = clamp01((elapsed - 6) / 1);
  // Convergence (12-15s)
  const convergeProgress = easeInOutCubic(clamp01((elapsed - 12) / 3));
  // Fade out after merge (15s+)
  const dotsFade = fadeOut(elapsed, 15, 0.5);

  if (dotsFade <= 0) return null;

  return (
    <>
      {CHAOS_LABELS.map((label, i) => {
        const pos = SCATTER_POSITIONS[i];
        // Drift over time
        const drift = Math.max(0, elapsed - 5.5);
        const driftedX = pos.x + pos.driftX * drift;
        const driftedY = pos.y + pos.driftY * drift;
        // Interpolate between scattered and center
        const x = lerp(driftedX, 50, convergeProgress) * scatterProgress + 50 * (1 - scatterProgress);
        const y = lerp(driftedY, 50, convergeProgress) * scatterProgress + 50 * (1 - scatterProgress);

        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: dotsFade,
            transition: 'none',
          }}>
            <div style={{
              width: lerp(6, 3, convergeProgress),
              height: lerp(6, 3, convergeProgress),
              borderRadius: '50%',
              background: C.gold,
              boxShadow: `0 0 ${lerp(8, 2, convergeProgress)}px rgba(212,160,58,0.3)`,
            }} />
            {convergeProgress < 0.7 && (
              <div style={{
                position: 'absolute', top: 10, left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontFamily: FONT, fontSize: 10, fontWeight: 400,
                color: C.dim,
                opacity: labelFade * (1 - convergeProgress * 1.4),
                letterSpacing: '0.02em',
              }}>{label}</div>
            )}
          </div>
        );
      })}
    </>
  );
}

// NexusIcon convergence (Act 2 ending)
function ConvergedIcon({ elapsed }) {
  // 15-18s: icon appears at center with glow
  // 18-20s: shrinks and moves to top-left
  if (elapsed < 14.5) return null;
  const iconFade = fadeIn(elapsed, 14.5, 1);
  const holdEnd = 18;
  const moveProgress = easeInOutCubic(clamp01((elapsed - holdEnd) / 1.5));

  // Center -> top-left
  const left = lerp(50, 5, moveProgress);
  const top = lerp(50, 4, moveProgress);
  const size = lerp(60, 26, moveProgress);
  const glowIntensity = lerp(25, 8, moveProgress);

  // Nexus text below icon
  const textFade = fadeInOut(elapsed, 15.5, 0.8, holdEnd, 0.8);

  // Fade out after dashboard fully builds (30s)
  const globalFade = elapsed > 30 ? fadeOut(elapsed, 30, 1) : 1;
  if (globalFade <= 0) return null;

  return (
    <>
      <div style={{
        position: 'absolute',
        left: `${left}%`, top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        opacity: iconFade * globalFade,
        filter: `drop-shadow(0 0 ${glowIntensity}px rgba(212,160,58,0.5))`,
        transition: 'none',
      }}>
        <NexusIcon size={size} />
      </div>
      {textFade > 0 && (
        <div style={{
          position: 'absolute',
          left: '50%', top: 'calc(50% + 45px)',
          transform: 'translateX(-50%)',
          fontFamily: FONT, fontWeight: 200, fontSize: 48,
          color: C.text, opacity: textFade * globalFade,
          letterSpacing: '0.06em',
        }}>nexus</div>
      )}
    </>
  );
}

// Dashboard mock build (Act 3: 18-30s)
function DashboardBuild({ elapsed }) {
  if (elapsed < 19) return null;
  const dashFade = fadeIn(elapsed, 19, 0.8);
  // Overall exit
  const exitFade = elapsed > 29 ? fadeOut(elapsed, 29, 1.5) : 1;
  if (exitFade <= 0) return null;

  // Sidebar: 19-21s
  const sidebarProgress = clamp01((elapsed - 19) / 1.5);
  // Morning briefing: 21-23s
  const briefingProgress = clamp01((elapsed - 21) / 1);
  // KPIs: 23-26s
  const kpiProgress = clamp01((elapsed - 23) / 2);
  // Alert: 26-28s
  const alertProgress = clamp01((elapsed - 26) / 1);
  // Button pulse: 28-29.5s
  const buttonPulse = elapsed >= 28 && elapsed < 29.5 ? 1 : 0;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex',
      opacity: dashFade * exitFade,
      padding: '60px 40px 60px 40px',
      transition: 'none',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 200, flexShrink: 0,
        background: '#0A0908',
        borderRight: `1px solid ${C.border}`,
        borderRadius: '12px 0 0 12px',
        padding: '20px 0',
        transform: `translateX(${-200 * (1 - easeOutCubic(sidebarProgress))}px)`,
        opacity: sidebarProgress,
        overflow: 'hidden',
      }}>
        {/* Sidebar icon */}
        <div style={{ padding: '0 16px 16px', borderBottom: `1px solid ${C.border}`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <NexusIcon size={20} />
          <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 300, color: C.text, letterSpacing: '0.04em' }}>nexus</span>
        </div>
        {SIDEBAR_NAV.map((label, i) => {
          const itemDelay = 19.3 + i * 0.12;
          const itemProgress = clamp01((elapsed - itemDelay) / 0.3);
          return (
            <div key={i} style={{
              padding: '6px 16px',
              fontFamily: FONT, fontSize: 11, fontWeight: 400,
              color: i === 0 ? C.green : C.dim,
              opacity: itemProgress,
              transform: `translateX(${10 * (1 - itemProgress)}px)`,
              whiteSpace: 'nowrap',
            }}>
              {i === 0 && <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: C.green, marginRight: 8, verticalAlign: 'middle' }} />}
              {label}
            </div>
          );
        })}
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1, background: C.bg,
        borderRadius: '0 12px 12px 0',
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Morning Briefing */}
        {briefingProgress > 0 && (
          <div style={{
            background: '#0C0B09',
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 16,
            opacity: easeOutCubic(briefingProgress),
            transform: `translateY(${-20 * (1 - briefingProgress)}px)`,
          }}>
            <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, color: C.gold, marginBottom: 6, letterSpacing: '0.04em' }}>MORNING BRIEFING</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.text, fontWeight: 400, lineHeight: 1.5 }}>
              Good morning. 3 locations need attention today. Net revenue is up 4.2% vs. last week.
            </div>
          </div>
        )}

        {/* KPI Row */}
        {kpiProgress > 0 && (
          <div style={{
            display: 'flex', gap: 12, marginBottom: 16,
            opacity: easeOutCubic(kpiProgress),
          }}>
            {[
              { label: 'Net Revenue', value: '$1.2M', delay: 0 },
              { label: 'Margin', value: '48.2%', delay: 0.4 },
              { label: 'AOV', value: '$98', delay: 0.8 },
            ].map(({ label, value, delay }, i) => {
              const cardProgress = clamp01((elapsed - 23 - delay) / 1);
              return (
                <div key={i} style={{
                  flex: 1, background: '#0C0B09',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '14px 16px',
                  opacity: easeOutCubic(cardProgress),
                  transform: `scale(${0.95 + 0.05 * cardProgress})`,
                }}>
                  <div style={{ fontFamily: FONT, fontSize: 10, color: C.dim, marginBottom: 4, letterSpacing: '0.06em', fontWeight: 500 }}>{label.toUpperCase()}</div>
                  <div style={{ fontFamily: MONO, fontSize: 22, color: C.text, fontWeight: 500 }}>
                    {cardProgress > 0 ? animatedCount(elapsed, 23 + delay, 1.5, value) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Smart Alert */}
        {alertProgress > 0 && (
          <div style={{
            background: '#0C0B09',
            border: `1px solid rgba(212,160,58,0.2)`,
            borderRadius: 10, padding: '14px 18px',
            opacity: easeOutCubic(alertProgress),
            transform: `translateX(${30 * (1 - alertProgress)}px)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 10, color: C.gold, marginBottom: 4, fontWeight: 600, letterSpacing: '0.06em' }}>SMART ALERT</div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: C.text }}>Blue Dream 3.5g — OOS at Logan Square. 38 units available in vault.</div>
            </div>
            <div style={{
              background: buttonPulse ? C.gold : 'rgba(212,160,58,0.15)',
              color: buttonPulse ? '#030303' : C.gold,
              fontFamily: FONT, fontSize: 11, fontWeight: 600,
              padding: '8px 16px', borderRadius: 6,
              whiteSpace: 'nowrap',
              boxShadow: buttonPulse ? `0 0 20px rgba(212,160,58,0.3)` : 'none',
              transition: 'all 0.4s ease',
            }}>Transfer 38</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Action Card: Transfer (30-34s)
function TransferAction({ elapsed }) {
  if (elapsed < 30 || elapsed > 34.5) return null;
  const fade = fadeInOut(elapsed, 30, 0.6, 34, 0.5);
  const btnProgress = clamp01((elapsed - 31.5) / 0.3);
  const isDone = elapsed > 32;
  const metrcFade = clamp01((elapsed - 32.5) / 0.4);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fade,
    }}>
      <div style={{
        width: 420, background: '#0C0B09',
        border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '28px 32px',
      }}>
        <div style={{ fontFamily: FONT, fontSize: 10, color: C.gold, fontWeight: 600, marginBottom: 12, letterSpacing: '0.08em' }}>SMART ALERT</div>
        <div style={{ fontFamily: FONT, fontSize: 16, color: C.text, marginBottom: 20 }}>
          Blue Dream 3.5g — <span style={{ color: '#E87068' }}>OOS</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: isDone ? C.green : 'rgba(212,160,58,0.15)',
          color: isDone ? '#fff' : C.gold,
          fontFamily: FONT, fontSize: 13, fontWeight: 600,
          padding: '10px 20px', borderRadius: 8,
          opacity: btnProgress,
          transition: 'background 0.4s ease, color 0.4s ease',
        }}>
          {isDone ? 'Done \u2713' : 'Transfer from vault'}
        </div>
        {metrcFade > 0 && (
          <div style={{
            marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: FONT, fontSize: 11, color: C.green,
            opacity: metrcFade,
            transform: `translateX(${10 * (1 - metrcFade)}px)`,
          }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green }} />
            METRC updated
          </div>
        )}
      </div>
      <div style={{
        position: 'absolute', bottom: '15%', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: FONT, fontSize: 14, color: C.dim, fontWeight: 400,
        opacity: fade,
      }}>Stockouts resolved in seconds.</div>
    </div>
  );
}

// Action Card: Purchase Order (34-38s)
function PurchaseOrderAction({ elapsed }) {
  if (elapsed < 34 || elapsed > 38.5) return null;
  const fade = fadeInOut(elapsed, 34, 0.6, 38, 0.5);
  const line1 = clamp01((elapsed - 34.8) / 0.3);
  const line2 = clamp01((elapsed - 35.1) / 0.3);
  const line3 = clamp01((elapsed - 35.4) / 0.3);
  const bfdFade = clamp01((elapsed - 36) / 0.3);
  const totalFade = clamp01((elapsed - 36.5) / 0.4);
  const submitFade = clamp01((elapsed - 37) / 0.4);

  const lineItems = [
    { sku: 'Blue Dream 3.5g', qty: '120 units', price: '$420' },
    { sku: 'Wedding Cake 1g', qty: '80 units', price: '$320' },
    { sku: 'Lemon Haze Cart', qty: '60 units', price: '$335' },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fade,
    }}>
      <div style={{
        width: 440, background: '#0C0B09',
        border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '28px 32px',
      }}>
        <div style={{ fontFamily: FONT, fontSize: 10, color: C.dim, fontWeight: 600, marginBottom: 6, letterSpacing: '0.08em' }}>PURCHASE ORDER</div>
        <div style={{ fontFamily: FONT, fontSize: 15, color: C.text, marginBottom: 16 }}>
          PO-2026-0847 &rarr; Jeeter &rarr; Logan Square
        </div>

        {lineItems.map((item, i) => {
          const opacity = [line1, line2, line3][i];
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0',
              borderBottom: i < 2 ? `1px solid ${C.border}` : 'none',
              fontFamily: FONT, fontSize: 12, color: C.text,
              opacity,
            }}>
              <span>{item.sku}</span>
              <span style={{ color: C.dim }}>{item.qty}</span>
              <span style={{ fontFamily: MONO, fontWeight: 500 }}>{item.price}</span>
            </div>
          );
        })}

        {bfdFade > 0 && (
          <div style={{
            display: 'inline-block', marginTop: 12,
            background: 'rgba(212,160,58,0.12)', border: `1px solid rgba(212,160,58,0.25)`,
            borderRadius: 6, padding: '4px 10px',
            fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.gold,
            opacity: bfdFade,
          }}>BFD 20% off</div>
        )}

        {totalFade > 0 && (
          <div style={{
            marginTop: 12, textAlign: 'right',
            fontFamily: MONO, fontSize: 20, fontWeight: 600, color: C.text,
            opacity: totalFade,
          }}>$1,075</div>
        )}

        {submitFade > 0 && (
          <div style={{
            marginTop: 12,
            fontFamily: FONT, fontSize: 12, color: C.green,
            opacity: submitFade,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green }} />
            Submitted via Dutchie Connect &check;
          </div>
        )}
      </div>
      <div style={{
        position: 'absolute', bottom: '15%', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: FONT, fontSize: 14, color: C.dim, fontWeight: 400,
        opacity: fade,
      }}>Purchase orders, automated.</div>
    </div>
  );
}

// Action Card: Campaign (38-42s)
function CampaignAction({ elapsed }) {
  if (elapsed < 38 || elapsed > 42.5) return null;
  const fade = fadeInOut(elapsed, 38, 0.6, 42, 0.5);
  const headerFade = clamp01((elapsed - 38.3) / 0.3);
  const ch1 = clamp01((elapsed - 39) / 0.3);
  const ch2 = clamp01((elapsed - 39.5) / 0.3);
  const ch3 = clamp01((elapsed - 40) / 0.3);
  const segmentFade = clamp01((elapsed - 40.5) / 0.4);
  const doneFade = clamp01((elapsed - 41) / 0.4);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fade,
    }}>
      <div style={{
        width: 420, background: '#0C0B09',
        border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '28px 32px',
      }}>
        <div style={{ fontFamily: FONT, fontSize: 10, color: C.dim, fontWeight: 600, marginBottom: 6, letterSpacing: '0.08em' }}>CAMPAIGN</div>
        <div style={{
          fontFamily: FONT, fontSize: 16, color: C.text, marginBottom: 16,
          opacity: headerFade,
        }}>Win-Back Campaign</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['Email', 'SMS', 'Push'].map((ch, i) => {
            const opacity = [ch1, ch2, ch3][i];
            return (
              <div key={ch} style={{
                background: 'rgba(100,168,224,0.1)',
                border: '1px solid rgba(100,168,224,0.2)',
                borderRadius: 6, padding: '5px 12px',
                fontFamily: FONT, fontSize: 11, fontWeight: 500,
                color: '#64A8E0',
                opacity,
                transform: `translateY(${6 * (1 - opacity)}px)`,
              }}>{ch}</div>
            );
          })}
        </div>

        {segmentFade > 0 && (
          <div style={{
            background: 'rgba(181,152,232,0.1)',
            border: '1px solid rgba(181,152,232,0.2)',
            borderRadius: 6, padding: '5px 12px',
            fontFamily: FONT, fontSize: 11, fontWeight: 500,
            color: '#B598E8',
            opacity: segmentFade,
            display: 'inline-block', marginBottom: 16,
          }}>1,247 at-risk customers</div>
        )}

        {doneFade > 0 && (
          <div style={{
            fontFamily: FONT, fontSize: 12, color: C.green,
            opacity: doneFade,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green }} />
            Campaign Package Created &check;
          </div>
        )}
      </div>
      <div style={{
        position: 'absolute', bottom: '15%', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: FONT, fontSize: 14, color: C.dim, fontWeight: 400,
        opacity: fade,
      }}>Marketing that runs itself.</div>
    </div>
  );
}

// Act 5: The Scale (42-50s)
function ScaleSection({ elapsed }) {
  if (elapsed < 42 || elapsed > 50.5) return null;
  const fade = fadeInOut(elapsed, 42, 0.8, 50, 0.5);
  const numberFade = fadeIn(elapsed, 42.5, 0.8);
  const word1 = fadeIn(elapsed, 44.5, 0.5);
  const word2 = fadeIn(elapsed, 45, 0.5);
  const word3 = fadeIn(elapsed, 45.5, 0.5);
  // Gold line: 46-48s
  const lineProgress = clamp01((elapsed - 46) / 2);
  const descFade = fadeIn(elapsed, 48, 0.6);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: fade,
    }}>
      <div style={{
        fontFamily: FONT, fontSize: 120, fontWeight: 200,
        color: C.text, letterSpacing: '-0.02em',
        opacity: numberFade,
        textShadow: '0 0 60px rgba(212,160,58,0.15)',
      }}>$100B+</div>

      <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
        {['Benchmark.', 'Predict.', 'Optimize.'].map((w, i) => {
          const opacity = [word1, word2, word3][i];
          return (
            <span key={w} style={{
              fontFamily: FONT, fontSize: 18, fontWeight: 400,
              color: C.text, opacity,
              letterSpacing: '0.02em',
            }}>{w}</span>
          );
        })}
      </div>

      {/* Gold line */}
      <div style={{
        width: '60%', maxWidth: 600,
        height: 1, marginTop: 32,
        background: `linear-gradient(90deg, ${C.gold}, rgba(212,160,58,0.3))`,
        transformOrigin: 'left',
        transform: `scaleX(${lineProgress})`,
      }} />

      {descFade > 0 && (
        <div style={{
          marginTop: 24,
          fontFamily: FONT, fontSize: 15, fontWeight: 400,
          color: C.dim, opacity: descFade,
          textAlign: 'center', maxWidth: 460,
          lineHeight: 1.5,
        }}>The largest cannabis transaction dataset. Working for you.</div>
      )}
    </div>
  );
}

// Act 6: The Close (50-60s)
function CloseSection({ elapsed }) {
  if (elapsed < 50) return null;
  // 50-51: everything prior fading out (handled by each component)
  // 51-53: black
  // 53-54: icon fades in
  const iconFade = fadeIn(elapsed, 53, 1);
  const textFade = fadeIn(elapsed, 54, 0.6);
  const subtextFade = fadeIn(elapsed, 54.5, 0.6);
  const byFade = fadeIn(elapsed, 55, 0.4);
  const exploreFade = fadeIn(elapsed, 57, 1);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: 1,
    }}>
      {iconFade > 0 && (
        <div style={{
          opacity: iconFade,
          filter: `drop-shadow(0 0 20px rgba(212,160,58,0.4))`,
          marginBottom: 20,
        }}>
          <NexusIcon size={80} />
        </div>
      )}

      {textFade > 0 && (
        <div style={{
          fontFamily: FONT, fontSize: 48, fontWeight: 200,
          color: C.text, letterSpacing: '0.06em',
          opacity: textFade,
        }}>nexus</div>
      )}

      {subtextFade > 0 && (
        <div style={{
          fontFamily: FONT, fontSize: 16, fontWeight: 400,
          color: C.dim, opacity: subtextFade,
          marginTop: 12,
        }}>Intelligence for cannabis operations.</div>
      )}

      {byFade > 0 && (
        <div style={{
          fontFamily: FONT, fontSize: 12, fontWeight: 400,
          color: C.muted, opacity: byFade,
          marginTop: 8,
        }}>by Dutchie</div>
      )}

      {exploreFade > 0 && (
        <a href="#/" style={{
          fontFamily: FONT, fontSize: 13, fontWeight: 500,
          color: C.gold, opacity: exploreFade,
          marginTop: 32, textDecoration: 'none',
          letterSpacing: '0.02em',
        }}>Explore &rarr;</a>
      )}
    </div>
  );
}

// Bottom caption (for Act 1 and Act 3)
function BottomCaption({ elapsed }) {
  // "This is how you operate today." (7-11s)
  const chaos = fadeInOut(elapsed, 7, 0.8, 11, 0.8);
  // "Your entire portfolio. One screen." (22-29s)
  const dashboard = fadeInOut(elapsed, 22, 0.8, 29, 0.8);

  const text = chaos > dashboard ? 'This is how you operate today.' : 'Your entire portfolio. One screen.';
  const opacity = Math.max(chaos, dashboard);
  if (opacity <= 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 48, left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: FONT, fontSize: 14, fontWeight: 400,
      color: C.dim, opacity,
      whiteSpace: 'nowrap',
    }}>{text}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ elapsed }) {
  const progress = (elapsed / TOTAL_DURATION) * 100;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 2, background: 'rgba(255,255,255,0.05)',
      zIndex: 100,
    }}>
      <div style={{
        height: '100%', width: `${progress}%`,
        background: `linear-gradient(90deg, ${C.gold}, rgba(212,160,58,0.6))`,
        transition: 'width 0.1s linear',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mute Button
// ─────────────────────────────────────────────────────────────────────────────
function MuteButton({ muted, onToggle }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{
        position: 'absolute', bottom: 16, left: 16,
        zIndex: 200,
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: muted ? C.dim : C.text,
        transition: 'all 0.2s ease',
      }}
      title={muted ? 'Unmute (M)' : 'Mute (M)'}
    >
      {muted ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Play Button (Start Screen)
// ─────────────────────────────────────────────────────────────────────────────
function PlayButton({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 300,
      }}
    >
      {/* Play circle */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        border: `2px solid rgba(212,160,58,0.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(212,160,58,0.05)',
        transition: 'all 0.3s ease',
        boxShadow: '0 0 40px rgba(212,160,58,0.1)',
      }}>
        <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
          <path d="M4 2L26 16L4 30V2Z" fill={C.gold} fillOpacity="0.8" />
        </svg>
      </div>
      <div style={{
        marginTop: 20,
        fontFamily: FONT, fontSize: 13, fontWeight: 400,
        color: C.dim, letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>Play Film</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pause overlay
// ─────────────────────────────────────────────────────────────────────────────
function PauseOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', top: 20, right: 20,
      zIndex: 150,
      fontFamily: FONT, fontSize: 11, fontWeight: 500,
      color: 'rgba(240,237,232,0.3)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>Paused</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Background with vignette
// ─────────────────────────────────────────────────────────────────────────────
function Background({ elapsed }) {
  // Warm up slightly during convergence (12-18s)
  const warmth = clamp01((elapsed - 12) / 3) * clamp01(1 - (elapsed - 50) / 2);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: warmth > 0
        ? `radial-gradient(ellipse at center, ${C.warmBg} 0%, ${C.bg} 70%)`
        : C.bg,
      opacity: 1 - warmth * 0 + warmth * 1, // always 1, but we use CSS for blending
    }}>
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function NexusVideoV2() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastActRef = useRef(-1);

  const elapsed = useAnimationClock(playing);

  // Audio cue triggers based on elapsed time
  useEffect(() => {
    if (!playing || !audioRef.current) return;
    const a = audioRef.current;
    const t = elapsed;

    // Act transitions — fire once per act
    const act = t < 5 ? 0 : t < 12 ? 1 : t < 18 ? 2 : t < 30 ? 3 : t < 42 ? 4 : t < 50 ? 5 : 6;
    if (act !== lastActRef.current) {
      lastActRef.current = act;
      switch (act) {
        case 0: a.fadeIn(); break;
        case 1: a.startChaos(); break;
        case 2: a.startConvergence(); break;
        case 3: a.startDashboard(); break;
        case 4: a.startActions(); break;
        case 5: a.startSwell(); break;
        case 6: a.startClose(); break;
      }
    }

    // Dashboard ticks (18-30s) — tick on specific element appearances
    const tickTimes = [19.5, 20, 20.5, 21, 21.5, 23.2, 23.6, 24, 26.5, 28];
    tickTimes.forEach(tt => {
      if (t >= tt && t < tt + 0.05) a.tick(0.02);
    });

    // Success ticks during actions
    const successTimes = [32, 37, 41];
    successTimes.forEach(st => {
      if (t >= st && t < st + 0.05) a.successTick();
    });

    // Gold line sweep at 46s
    if (t >= 46 && t < 46.05) a.startSweep();

  }, [elapsed, playing]);

  const handleStart = useCallback(() => {
    // Create audio context on user gesture
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    audioRef.current = createCinematicAudio(ctx);
    setStarted(true);
    setPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (!started) return;
    setPlaying(p => !p);
  }, [started]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    setMuted(m => {
      if (m) audioRef.current.unmute();
      else audioRef.current.mute();
      return !m;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'm' || e.key === 'M') toggleMute();
      if (e.key === 'Escape') {
        if (started) {
          setPlaying(false);
          // Navigate back
          window.location.hash = '/';
        }
      }
      if (e.key === ' ' && started) {
        e.preventDefault();
        togglePlay();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, togglePlay, toggleMute]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try { audioRef.current.stop(); } catch (_) {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
      }
    };
  }, []);

  return (
    <div
      onClick={started ? togglePlay : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: C.bg,
        overflow: 'hidden',
        cursor: started ? 'pointer' : 'default',
        userSelect: 'none',
        fontFamily: FONT,
      }}
    >
      <Background elapsed={elapsed} />

      {!started && <PlayButton onClick={handleStart} />}

      {started && (
        <>
          {/* Act 0: Opening dot */}
          {elapsed < 6 && <BreathingDot elapsed={elapsed} />}

          {/* Act 1-2: Chaos dots & convergence */}
          <ChaosDots elapsed={elapsed} />

          {/* Act 2: Converged icon */}
          <ConvergedIcon elapsed={elapsed} />

          {/* Act 3: Dashboard build */}
          <DashboardBuild elapsed={elapsed} />

          {/* Act 4a: Transfer */}
          <TransferAction elapsed={elapsed} />

          {/* Act 4b: Purchase Order */}
          <PurchaseOrderAction elapsed={elapsed} />

          {/* Act 4c: Campaign */}
          <CampaignAction elapsed={elapsed} />

          {/* Act 5: Scale */}
          <ScaleSection elapsed={elapsed} />

          {/* Act 6: Close */}
          <CloseSection elapsed={elapsed} />

          {/* Bottom captions */}
          <BottomCaption elapsed={elapsed} />

          {/* Controls */}
          <ProgressBar elapsed={elapsed} />
          <MuteButton muted={muted} onToggle={toggleMute} />
          <PauseOverlay visible={!playing && elapsed > 0 && elapsed < TOTAL_DURATION} />
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden; }
      `}</style>
    </div>
  );
}
