import { createRecording, HISTORY_BREATHS, pinOutput } from './manoeuvre-recording.js';

const signals = [
  { key:'peep', label:'Set PEEP', unit:'cmH₂O', color:'airway', digits:1, minSpan:5 },
  { key:'plMin', high:'plMax', label:'Transpulmonary pressure', unit:'min–max per breath · cmH₂O', color:'transpulmonary', digits:1, minSpan:5 },
  { key:'open', label:'Open lung fraction', unit:'end-expiration · % of model lung', color:'transpulmonary', digits:1, minSpan:10 },
  { key:'eelv', label:'Lung gas volume', unit:'end-expiration · L', color:'volume', digits:2, minSpan:0.5 },
  { key:'ppl', label:'Pleural pressure', unit:'breath mean · cmH₂O', color:'pleural', digits:1, minSpan:3 },
  { key:'co', label:'Aortic output', unit:'four-breath mean · L/min', color:'arterial', digits:2, minSpan:1 },
];
const number = (v, digits) => Number.isFinite(v) ? v.toFixed(digits) : '—';
const seconds = t => number(t, 1) + ' s';
const interval = w => w ? seconds(w.start) + '–' + seconds(w.end) + ' ('+(w.to.beats-w.from.beats)+' beat endings)' : 'awaiting four complete breaths';
const ns = 'http://www.w3.org/2000/svg';

function mark(svg, tag, attrs, value) {
  const node = document.createElementNS(ns, tag);
  for (const [key,v] of Object.entries(attrs)) node.setAttribute(key, v);
  if (value !== undefined) node.textContent = value;
  svg.append(node);
}

