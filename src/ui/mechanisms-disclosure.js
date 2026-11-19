import { createComparisonDisclosure } from './comparison-disclosure.js';

export function createMechanismsDisclosure(button, host, getContext, load = () => import('./mechanisms-panel.js')) {
  return createComparisonDisclosure(button, host, getContext, {
    label: 'Mechanisms', description: 'Show the shared heart–lung pathways for this comparison',
    load, mount: (module, element) => module.createMechanismsPanel(element),
  });
}
