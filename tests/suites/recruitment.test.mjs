// Recruitment mechanics, hysteresis, stress index and body-position effects.
import {
  SCENARIOS, defaultParams,
  transpulmonaryAt, relaxationVolume, openFractionAt,
  lungVolumeAtPl, lungComplianceAt, openBand,
  section, check, near, settled,
} from '../support/model.mjs';

section('Recruitment changes the mechanics');
{
  const p = defaultParams();
  const recruitable = { ...p, collapsed: 0.42, clung: 40, riRatio: 0.7, pOpen: 18 };
  const consolidated = { ...recruitable, riRatio: 0 };

  // The pressure–volume curve has to be a curve, and the signature is a slope
  // that *recovers*: stiffest where the baby lung is being stretched alone, less
  // stiff once pressure has opened more of it.
  //
  // Both ends are inside the clinical range on purpose. Below a transpulmonary
  // pressure of about 6 every lung in this model is still reopening its normal
  // units, so a window that reaches down there measures that transition instead
  // of the one being asked about.
  const slopeAt = (q, pl) => (lungVolumeAtPl(q, pl + 2) - lungVolumeAtPl(q, pl - 2)) / 4;
  const curvature = (q) => slopeAt(q, 22) / slopeAt(q, 8);
  // This used to assert that a normal lung is nearly straight, which it was only
  // because the tissue had no ceiling. It stiffens as it fills now, so what
  // separates the phenotypes is the *direction*: a normal lung only ever gets
  // stiffer, a recruitable one gets softer first.
  check('a normal lung only ever gets stiffer as it fills',
    curvature(p) < 1,
    `slope ${(slopeAt(p, 8) * 1000).toFixed(0)} -> ${(slopeAt(p, 22) * 1000).toFixed(0)} mL/cmH₂O`);
  // The gain is smaller than it was, because the tissue ceiling now works against
  // the recruitment: opening units adds compliance while stretching them removes
  // it. What survives is the sign, and the sign is what tells the phenotypes
  // apart.
  check('a recruitable lung gets less stiff as pressure opens it',
    curvature(recruitable) > 1.05,
    `slope ${(slopeAt(recruitable, 8) * 1000).toFixed(0)} -> ${(slopeAt(recruitable, 22) * 1000).toFixed(0)} mL/cmH₂O`);
  check('a consolidated one only gets stiffer',
    curvature(consolidated) < 1,
    `slope ${(slopeAt(consolidated, 8) * 1000).toFixed(0)} -> ${(slopeAt(consolidated, 22) * 1000).toFixed(0)} mL/cmH₂O`);

  // The two headline consequences the linear version could not produce.
  const restLow = relaxationVolume(recruitable);
  check('pressure raises the resting volume of a recruitable lung',
    lungVolumeAtPl(recruitable, 20) - lungVolumeAtPl(recruitable, 20 - 1e-9) >= 0
      && lungVolumeAtPl(recruitable, 18) / lungVolumeAtPl(consolidated, 18) > 1.15,
    `at Pl 18: ${lungVolumeAtPl(consolidated, 18).toFixed(2)} consolidated vs `
    + `${lungVolumeAtPl(recruitable, 18).toFixed(2)} recruitable L`);

  const cLow = lungComplianceAt(recruitable, lungVolumeAtPl(recruitable, 8));
  const cHigh = lungComplianceAt(recruitable, lungVolumeAtPl(recruitable, 18));
  const kLow = lungComplianceAt(consolidated, lungVolumeAtPl(consolidated, 8));
  const kHigh = lungComplianceAt(consolidated, lungVolumeAtPl(consolidated, 18));
  // The consolidated lung used to be flat here. It falls now, because the tissue
  // has a ceiling and pressure alone walks it up its own curve. What separates
  // the two is still the sign: opening units buys compliance, and nothing else
  // in this model does.
  check('pressure raises the recruitable lung\'s compliance and lowers the consolidated one\'s',
    cHigh > cLow * 1.15 && kHigh < kLow,
    `recruitable ${cLow.toFixed(0)} -> ${cHigh.toFixed(0)}, `
    + `consolidated ${kLow.toFixed(0)} -> ${kHigh.toFixed(0)} mL/cmH₂O`);

  // Measured compliance is the open fraction times the tissue value times how far
  // up its own curve the tissue has been pushed. The first factor is the baby
  // lung as something a ventilator prints; the second is why two lungs with the
  // same amount open still read differently.
  {
    const at = (pl) => {
      const v = lungVolumeAtPl(consolidated, pl);
      return {
        measured: lungComplianceAt(consolidated, v),
        open: openFractionAt(consolidated, transpulmonaryAt(consolidated, v)),
      };
    };
    // Only where nothing is still opening. Lower down, units reopening add volume
    // of their own and measured compliance *exceeds* the open fraction times the
    // tissue value — 26 against 23 at a transpulmonary pressure of 6 — which is
    // the same recruitment the phenotype checks above are about.
    const low = at(6), high = at(24);
    check('above the opening range, compliance is the open fraction times the tissue value or less',
      high.measured <= consolidated.clung * high.open + 0.5,
      `${high.measured.toFixed(0)} against ${(consolidated.clung * high.open).toFixed(0)} at Pl 24`);
    check('and below it, units still opening push it the other way',
      low.measured > consolidated.clung * low.open,
      `${low.measured.toFixed(0)} against ${(consolidated.clung * low.open).toFixed(0)} at Pl 6`);
  }

  // Resting volume is an outcome now, so the whole model has to agree on it.
  {
    const s = settled({ collapsed: 0.42, clung: 40, riRatio: 0.7, pOpen: 18, peep: 0, mode: 'vcv', vt: 300 }, 40);
    check('the integrator settles at the resting volume the curve predicts',
      near(s.resp.relaxVolume, relaxationVolume(s.params), 1e-9),
      `${s.resp.relaxVolume.toFixed(4)} vs ${relaxationVolume(s.params).toFixed(4)} L`);
  }

  // PEEP now buys a recruitable patient volume that a consolidated one does not
  // get, which is the bedside version of all of the above.
  const eelv = (over) => {
    const sim = settled({ mode: 'vcv', pmus: 0, vt: 350, rr: 20, collapsed: 0.42, clung: 40, ...over }, 45);
    let lo = Infinity;
    for (let i = 0; i < (60 / sim.params.rr) / 0.01; i++) { sim.advance(0.01, true); lo = Math.min(lo, sim.resp.lungVolume); }
    return lo;
  };
  const rGain = eelv({ riRatio: 0.7, pOpen: 18, peep: 16 }) - eelv({ riRatio: 0.7, pOpen: 18, peep: 4 });
  const cGain = eelv({ riRatio: 0, peep: 16 }) - eelv({ riRatio: 0, peep: 4 });
  check('PEEP 4 to 16 gains a recruitable lung more volume than a consolidated one',
    rGain > cGain * 1.25,
    `${(rGain * 1000).toFixed(0)} mL vs ${(cGain * 1000).toFixed(0)} mL`);
}

