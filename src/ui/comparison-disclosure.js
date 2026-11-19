/** Optional view only: loading, DOM construction and updates require explicit opt-in. */
export function createComparisonDisclosure(button, host, getContext, { label, description, load, mount }) {
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
    button.textContent = label;
    button.setAttribute('aria-expanded', 'false');
  }
  function sync(context) {
    if (!context.reference) { if (open || !host.hidden) close(); button.disabled = true; return; }
    button.disabled = context.historical && !open;
    button.title = context.historical ? 'Return to the latest instant or press Play to compare' : description;
    if (open && panel) panel.render(context);
  }
  async function toggle() {
    if (open) { close(); return; }
    const context = getContext();
    if (!context.reference || context.historical) return;
    open = true;
    const request = ++generation;
    host.hidden = false;
    host.textContent = `Loading ${label.toLowerCase()}…`;
    button.textContent = `Close ${label.toLowerCase()}`;
    button.setAttribute('aria-expanded', 'true');
    try {
      pending ??= load().catch(error => { pending = null; throw error; });
      const module = await pending;
      if (!open || request !== generation) return;
      const latest = getContext();
      if (!latest.reference) { close(); return; }
      panel = mount(module, host);
      panel.render(latest);
    } catch {
      if (!open || request !== generation) return;
      panel?.destroy();
      panel = null;
      open = false;
      host.textContent = `Press ${label} to retry loading this view.`;
      button.textContent = label;
      button.setAttribute('aria-expanded', 'false');
    }
  }
  button.addEventListener('click', toggle);
  return { sync, close };
}
