import { cardiacResponseCurve } from './cardiac-response.js';

self.onmessage = ({ data }) => {
  try {
    const result = cardiacResponseCurve(data.params, {
      onProgress: progress => self.postMessage({ type: 'progress', ...progress }),
    });
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