section('Recruitment hysteresis');
{
  // A small tidal volume on purpose. With a large one the breaths themselves
  // reach the top of the hysteresis band within a few cycles — tidal recruitment
  // doing the manoeuvre's job — and there is nothing left for a manoeuvre to
  // add. That is a real finding rather than an inconvenience, and it has its own
  // check below.
  const ARDS = {
    ...SCENARIOS.find((x) => x.id === 'ards-rv').params,
    hysteresis: 'on', pOpen: 22, riRatio: 0.7, vt: 250,
  };
  // Settle, then a recruitment manoeuvre, then back to where it started.
  const manoeuvre = (over) => {
    const s = settled({ ...ARDS, ...over }, 45);
    const before = { open: s.metrics.openFraction, pvr: s.metrics.pvrCoefficientWood,
      rvlv: s.metrics.rvLvRatio, pl: s.resp.pl };
    const peep = s.params.peep;
    s.setParam('peep', 35);
    s.advance(30, true);
    s.setParam('peep', peep);
    s.advance(45, true);
    return { before, after: { open: s.metrics.openFraction, pvr: s.metrics.pvrCoefficientWood,
      rvlv: s.metrics.rvLvRatio }, sim: s };
  };

  check('off, the flag changes nothing at all',
    settled({ ...ARDS, hysteresis: 'off', peep: 10 }, 45).metrics.openFraction
      === settled({ ...ARDS, hysteresis: 'off', peep: 10, pClose: 3 }, 45).metrics.openFraction);

  // Hysteresis belongs only to collapsed-but-openable units. This assertion is
  // deliberately made at negative as well as positive pressures: the former
  // implementation shifted the normal population's closing curve and could
  // pass every ordinary ventilator-range test while remaining structurally
  // wrong.
  {
    const healthy = { ...defaultParams(), collapsed: 0, hysteresis: 'on', pOpen: 22, pClose: 6 };
    const gap = [-10, -5, 0, 5, 15]
      .map((pl) => { const band = openBand(healthy, pl); return band.hi - band.lo; });
    check('a lung with no collapsed compartment has no recruitment hysteresis',
      gap.every((value) => value === 0),
      gap.map((value) => value.toExponential(1)).join(', '));

    const off = settled({ ...healthy, hysteresis: 'off', mode: 'vcv', vt: 450, peep: 10 }, 20);
    const on = settled({ ...healthy, mode: 'vcv', vt: 450, peep: 10 }, 20);
    check('healthy mechanics are bit-identical with hysteresis on and off',
      on.resp.plSolved === off.resp.plSolved
        && on.resp.lungVolume === off.resp.lungVolume
        && on.metrics.openFraction === off.metrics.openFraction,
      `Pl ${off.resp.plSolved} vs ${on.resp.plSolved}`);
  }

  // The point of the whole thing: a manoeuvre that leaves something behind.
  const held = manoeuvre({ pClose: 6, peep: 10 });
  check('a recruitment manoeuvre leaves the lung more open than it found it',
    held.after.open > held.before.open + 0.02,
    `${(held.before.open * 100).toFixed(1)}% -> ${(held.after.open * 100).toFixed(1)}% at the same PEEP`);
  check('and the right ventricle feels it',
    held.after.pvr < held.before.pvr && held.after.rvlv < held.before.rvlv,
    `PVR ${held.before.pvr.toFixed(2)} -> ${held.after.pvr.toFixed(2)} Wood units, `
    + `RV:LV ${held.before.rvlv.toFixed(2)} -> ${held.after.rvlv.toFixed(2)}`);

  // And the condition under which it does not, which is the clinical point.
  const lost = manoeuvre({ pClose: 14, peep: 10 });
  check('a manoeuvre buys nothing if the PEEP after it is below the closing pressure',
    Math.abs(lost.after.open - lost.before.open) < 0.005,
    `end-expiratory transpulmonary pressure ${lost.before.pl.toFixed(1)} against a closing pressure of 14; `
    + `${(lost.before.open * 100).toFixed(1)}% -> ${(lost.after.open * 100).toFixed(1)}%`);

  // Incremental and decremental limbs are the same lung at the same pressures.
  {
    const up = settled({ ...ARDS, pClose: 6, peep: 4 }, 40);
    const down = settled({ ...ARDS, pClose: 6, peep: 4 }, 20);
    down.setParam('peep', 35); down.advance(30, true);
    // The decremental limb has to be walked *down*, which is the whole point of
    // it. Stepping both series upward compares one limb with itself.
    const rungs = [8, 12, 16];
    const upAt = new Map(), downAt = new Map();
    for (const peep of rungs) {
      up.setParam('peep', peep); up.advance(35, true);
      upAt.set(peep, [up.metrics.openFraction, up.metrics.pvrCoefficientWood]);
    }
    for (const peep of [...rungs].reverse()) {
      down.setParam('peep', peep); down.advance(35, true);
      downAt.set(peep, [down.metrics.openFraction, down.metrics.pvrCoefficientWood]);
    }
    const limbs = rungs.map((peep) => [peep, upAt.get(peep)[0], downAt.get(peep)[0],
      upAt.get(peep)[1], downAt.get(peep)[1]]);
    check('the decremental limb sits above the incremental one at every PEEP',
      limbs.every(([, u, d]) => d > u + 0.01),
      limbs.map(([peep, u, d]) => `${peep}: ${(u * 100).toFixed(1)} vs ${(d * 100).toFixed(1)}%`).join('  '));
    check('and its resistance is lower there',
      limbs.every(([, , , ru, rd]) => rd < ru),
      limbs.map(([peep, , , ru, rd]) => `${peep}: ${ru.toFixed(2)} vs ${rd.toFixed(2)}`).join('  '));
  }

  // The state has to stay inside the band it is defined by, always.
  {
    const s = settled({ ...ARDS, pClose: 6, peep: 8 }, 30);
    let worst = 0;
    for (let i = 0; i < 400; i++) {
      s.advance(0.05, true);
      const { lo, hi } = openBand(s.params, s.resp.plSolved);
      worst = Math.max(worst, lo - s.resp.openFraction, s.resp.openFraction - hi);
    }
    check('the open fraction never leaves its band', worst < 1e-9, `worst excursion ${worst.toExponential(1)}`);
  }

  // Found while the tidal volume above was being chosen, and worth keeping: a
  // big enough breath recruits by itself, and then a manoeuvre adds nothing.
  {
    const big = manoeuvre({ pClose: 6, peep: 10, vt: 600 });
    check('a large enough tidal volume leaves a manoeuvre nothing to add',
      Math.abs(big.after.open - big.before.open) < 0.005
        && big.before.open > held.before.open,
      `at 600 mL the lung already sits at ${(big.before.open * 100).toFixed(1)}%, `
      + `against ${(held.before.open * 100).toFixed(1)}% at 250`);
  }

  // Setting the two pressures equal is the same as turning the flag off.
  check('no gap is the same as no hysteresis',
    near(settled({ ...ARDS, pClose: 22, peep: 10 }, 45).metrics.openFraction,
      settled({ ...ARDS, hysteresis: 'off', peep: 10 }, 45).metrics.openFraction, 0.005));
}

