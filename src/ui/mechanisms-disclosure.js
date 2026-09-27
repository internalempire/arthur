/** Optional view only: loading, DOM construction and updates require explicit opt-in. */
export function createMechanismsDisclosure(button, host, getContext,
  load = () => import('./mechanisms-panel.js')) {
  let open = false;
  let generation = 0;
  let panel = null;
  let pending = null;

  function close() {
    open = false;
    generation++;
    panel?.destroy();
    panel = null;
    host.replaceChildren();
    host.hidden = true;
    button.textContent = 'Mechanisms';
    button.setAttribute('aria-expanded', 'false');
  }
  function sync(context) {
    if (!context.reference) { if (open || !host.hidden) close(); button.disabled = true; return; }
    button.disabled = context.historical && !open;
    button.title = context.historical ? 'Return to the latest instant or press Play to compare' : 'Show the shared heart–lung pathways for this comparison';
    if (open && panel) panel.render(context);
  }
  async function toggle() {
    if (open) { close(); return; }
    const context = getContext();
    if (!context.reference || context.historical) return;
    open = true;
    const request = ++generation;
    host.hidden = false;
    host.textContent = 'Loading mechanisms…';
    button.textContent = 'Close mechanisms';
    button.setAttribute('aria-expanded', 'true');
    try {
      pending ??= load().catch(error => { pending = null; throw error; });
      const module = await pending;
      if (!open || request !== generation) return;
      const latest = getContext();
      if (!latest.reference) { close(); return; }
      panel = module.createMechanismsPanel(host);
      panel.render(latest);
    } catch {
      if (!open || request !== generation) return;
      panel?.destroy();
      panel = null;
      open = false;
      host.textContent = 'The mechanisms view could not be loaded. Press Mechanisms to retry.';
      button.textContent = 'Mechanisms';
      button.setAttribute('aria-expanded', 'false');
    }
  }
  button.addEventListener('click', toggle);
  return { sync, close };
}
