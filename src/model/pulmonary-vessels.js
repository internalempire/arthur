// Three pressure-bearing vascular stores and a smooth collapsible middle outlet.
// Brower 1985 (Fig.5/Appendix) supports the topology, not these human coefficients.
// Howell/Permutt 1961 support opposing extra-alveolar expansion and alveolar
// compression. See manual/pulmonary-transit.md for protocols and limitations.
import { cmH2OtoMmHg, clamp } from './units.js';
import { pvrComponents } from './lung.js';
import { PARAM_BY_ID } from './parameters.js';

const REFERENCE_PVR = PARAM_BY_ID.get('pvrBase').default;

export const PULMONARY_VESSELS = Object.freeze({
  arterial: Object.freeze({ volume0: 50, compliance: 4.2 }),
  middle: Object.freeze({ volume0: 60, compliance: 8.4 }),
  venous: Object.freeze({ volume0: 60, compliance: 8.5 }),
  // Rounded from the horizontal displacement in Howell Fig.6 (~5.8 cmH2O
  // during a 30 cmH2O inflation). One excised canine lobe is not a human fit.
  extraTraction: 0.2,
  extraArterialFraction: 0.5,
  venousOutletResistance: 0.008,
  initialMiddleVolume: 160,
});

// Volume and pressure are inverse, monotone and C1 at zero transmural pressure.
// The exponential compressed branch approaches zero volume without crossing it.
// The lumped positive-pressure compliance remains constant: vascular stiffening,
// viscoelasticity and high-pressure distension of the resistive throat are absent.
export function vascularVolume(transmural, volume0, compliance) {
  return transmural >= 0 ? volume0 + compliance * transmural
    : volume0 * Math.exp(transmural * compliance / volume0);
}

export function vascularPressure(volume, volume0, compliance) {
  return volume >= volume0 ? (volume - volume0) / compliance
    : (volume0 / compliance) * Math.log(Math.max(volume, 1e-12) / volume0);
}

export function collapsedConductance(transmural, pressureScale) {
  return transmural >= 0 ? 1 : Math.exp(2 * transmural / pressureScale);
}

// Primitive of relative conductance. The fully open resistive element has its
// prescribed geometric resistance. Storage and the resistive throat are distinct
// lumped elements: positive-pressure storage distension does NOT dilute a lesion.
export function collapsedPrimitive(transmural, pressureScale) {
  return transmural >= 0 ? transmural
    : (pressureScale / 2) * Math.expm1(2 * transmural / pressureScale);
}

/** Mean relative conductance along a quasi-steady collapsible segment. */
export function meanCollapsedConductance(upstreamTm, downstreamTm, pressureScale) {
  if (upstreamTm >= 0 && downstreamTm >= 0) return 1;
  const high = Math.max(upstreamTm, downstreamTm);
  const low = Math.min(upstreamTm, downstreamTm);
  const difference = high - low;
  if (difference < 1e-8) return collapsedConductance((high + low) / 2, pressureScale);
  if (high <= 0) {
    // This form avoids subtracting two almost equal saturated primitives.
    return (pressureScale / (2 * difference)) * Math.exp(2 * high / pressureScale)
      * -Math.expm1(-2 * difference / pressureScale);
  }
  return (high - collapsedPrimitive(low, pressureScale)) / difference;
}

/** Signed flow; the same law applies in reverse. Equal pressures give zero. */
export function collapsiblePulmonaryFlow(upstream, downstream, external, resistance, pressureScale) {
  return ((upstream - downstream) / resistance)
    * meanCollapsedConductance(upstream - external, downstream - external, pressureScale);
}

/**
 * The volume-dependent reference bed has alveolar and extra-alveolar parts.
 * Excess prescribed resistance above the default, and HPV, are precapillary:
 * assigning them to veins would turn an arterial lesion into venous obstruction.
 * Loss of conducting beds remains in the reference geometry. This aggregate
 * mapping does not resolve individual occluded arteries or regional perfusion.
 */
export function pulmonaryResistancePartition(p, geometry) {
  const k = PULMONARY_VESSELS;
  const geometricResistance = clamp(geometry.total, 0.005, 5);
  const withoutHpv = 1 / (geometry.openFraction / geometry.openPath
    + geometry.closedFraction / geometry.closedPathWithoutHpv);
  const reference = Math.min(geometricResistance,
    withoutHpv * Math.min(1, REFERENCE_PVR / p.pvrBase));
  const extra = reference * geometry.extraAlveolarPath / geometry.openPath;
  const middleResistance = reference * geometry.alveolarPath / geometry.openPath;
  const precapillaryResistance = geometricResistance - reference;
  const arterialResistance = extra * k.extraArterialFraction + precapillaryResistance;
  const venousResistance = extra * (1 - k.extraArterialFraction) + k.venousOutletResistance;
  return {
    geometricResistance, arterialResistance, middleResistance, venousResistance,
    precapillaryResistance,
    extraResistanceTotal: arterialResistance + venousResistance - k.venousOutletResistance,
  };
}

/**
 * Read-only algebra used by the circulation integrator. No settling, delay,
 * optimisation or new clock runs here. All pressures are atmospheric mmHg.
 *
 * The existing open/closed-lung resistance prescription is an aggregate geometric
 * coefficient. Its alveolar/extra-alveolar partition is applied to the equivalent
 * bed, not resolved regional vessels; one Palv acts on the middle store. It cannot
 * resolve pressures within unaerated units or anatomical West-zone fractions.
 */
export function pulmonaryVascularState(p, c, resp) {
  const k = PULMONARY_VESSELS;
  const ppl = cmH2OtoMmHg(resp.ppl);
  const palv = cmH2OtoMmHg(resp.palv);
  const extraPressure = ppl - k.extraTraction * (palv - ppl);
  const pa = vascularPressure(c.vPa, k.arterial.volume0, k.arterial.compliance) + extraPressure;
  const middle = vascularPressure(c.vPt, k.middle.volume0, k.middle.compliance) + palv;
  const pv = vascularPressure(c.vPv, k.venous.volume0, k.venous.compliance) + extraPressure;
  const geometry = pvrComponents(p, resp.lungVolume, resp.plSolved, resp.openFraction);
  const { geometricResistance, arterialResistance, middleResistance, venousResistance }
    = pulmonaryResistancePartition(p, geometry);
  const scale = k.middle.volume0 / k.middle.compliance;
  const relativeConductance = meanCollapsedConductance(middle - palv, pv - palv, scale);
  const arterialFlow = (pa - middle) / arterialResistance;
  const middleFlow = ((middle - pv) / middleResistance) * relativeConductance;
  // A reporting floor only: it never supplies flow to a collapsed segment.
  const effectiveMiddleResistance = middleResistance / Math.max(relativeConductance, 1e-300);
  return {
    pa, middle, pv, extraPressure, geometricResistance,
    arterialResistance, middleResistance, venousResistance,
    effectiveMiddleResistance,
    effectiveResistance: arterialResistance + effectiveMiddleResistance + venousResistance,
    arterialFlow, middleFlow,
    downstreamTransmural: pv - palv,
  };
}