section('The stress index');
{
  const vcv = { mode: 'vcv', pmus: 0, rr: 12, ti: 1.5 };
  const si = (o) => settled({ ...vcv, ...o }, 45).metrics.stressIndex;

  // The curve has to bend, and the direction has to depend on why.
  check('a normal lung at a protective tidal volume reads about 1',
    near(si({ vt: 450, peep: 5 }), 1, 0.08), `${si({ vt: 450, peep: 5 }).toFixed(2)}`);
  check('and rises with tidal volume, because the tissue runs out of room',
    si({ vt: 1400, peep: 10 }) > si({ vt: 450, peep: 10 }) + 0.03,
    `${si({ vt: 450, peep: 10 }).toFixed(2)} at 450 mL -> ${si({ vt: 1400, peep: 10 }).toFixed(2)} at 1400`);
  check('a stiff collapsed lung at a large tidal volume shows overdistension',
    si({ clung: 45, collapsed: 0.4, vt: 900, peep: 20 }) > 1.1,
    `${si({ clung: 45, collapsed: 0.4, vt: 900, peep: 20 }).toFixed(2)}`);

  // The other direction, and the pair that makes it a teaching point: the same
  // lung reads below 1 when PEEP is too low to hold it open and above 1 once it
  // is not.
  const openable = { clung: 45, collapsed: 0.45, riRatio: 0.8, pOpen: 16, vt: 600 };
  check('too little PEEP shows tidal recruitment instead',
    si({ ...openable, peep: 2 }) < 0.95, `${si({ ...openable, peep: 2 }).toFixed(2)} at PEEP 2`);
  check('and enough of it turns the same lung the other way',
    si({ ...openable, peep: 14 }) > si({ ...openable, peep: 2 }) + 0.1,
    `${si({ ...openable, peep: 2 }).toFixed(2)} -> ${si({ ...openable, peep: 14 }).toFixed(2)}`);

  // It reads the shape of a constant-flow inflation, so without one it is not a
  // reading at all.
  const spont = settled({ mode: 'spont', pmus: 10, peep: 4 }, 40);
  check('withheld when the patient is breathing',
    spont.metrics.stressIndex === null
      && spont.metrics.interpretability.stressIndex.level === 'unavailable',
    spont.metrics.interpretability.stressIndex.reasons.join(' | '));
  check('and withheld in pressure control, where flow is not constant',
    settled({ mode: 'pcv', pmus: 0, pinsp: 16, peep: 6 }, 40).metrics.stressIndex === null);

  // Compliance and maximum size are independent inputs. `clung` controls the
  // local slope while there is room left; `lungCapacity` controls the asymptote.
  // Collapse then decides what fraction of that ceiling is currently available.
  const p = defaultParams();
  check('a normal lung rests at 2.2 L',
    near(relaxationVolume(p), 2.2, 1e-6), `${relaxationVolume(p).toFixed(6)} L`);
  check('its default capacity is 6 L and is approached smoothly',
    p.lungCapacity === 6 && lungVolumeAtPl(p, 35, 1) > 5.7
      && near(lungVolumeAtPl(p, 200, 1), 6, 1e-3),
    `${lungVolumeAtPl(p, 35, 1).toFixed(2)} L at 35 and ${lungVolumeAtPl(p, 200, 1).toFixed(3)} L at high pressure`);
  {
    const slopeAtFive = (overrides) => {
      const q = { ...p, collapsed: 0, ...overrides };
      return (lungVolumeAtPl(q, 5.01, 1) - lungVolumeAtPl(q, 4.99, 1)) / 0.02;
    };
    check('changing compliance changes local slope without changing maximum size',
      near(slopeAtFive({ clung: 100 }), 0.1, 0.005)
        && near(lungVolumeAtPl({ ...p, clung: 45 }, 400, 1), 6, 1e-3)
        && near(lungVolumeAtPl({ ...p, clung: 300 }, 400, 1), 6, 1e-3),
      `C at rest ${(slopeAtFive({ clung: 100 }) * 1000).toFixed(0)} mL/cmH₂O; `
      + `ceilings ${lungVolumeAtPl({ ...p, clung: 45 }, 400, 1).toFixed(2)} and `
      + `${lungVolumeAtPl({ ...p, clung: 300 }, 400, 1).toFixed(2)} L`);
    check('changing maximum capacity preserves compliance away from the ceiling',
      near(slopeAtFive({ clung: 100, lungCapacity: 4 }),
        slopeAtFive({ clung: 100, lungCapacity: 8 }), 0.005)
        && near(lungVolumeAtPl({ ...p, lungCapacity: 4 }, 400, 1), 4, 1e-3)
        && near(lungVolumeAtPl({ ...p, lungCapacity: 8 }, 400, 1), 8, 1e-3),
      `local C ${(slopeAtFive({ clung: 100, lungCapacity: 4 }) * 1000).toFixed(0)} vs `
      + `${(slopeAtFive({ clung: 100, lungCapacity: 8 }) * 1000).toFixed(0)} mL/cmH₂O`);
  }
  check('compliance falls as it fills, rather than staying constant for ever',
    lungComplianceAt(p, lungVolumeAtPl(p, 40)) < lungComplianceAt(p, lungVolumeAtPl(p, 5)) * 0.6,
    `${lungComplianceAt(p, lungVolumeAtPl(p, 5)).toFixed(0)} at rest -> `
    + `${lungComplianceAt(p, lungVolumeAtPl(p, 40)).toFixed(0)} mL/cmH₂O near capacity`);
}

