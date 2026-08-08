// Minimal cartesian canvas plotting: device-pixel-ratio handling, linear scales,
// a recessive grid, and the mark specs the panels share. No dependencies.

export class Panel {
  constructor(canvas, { padding = [12, 14, 26, 44] } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.padding = padding; // top, right, bottom, left, in CSS pixels
    this.dpr = 1;
    this.w = 0;
    this.h = 0;
    this.domain = { x0: 0, x1: 1, y0: 0, y1: 1 };
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // Belt and braces against the layout feedback loop the CSS also guards
    // against: whatever happens, never allocate a backing store larger than a
    // screen's worth of pixels.
    const cap = 4096 / dpr;
    const w = Math.max(1, Math.min(cap, Math.round(rect.width)));
    const h = Math.max(1, Math.min(cap, Math.round(rect.height)));
    if (w === this.w && h === this.h && dpr === this.dpr) return false;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    return true;
  }

  get plotArea() {
    const [t, r, b, l] = this.padding;
    return { x: l, y: t, w: Math.max(1, this.w - l - r), h: Math.max(1, this.h - t - b) };
  }

  begin() {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.font = '11px system-ui, -apple-system, "Segoe UI", sans-serif';
    return ctx;
  }

  setDomain(x0, x1, y0, y1) { this.domain = { x0, x1, y0, y1 }; }

  sx(v) {
    const a = this.plotArea, d = this.domain;
    return a.x + ((v - d.x0) / (d.x1 - d.x0 || 1)) * a.w;
  }

  sy(v) {
    const a = this.plotArea, d = this.domain;
    return a.y + a.h - ((v - d.y0) / (d.y1 - d.y0 || 1)) * a.h;
  }

  clip() {
    const a = this.plotArea;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(a.x, a.y, a.w, a.h);
    this.ctx.clip();
  }

  unclip() { this.ctx.restore(); }

  /** Recessive grid plus axis labels. `ticks` are arrays of domain values. */
  grid(colors, { xTicks = [], yTicks = [], xFormat, yFormat, yLabel, xLabel } = {}) {
    const { ctx } = this, a = this.plotArea;
    ctx.save();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.inkMuted;
    ctx.font = '10px system-ui, -apple-system, "Segoe UI", sans-serif';

    for (const t of yTicks) {
      const y = Math.round(this.sy(t)) + 0.5;
      if (y < a.y - 1 || y > a.y + a.h + 1) continue;
      ctx.beginPath(); ctx.moveTo(a.x, y); ctx.lineTo(a.x + a.w, y); ctx.stroke();
      if (yFormat) {
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(yFormat(t), a.x - 6, y);
      }
    }
    for (const t of xTicks) {
      const x = Math.round(this.sx(t)) + 0.5;
      if (x < a.x - 1 || x > a.x + a.w + 1) continue;
      ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h); ctx.stroke();
      if (xFormat) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(xFormat(t), x, a.y + a.h + 5);
      }
    }
    if (yLabel) {
      ctx.save();
      ctx.translate(10, a.y + a.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = colors.inkMuted;
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }
    if (xLabel) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = colors.inkMuted;
      ctx.fillText(xLabel, a.x + a.w / 2, this.h - 1);
    }
    ctx.restore();
  }

  axisLine(colors, { x = null, y = null } = {}) {
    const { ctx } = this, a = this.plotArea;
    ctx.save();
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (y !== null) { const yy = Math.round(this.sy(y)) + 0.5; ctx.moveTo(a.x, yy); ctx.lineTo(a.x + a.w, yy); }
    if (x !== null) { const xx = Math.round(this.sx(x)) + 0.5; ctx.moveTo(xx, a.y); ctx.lineTo(xx, a.y + a.h); }
    ctx.stroke();
    ctx.restore();
  }

  /** `pts` is a flat [x0,y0,x1,y1,…] array in domain units. */
  line(pts, { color, width = 2, dash = null, alpha = 1, count = pts.length } = {}) {
    if (count < 4) return;
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(this.sx(pts[0]), this.sy(pts[1]));
    for (let i = 2; i < count; i += 2) ctx.lineTo(this.sx(pts[i]), this.sy(pts[i + 1]));
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Series where x is implied by index over the domain, for trace buffers.
   * Decimated to roughly two points per pixel — beyond that the extra segments
   * cost time and change nothing on screen. Each decimated column keeps both
   * its minimum and maximum so spikes survive.
   */
  series(data, n, x0, x1, { color, width = 1.75, alpha = 1 }) {
    if (n < 2) return;
    const { ctx } = this;
    const a = this.plotArea;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    const step = a.w / (n - 1);
    const bucket = Math.max(1, Math.floor(n / (a.w * 2)));
    if (bucket === 1) {
      ctx.moveTo(a.x, this.sy(data[0]));
      for (let i = 1; i < n; i++) ctx.lineTo(a.x + i * step, this.sy(data[i]));
    } else {
      let started = false;
      for (let i = 0; i < n; i += bucket) {
        let lo = data[i], hi = data[i];
        const end = Math.min(i + bucket, n);
        for (let k = i + 1; k < end; k++) {
          if (data[k] < lo) lo = data[k];
          if (data[k] > hi) hi = data[k];
        }
        const x = a.x + i * step;
        if (!started) { ctx.moveTo(x, this.sy(lo)); started = true; }
        ctx.lineTo(x, this.sy(lo));
        ctx.lineTo(x, this.sy(hi));
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  dot(x, y, { color, r = 4.5, ring = null }) {
    const { ctx } = this;
    ctx.save();
    if (ring) {
      ctx.beginPath();
      ctx.arc(this.sx(x), this.sy(y), r + 2, 0, Math.PI * 2);
      ctx.fillStyle = ring;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(this.sx(x), this.sy(y), r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  band(x0, x1, colors, alpha = 0.07) {
    const { ctx } = this, a = this.plotArea;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors.ink;
    ctx.fillRect(this.sx(x0), a.y, this.sx(x1) - this.sx(x0), a.h);
    ctx.restore();
  }

  /**
   * Direct label anchored to a point. Every series carries one — it is the
   * secondary encoding that keeps hue from being the only channel.
   */
  label(text, x, y, { color, align = 'left', baseline = 'middle', dx = 6, dy = 0, halo }) {
    const { ctx } = this;
    ctx.save();
    ctx.font = '600 11px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    const px = this.sx(x) + dx, py = this.sy(y) + dy;
    if (halo) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = halo;
      ctx.strokeText(text, px, py);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, px, py);
    ctx.restore();
  }

  title(text, colors, sub) {
    const { ctx } = this;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '600 12px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = colors.ink;
    ctx.fillText(text, 4, 2);
    if (sub) {
      const wText = ctx.measureText(text).width;
      ctx.font = '11px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillStyle = colors.inkMuted;
      ctx.fillText(sub, 4 + wText + 8, 3);
    }
    ctx.restore();
  }
}

export function niceTicks(lo, hi, target = 5) {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) {
    out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
  }
  return out;
}
