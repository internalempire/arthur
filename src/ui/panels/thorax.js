import { cmH2OtoMmHg, clamp } from '../../model/index.js';

// A schematic of the pressure chamber within a pressure chamber. Everything
// drawn here is bound to a model variable: the thorax expands with lung volume,
// the ventricles scale with their volumes, the septum bows with the transmural
// pressure difference across it, and the inferior vena cava narrows as right
// atrial pressure approaches the pressure surrounding it.

export function createThorax(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    const cap = 4096 / d;
    const nw = Math.max(1, Math.min(cap, Math.round(rect.width)));
    const nh = Math.max(1, Math.min(cap, Math.round(rect.height)));
    if (nw === w && nh === h && d === dpr) return;
    w = nw; h = nh; dpr = d;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function render(sim, colors) {
    resize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const { params: p, resp: r, circ: c, metrics: m } = sim;
    const scale = Math.min(w / 340, h / 300);
    const cx = w / 2;
    const cy = h * 0.44;

    // ---- thorax -----------------------------------------------------------
    const inflation = clamp((r.lungVolume - r.relaxVolume) / 1.6, -0.2, 1.1);
    const halfW = (108 + inflation * 12) * scale;
    const halfH = (86 + inflation * 16) * scale;
    const diaphragmY = cy + halfH;

    // Pleural pressure as a wash: cool when subatmospheric, warm when positive.
    const pplNorm = clamp(r.ppl / 18, -1, 1);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, cx - halfW, cy - halfH, halfW * 2, halfH * 2, 26 * scale);
    ctx.fillStyle = pplNorm >= 0 ? colors.airway : colors.pleural;
    ctx.globalAlpha = 0.05 + Math.abs(pplNorm) * 0.13;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    roundRect(ctx, cx - halfW, cy - halfH, halfW * 2, halfH * 2, 26 * scale);
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // ---- lungs ------------------------------------------------------------
    const lungH = halfH * 0.86;
    const lungW = halfW * 0.42;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx + side * halfW * 0.55, cy - halfH * 0.08, lungW, lungH, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors.pleural;
      ctx.globalAlpha = 0.10 + inflation * 0.10;
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = colors.pleural;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // ---- airway -----------------------------------------------------------
    ctx.save();
    ctx.strokeStyle = colors.airway;
    ctx.lineWidth = 4 * scale;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy - halfH - 22 * scale);
    ctx.lineTo(cx, cy - halfH * 0.72);
    ctx.stroke();
    ctx.restore();
    text(ctx, colors, `Paw ${r.paw.toFixed(1)}`, cx, cy - halfH - 28 * scale, {
      align: 'center', baseline: 'bottom', color: colors.airway, weight: 600,
    });

    // ---- heart ------------------------------------------------------------
    const totalV = c.vRv + c.vLv;
    const R = Math.cbrt(totalV / 250) * 42 * scale;
    const rvFrac = clamp(c.vRv / totalV, 0.18, 0.82);

    // The septum carries two things at once, and they have to stay independent:
    // where it sits divides the disc by volume, and how it curves shows the
    // end-diastolic transmural pressure across it. Solve for the position that
    // keeps the areas honest given the curvature.
    const bulgeFrac = 0.30 * Math.tanh((c.septalShift ?? 0) / 12);
    const bulge = R * bulgeFrac;
    const sepX = cx + R * chordForAreaFraction(rvFrac, bulgeFrac);
    const ctrlX = sepX + 2 * bulge; // a quadratic reaches half way to its control

    // The septum spans the full height of the disc, so it meets the free wall at
    // the poles instead of being cut off part way along its own curve.
    const top = cy - R;
    const bottom = cy + R;
    const septum = (path) => {
      path.moveTo(sepX, top);
      path.quadraticCurveTo(ctrlX, cy, sepX, bottom);
    };

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // The chambers are translucent, so without an opaque backing the lung
    // ellipses behind them show through and tint one ventricle and not the
    // other — the lung edge visibly crosses the heart, and the two halves stop
    // being comparable by eye.
    ctx.fillStyle = colors.surface;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    for (const side of [
      { sign: -1, color: colors.venous },
      { sign: 1, color: colors.arterial },
    ]) {
      const edge = cx + side.sign * R * 1.2;
      ctx.beginPath();
      ctx.moveTo(edge, cy - R * 1.2);
      ctx.lineTo(sepX, cy - R * 1.2);
      ctx.lineTo(sepX, top);
      ctx.quadraticCurveTo(ctrlX, cy, sepX, bottom);
      ctx.lineTo(sepX, cy + R * 1.2);
      ctx.lineTo(edge, cy + R * 1.2);
      ctx.closePath();
      ctx.fillStyle = side.color;
      ctx.globalAlpha = 0.42;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.beginPath();
    septum(ctx);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    text(ctx, colors, 'RV', cx - R * 0.55, cy, { align: 'center', color: colors.venous, weight: 700 });
    text(ctx, colors, 'LV', cx + R * 0.55, cy, { align: 'center', color: colors.arterial, weight: 700 });

    // Pericardial constraint ring, visible only when it is doing something.
    if (c.p.pPeri > 0.3) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R + 5 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = colors.warning;
      ctx.globalAlpha = clamp(c.p.pPeri / 8, 0.25, 0.95);
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.restore();
    }

    // ---- diaphragm & abdomen ---------------------------------------------
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - halfW, diaphragmY);
    ctx.quadraticCurveTo(cx, diaphragmY + (14 - inflation * 16) * scale, cx + halfW, diaphragmY);
    ctx.strokeStyle = colors.inkSecondary;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // ---- inferior vena cava ----------------------------------------------
    // Caliber tracks the transmural pressure of the vein: right atrial pressure
    // minus the abdominal pressure surrounding it.
    const ivcTm = c.p.ra - c.p.pCrit;
    const ivcW = clamp(4 + ivcTm * 2.4, 1.2, 20) * scale;
    const ivcTop = cy + R * 0.7;
    const ivcBottom = h - 26 * scale;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 6 * scale - ivcW / 2, ivcTop);
    ctx.lineTo(cx - 6 * scale - ivcW / 2, ivcBottom);
    ctx.lineTo(cx - 6 * scale + ivcW / 2, ivcBottom);
    ctx.lineTo(cx - 6 * scale + ivcW / 2, ivcTop);
    ctx.closePath();
    ctx.fillStyle = colors.venous;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = colors.venous;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    text(ctx, colors, 'IVC', cx - 6 * scale, ivcBottom + 4 * scale, {
      align: 'center', baseline: 'top', color: colors.venous,
    });

    // ---- annotations ------------------------------------------------------
    const pad = 10;
    const rows = [
      [`Ppl ${r.ppl.toFixed(1)} cmH₂O`, colors.pleural],
      [`Palv ${r.palv.toFixed(1)} cmH₂O`, colors.airway],
      [`Pab ${r.pab.toFixed(1)} cmH₂O`, colors.inkSecondary],
    ];
    rows.forEach(([t, col], i) => {
      text(ctx, colors, t, pad, pad + i * 15, { color: col, baseline: 'top', weight: 600 });
    });

    const right = [
      [`CVP ${m.cvp.toFixed(1)} mmHg`, colors.venous],
      [`transmural ${m.cvpTransmural.toFixed(1)}`, colors.inkMuted],
      [`RV/LV ${m.rvLvRatio.toFixed(2)}`, m.rvLvRatio > 1.4 ? colors.critical : colors.inkSecondary],
    ];
    right.forEach(([t, col], i) => {
      text(ctx, colors, t, w - pad, pad + i * 15, { color: col, align: 'right', baseline: 'top', weight: 600 });
    });
  }

  return { render };
}

