// Respiratory physiology is conventionally expressed in cmH2O, circulatory
// physiology in mmHg. Both appear in the same equations here, so every
// cross-domain term goes through these two helpers rather than a bare literal.
export const CMH2O_PER_MMHG = 1.35951;

export const cmH2OtoMmHg = (p) => p / CMH2O_PER_MMHG;
export const mmHgToCmH2O = (p) => p * CMH2O_PER_MMHG;

// mmHg·s/mL -> dyn·s·cm^-5, the unit clinical monitors report SVR/PVR in.
export const RESISTANCE_TO_WOOD = 1000 / 60; // mmHg·s/mL -> mmHg·min/L (Wood units)
export const RESISTANCE_TO_DYN = 80000 / 60; // mmHg·s/mL -> dyn·s·cm^-5

export const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