section('Body position');
{
  const ARDS = {
    collapsed: 0.42, clung: 40, vt: 350, rr: 24, eesRv: 0.28,
    pvrBase: 0.17, hpv: 1.6, peep: 12, riRatio: 0.7, pOpen: 18,
  };
  const ardsSupine = settled(ARDS);
  const ardsProne = settled({ ...ARDS, position: 'prone' });
  check('proning a recruitable lung opens some of it',
    ardsProne.metrics.openFraction > ardsSupine.metrics.openFraction + 0.02,
    `open ${ardsSupine.metrics.openFraction.toFixed(2)} -> ${ardsProne.metrics.openFraction.toFixed(2)}`);
  // This used to assert the opposite. Recruitment changed nothing mechanical
  // then, so proning could open units without the lung holding more gas — which
  // was the model's largest remaining inconsistency rather than a finding.
  check('and the units it opens now hold gas, so resting volume rises',
    ardsProne.resp.relaxVolume > ardsSupine.resp.relaxVolume,
    `${ardsSupine.resp.relaxVolume.toFixed(3)} -> ${ardsProne.resp.relaxVolume.toFixed(3)} L at rest`);
  check('proning a recruitable lung lowers pulmonary vascular resistance',
    // Proning is explicitly thought-generating in this app; direction is useful,
    // but its magnitude is too patient-specific to encode as a 5% calibration.
    ardsProne.metrics.pvrCoefficientWood < ardsSupine.metrics.pvrCoefficientWood,
    `${ardsSupine.metrics.pvrCoefficientWood.toFixed(2)} -> ${ardsProne.metrics.pvrCoefficientWood.toFixed(2)} Wood units`);
  check('proning a recruitable lung unloads the right ventricle',
    ardsProne.metrics.rvLvRatio < ardsSupine.metrics.rvLvRatio,
    `RV:LV ${ardsSupine.metrics.rvLvRatio.toFixed(2)} -> ${ardsProne.metrics.rvLvRatio.toFixed(2)}`);

  const normalSupine = settled({});
  const normalProne = settled({ position: 'prone' });
  check('proning a normal lung recruits nothing, because there is nothing shut',
    Math.abs(normalProne.metrics.openFraction - normalSupine.metrics.openFraction) < 0.01,
    `open ${normalSupine.metrics.openFraction.toFixed(3)} -> ${normalProne.metrics.openFraction.toFixed(3)}`);

  const consolidated = settled({ ...ARDS, riRatio: 0 });
  const consolidatedProne = settled({ ...ARDS, riRatio: 0, position: 'prone' });
  check('and proning a consolidated lung recruits nothing either — it is shut, not closed',
    Math.abs(consolidatedProne.metrics.openFraction - consolidated.metrics.openFraction) < 0.01,
    `open ${consolidated.metrics.openFraction.toFixed(3)} -> ${consolidatedProne.metrics.openFraction.toFixed(3)}`);
  check('proning stiffens the chest wall, so pleural pressure rises',
    normalProne.metrics.ppl > normalSupine.metrics.ppl && ardsProne.metrics.ppl > ardsSupine.metrics.ppl,
    `normal ${normalSupine.metrics.ppl.toFixed(1)} -> ${normalProne.metrics.ppl.toFixed(1)} cmH2O`);
  check('proning raises mean systemic filling pressure',
    normalProne.metrics.pmsf > normalSupine.metrics.pmsf,
    `${normalSupine.metrics.pmsf.toFixed(1)} -> ${normalProne.metrics.pmsf.toFixed(1)} mmHg`);
}

// The J-curve's shape is asserted in tests/literature.mjs. The active targets are
// now the human FRC-centred geometry and the absolute human in-vivo PEEP data;
// exact excised-animal maximal-inflation ratios are no longer model targets.