const SLICES = 96;

/** Fraction of a unit disc lying left of a septum at chord offset `d`, bowed by
 *  `bulge` (both in units of the radius). */
function leftAreaFraction(d, bulge) {
  let area = 0;
  const dy = 2 / SLICES;
  for (let i = 0; i < SLICES; i++) {
    const t = (i + 0.5) / SLICES;
    const y = -1 + 2 * t;
    const half = Math.sqrt(Math.max(0, 1 - y * y));
    const x = d + 4 * bulge * t * (1 - t); // the septum's own parabola
    area += (Math.min(Math.max(x, -half), half) + half) * dy;
  }
  return area / Math.PI;
}

/**
 * Where to put the septum so that the ventricles get the share of the disc their
 * volumes call for, given the bow already applied to it.
 *
 * Neither half of this can be done in closed form and guessed at. Spacing the
 * chord evenly across the diameter fails because a disc is widest at its centre.
 * Compensating the bow by its mean displacement fails too: bowing moves area
 * across the whole height of the disc, whereas sliding the chord only moves area
 * where the disc is wide. Both errors push the drawn ratio away from one — so
 * the picture would disagree with the RV:LV number printed beside it, which is
 * exactly the bug this replaced. Bisect on the real integral instead.
 */
function chordForAreaFraction(frac, bulge) {
  let lo = -2, hi = 2;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (leftAreaFraction(mid, bulge) < frac) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, colors, str, x, y, { align = 'left', baseline = 'middle', color, weight = 400 } = {}) {
  ctx.save();
  ctx.font = `${weight} 11px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color ?? colors.ink;
  ctx.fillText(str, x, y);
  ctx.restore();
}