function graph(svg, signal, recording, windows, end, axis) {
  const width = Math.max(160, svg.clientWidth);
  const left = 42, right = width-10, top = 8, bottom = 39;
  svg.setAttribute('viewBox', '0 0 '+width+' '+(axis ? 60 : 48));
  svg.replaceChildren();
  const x = t => left + t / Math.max(1,end) * (right-left);
  const { rows, segments } = recording;
  const values = signal.key === 'peep' ? segments.map(s => s.peep) :
    rows.flatMap(row => row.valid ? [row[signal.key], row[signal.high]].filter(Number.isFinite) : []);
  const rawLow = values.length ? Math.min(...values) : 0;
  const rawHigh = values.length ? Math.max(...values) : signal.minSpan;
  const span = Math.max(signal.minSpan, rawHigh-rawLow);
  const step = 10 ** Math.floor(Math.log10(span / 2));
  let low = Math.floor((rawLow-span*0.08)/step)*step;
  let high = Math.ceil((Math.max(rawHigh,low+span)+span*0.08)/step)*step;
  if (signal.key === 'open') {
    high = Math.min(100,high);
    low = Math.max(0,Math.min(low,high-signal.minSpan));
  }
  const y = v => bottom - (v-low)/(high-low)*(bottom-top);
  for (const w of new Set(windows.filter(Boolean))) {
    mark(svg,'rect',{x:x(w.start),y:1,width:Math.max(1,x(w.end)-x(w.start)),height:42,fill:'var(--wash)'});
  }
  for (const v of [low,high]) {
    mark(svg,'line',{x1:left,x2:right,y1:y(v),y2:y(v),stroke:'var(--grid)'});
    mark(svg,'text',{x:left-5,y:y(v)+3,'text-anchor':'end'},Number(v.toFixed(2)));
  }
  for (const segment of segments.slice(1)) {
    mark(svg,'line',{x1:x(segment.start),x2:x(segment.start),y1:1,y2:43,stroke:'var(--axis)','stroke-dasharray':'2 3'});
  }
  const stroke = 'var(--'+signal.color+')';
  if (signal.key === 'peep') {
    const points = segments.flatMap((s,i) => [
      [x(s.start),y(s.peep)],[x(segments[i+1]?.start ?? end),y(s.peep)],
    ]);
    mark(svg,'polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke,'stroke-width':2});
  } else {
    let path = '', dots = '', previous = null;
    for (const row of rows) {
      const value = row[signal.key];
      if (!row.valid || !Number.isFinite(value)) { previous = null; continue; }
      const at = x(row.t), height = y(value);
      if (signal.high) path += 'M'+at+' '+height+'V'+y(row[signal.high]);
      else {
        path += (previous === row.segment ? 'L':'M')+at+' '+height;
        dots += 'M'+at+' '+height+'h0.1';
      }
      previous = row.segment;
    }
    mark(svg,'path',{d:path,fill:'none',stroke,'stroke-width':2});
    if (dots) mark(svg,'path',{d:dots,stroke,'stroke-width':3,'stroke-linecap':'round'});
  }
  if (axis) for (const f of [0,0.5,1]) {
    mark(svg,'text',{x:x(f*end),y:56,'text-anchor':f===0?'start':f===1?'end':'middle'},seconds(f*end));
  }
}

export function createHistoryPanel(host) {
  host.innerHTML = `<h2>Pressure history</h2>
    <p>Record this patient before changing a setting. Compare complete breaths during the manoeuvre and after returning to baseline.</p>
    <button type="button" class="btn history-record">Start recording</button>
    <span class="history-status" role="status"></span><progress class="history-progress" aria-label="Complete breaths in the current window" max="${HISTORY_BREATHS}" hidden></progress>
    <div class="history-body" hidden><div class="history-choices">
      <label>From <select aria-label="Reference recording interval"></select></label>
      <label>Compare with <select aria-label="Comparison recording interval"></select></label></div>
      <p class="history-windows"></p><div class="history-signals"></div>
      <p class="history-plateau"></p><p class="history-pin"></p>
      <small>Time since recording began. Shading marks the selected four-breath windows. The window may include parts of two beats. Dashed lines mark interventions. Gaps indicate interrupted, incomplete or invalid observations.</small></div>`;
  const find = selector => host.querySelector(selector);
  const button = find('button'), status = find('.history-status'), progress = find('progress');
  const [from,to] = host.querySelectorAll('select');
  const strips = signals.map(signal => {
    const row = document.createElement('div');
    row.className = 'history-signal';
    row.innerHTML = '<div><b></b><small></small><output></output></div>';
    row.querySelector('b').textContent = signal.label;
    row.querySelector('small').textContent = signal.unit;
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('role','img');
    row.append(svg);
    find('.history-signals').append(row);
    return { signal, svg, value: row.querySelector('output') };
  });
  let context, recording, optionsCount = 0, follow = true, lastKey = '', reference;
  button.onclick = () => {
    if (recording?.active) recording.stop();
    else {
      if (context.historical) return;
      reference = context.reference;
      recording = createRecording(context.current, reference);
      follow = true; optionsCount = 0; lastKey = '';
      from.replaceChildren(); to.replaceChildren();
    }
    render(context);
  };
  from.onchange = () => { lastKey = ''; render(context); };
  to.onchange = () => { follow = Number(to.value) === recording.segments.length-1; lastKey = ''; render(context); };
  function render(next) {
    context = next;
    if (reference && context.reference !== reference) {
      recording.releasePin('The original Pin is no longer selected.');
      reference = null;
    }
    const active = recording?.active;
    button.disabled = !active && context.historical;
    button.textContent = active ? 'Stop recording' : recording ? 'Start new recording' : 'Start recording';
    const body = find('.history-body');
    body.hidden = !recording;
    if (!recording) {
      status.textContent = context.historical ? 'Return to the latest instant to record.' : 'Ready';
      return;
    }
    const segments = recording.segments, last = segments.at(-1);
    const hold = context.current.hold;
    const waiting = active && last.count < HISTORY_BREATHS;
    progress.hidden = !waiting;
    progress.value = last.count;
    const progressText = waiting ? ` · ${last.count}/${HISTORY_BREATHS} complete breaths` : '';
    const state = !active ? recording.reason : !context.running ? 'Paused · press Play to continue'
      : hold ? 'Waiting for the occlusion to end' : 'Recording';
    const message = state + progressText;
    if (status.textContent !== message) status.textContent = message;
    status.classList.toggle('working', Boolean(active && context.running && !hold));
    while (optionsCount < segments.length) {
      const s = segments[optionsCount];
      const label = seconds(s.start)+' · '+s.label;
      from.add(new Option(label, optionsCount)); to.add(new Option(label, optionsCount));
      optionsCount++;
      if (follow) to.value = String(optionsCount-1);
    }
    const a = segments[Number(from.value)].window, b = segments[Number(to.value)].window;
    const key = [recording.version, from.value, to.value, host.clientWidth, pinOutput(b)].join('/');
    if (key === lastKey) return;
    lastKey = key;
    const end = Math.max(1, recording.getElapsed());
    const sinceStep = b ? ' · ends '+seconds(b.end-segments[Number(to.value)].start)+' after interval began' : '';
    find('.history-windows').textContent = 'From: '+interval(a)+'   →   Compare: '+interval(b)+sinceStep;
    for (const [i,{ signal, svg, value }] of strips.entries()) {
      const reading = w => !w ? '—' : signal.high
        ? number(w[signal.key],signal.digits)+'–'+number(w[signal.high],signal.digits) : number(w[signal.key],signal.digits);
      value.textContent = reading(a)+' → '+reading(b);
      svg.setAttribute('aria-label',signal.label+' in '+signal.unit+' · '+value.textContent);
      graph(svg,signal,recording,[a,b],end,i===strips.length-1);
    }
    find('.history-plateau').textContent = 'Calculated passive plateau: '+number(a?.plateau,1)+' → '+number(b?.plateau,1)+' cmH₂O';
    find('.history-pin').textContent = recording.pinId
      ? 'State '+recording.pinId+' · mean aortic output over the same intervals: '+number(pinOutput(a),2)+' → '+number(pinOutput(b),2)+' L/min'+(recording.pinReason ? ' · '+recording.pinReason : '')
      : 'For a parallel reference, select a Pin before starting a recording.';
  }
  return { render, destroy() { recording?.stop(); } };
}
