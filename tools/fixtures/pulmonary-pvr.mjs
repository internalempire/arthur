// Shared research prescription for the literature checks and manual examples.
// This is not the shipped ARDS/RV-failure preset and is not imported at runtime.
export const HUMAN_ARDS_PVR = Object.freeze({
  clung: 40, vt: 350, rr: 24, pvrBase: 0.09, hpv: 1.6,
  collapsed: 0.42, pOpen: 17.5, baroreflexEnabled: true,
});

export const PVR_REOPENABLE_SHARES = Object.freeze({
  low: 0.06188009182612101,
  high: 0.7497452596823374,
});
