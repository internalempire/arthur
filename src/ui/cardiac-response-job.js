// Cancel expensive obsolete work when a control changes; never apply a late
// response to another patient. The interface remains live while the worker runs.
export function createCardiacResponseJob(createWorker, onChange = () => {}, delay = 500) {
  let worker = null, timer = null, generation = 0;
  let state = { key: null, result: null, status: 'idle', message: '' };
  function reset() {
    generation++;
    clearTimeout(timer);
    worker?.terminate();
    worker = null;
    state = { key: null, result: null, status: 'idle', message: '' };
  }
  function request(key, params) {
    if (state.key === key) return;
    reset();
    const current = generation;
    state = { key, result: null, status: 'running', message: 'Calculating cardiac output curve…' };
    const prescription = structuredClone(params);
    timer = setTimeout(() => {
      try {
        worker = createWorker();
        const active = worker;
        const fail = message => {
          if (generation !== current) return;
          active.terminate();
          worker = null;
          state = { ...state, status: 'error', result: null, message };
          onChange();
        };
        worker.onerror = () => fail('Cardiac output curve unavailable. Recalculate to retry.');
        worker.onmessage = ({ data }) => {
          if (generation !== current) return;
          if (data.type === 'progress') {
            state.message = `Calculating cardiac output curve… ${data.completed}/${data.total}`;
          } else if (data.type === 'result') {
            active.terminate();
            worker = null;
            state = { ...state, result: data.result, status: 'ready',
              message: data.result.valid ? 'LV output · valid loading range' : 'No valid cardiac output curve for these conditions' };
          } else if (data.type === 'error') {
            fail('Cardiac output curve unavailable. Recalculate to retry.');
          }
          onChange();
        };
        worker.postMessage({ params: prescription });
      } catch {
        state = { ...state, status: 'error', message: 'Cardiac output calculation is unavailable in this browser' };
        onChange();
      }
    }, delay);
  }
  return { request, reset, getState: () => state };
}
