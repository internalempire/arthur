// Static lung mechanics, baby-lung strain, R/I calibration and the PVR operating point.
import {
  Simulator, SCENARIOS, defaultParams,
  lungRegions, pvrComponents, transpulmonaryAt, relaxationVolume, openFractionAt,
  chestWallPressure, chestWallComplianceAt, chestWallNeutralVolume,
  calibrateRecruitmentToInflation, recruitmentToInflation,
  section, check, near, settled,
} from '../support/model.mjs';

section('The independent chest wall');
{
  const normal = defaultParams();
  const neutral = chestWallNeutralVolume(normal);

  check('the normal lung and wall balance at 2.2 L without sharing a curve',
    near(relaxationVolume(normal), 2.2, 1e-6)
      && near(chestWallPressure(normal, 2.2), -5, 1e-6)
      && near(transpulmonaryAt(normal, 2.2), 5, 1e-6),
    `Pcw ${chestWallPressure(normal, 2.2).toFixed(1)} + `
      + `Pl ${transpulmonaryAt(normal, 2.2).toFixed(1)} cmH₂O`);
  check('the selected chest-wall compliance is the local slope at the reference point',
    near(chestWallComplianceAt(normal, 2.2), normal.ccw, 1e-6),
    `${chestWallComplianceAt(normal, 2.2).toFixed(0)} mL/cmH₂O`);
  check('the relaxed wall tends outward at FRC and inward above its neutral volume',
    neutral > 2.2
      && near(chestWallPressure(normal, neutral), 0, 1e-6)
      && chestWallPressure(normal, 6) > 0,
    `neutral volume ${neutral.toFixed(2)} L; Pcw at 6 L ${chestWallPressure(normal, 6).toFixed(1)} cmH₂O`);
  check('the wall stiffens toward both volume extremes rather than remaining linear',
    chestWallComplianceAt(normal, 0.2) < normal.ccw
      && chestWallComplianceAt(normal, 6) < normal.ccw,
    `${chestWallComplianceAt(normal, 0.2).toFixed(0)} at low volume, `
      + `${normal.ccw} near FRC, ${chestWallComplianceAt(normal, 6).toFixed(0)} mL/cmH₂O at high volume`);

  // This is the structural regression test. Lung disease may move the volume
  // at which the two elements meet, but it cannot move the wall relation itself.
  const diseasedLungs = [
    { ...normal, collapsed: 0.42, clung: 40, riRatio: 0, pOpen: 21 },
    { ...normal, clung: 300 },
    { ...normal, lungCapacity: 4 },
  ];
  check('lung compliance, collapse and capacity cannot translate the chest-wall curve',
    diseasedLungs.every((p) => near(
      chestWallPressure(p, 2.2), chestWallPressure(normal, 2.2), 1e-12,
    )),
    diseasedLungs.map((p) => chestWallPressure(p, 2.2).toFixed(3)).join(', '));

  for (const [name, phenotype] of [
    ['collapsed stiff', diseasedLungs[0]],
    ['lost recoil', diseasedLungs[1]],
  ]) {
    const volume = relaxationVolume(phenotype);
    check(`${name} lung finds its own passive intersection with the same wall`,
      near(chestWallPressure(phenotype, volume) + transpulmonaryAt(phenotype, volume), 0, 1e-5),
      `V ${volume.toFixed(2)} L, Pcw ${chestWallPressure(phenotype, volume).toFixed(1)}, `
        + `Pl ${transpulmonaryAt(phenotype, volume).toFixed(1)} cmH₂O`);
  }
  check('collapse lowers passive volume while loss of recoil raises it',
    relaxationVolume(diseasedLungs[0]) < relaxationVolume(normal)
      && relaxationVolume(diseasedLungs[1]) > relaxationVolume(normal),
    `${relaxationVolume(diseasedLungs[0]).toFixed(2)} collapsed, `
      + `${relaxationVolume(normal).toFixed(2)} normal, `
      + `${relaxationVolume(diseasedLungs[1]).toFixed(2)} lost recoil L`);

  const loaded = { ...normal, cwLoad: 6 };
  check('an external load shifts the wall curve without being renamed stiffness',
    near(chestWallPressure(loaded, 2.2) - chestWallPressure(normal, 2.2), 6, 1e-9)
      && near(chestWallComplianceAt(loaded, 2.2), chestWallComplianceAt(normal, 2.2), 1e-9)
      && relaxationVolume(loaded) < relaxationVolume(normal),
    `Pcw shift ${(chestWallPressure(loaded, 2.2) - chestWallPressure(normal, 2.2)).toFixed(1)} cmH₂O; `
      + `equilibrium ${relaxationVolume(normal).toFixed(2)} → ${relaxationVolume(loaded).toFixed(2)} L`);

  const live = new Simulator();
  live.resp.v = 0.4;
  const volumeBeforeLoad = live.resp.relaxVolume + live.resp.v;
  live.setParam('cwLoad', 6);
  const volumeAfterLoad = relaxationVolume(live.params) + live.resp.v;
  check('changing wall load preserves the gas already present in the lung',
    near(volumeAfterLoad, volumeBeforeLoad, 1e-9),
    `${volumeBeforeLoad.toFixed(3)} → ${volumeAfterLoad.toFixed(3)} L`);
}

section('The two-compartment lung');
{
  const p = defaultParams();
  check('a normal lung at its resting volume is fully open and unstrained',
    lungRegions(p, 2.2).openFraction > 0.97 && Math.abs(lungRegions(p, 2.2).strain) < 0.03,
    `open ${lungRegions(p, 2.2).openFraction.toFixed(3)}, strain ${lungRegions(p, 2.2).strain.toFixed(3)}`);

  // The PVR panel teaches a series construction, so the fields it draws must
  // remain the two opposing mechanical limbs and must add exactly to the open
  // path. This protects the picture from drifting back into unrelated overlays.
  {
    const low = pvrComponents(p, 1.3, null, 1);
    const frc = pvrComponents(p, 2.2, null, 1);
    const high = pvrComponents(p, 6.0, null, 1);
    check('the classical PVR components add in series to the open path',
      near(frc.alveolarPath + frc.extraAlveolarPath, frc.openPath, 1e-12)
        && near(frc.openPath, frc.total, 1e-12));
    check('the two PVR limbs move in opposite directions across RV to TLC',
      low.extraAlveolarPath > frc.extraAlveolarPath
        && frc.extraAlveolarPath > high.extraAlveolarPath
        && low.alveolarPath < frc.alveolarPath
        && frc.alveolarPath < high.alveolarPath,
      `extra ${low.extraAlveolarPath.toFixed(3)} → ${frc.extraAlveolarPath.toFixed(3)} → ${high.extraAlveolarPath.toFixed(3)}; `
      + `alveolar ${low.alveolarPath.toFixed(3)} → ${frc.alveolarPath.toFixed(3)} → ${high.alveolarPath.toFixed(3)}`);
    check('extra-alveolar vessels dominate at RV and alveolar vessels at TLC',
      low.extraAlveolarPath > low.alveolarPath * 2
        && frc.extraAlveolarPath / frc.alveolarPath > 0.8
        && frc.extraAlveolarPath / frc.alveolarPath < 1.25
        && high.alveolarPath > high.extraAlveolarPath * 2,
      `extra/alveolar ${(
        low.extraAlveolarPath / low.alveolarPath
      ).toFixed(2)} at RV, ${(
        frc.extraAlveolarPath / frc.alveolarPath
      ).toFixed(2)} at FRC, ${(
        high.extraAlveolarPath / high.alveolarPath
      ).toFixed(2)} at TLC`);
    check('both limbs of the total J-curve remain didactically visible',
      low.total > frc.total * 1.4 && high.total > frc.total * 1.4,
      `${(low.total / frc.total).toFixed(2)}× at RV and ${(high.total / frc.total).toFixed(2)}× at TLC versus FRC`);
  }

  // The arithmetic of the baby lung. The claim is about the strain a tidal
  // volume *adds*, not the level it reaches: the two lungs start from different
  // resting strains, because stiff tissue holds less gas at the same pressure,
  // and comparing the levels measures that instead.
  const ards = { ...p, collapsed: 0.42, clung: 40, riRatio: 0 };
  const collapseOnly = { ...p, collapsed: 0.42, riRatio: 0 };
  const gained = (q) => {
    const rest = relaxationVolume(q);
    return lungRegions(q, rest + 0.4).strain - lungRegions(q, rest).strain;
  };
  check('the same tidal volume adds more strain to a collapsed lung',
    gained(ards) > gained(p) * 1.5,
    `${gained(p).toFixed(3)} whole vs ${gained(ards).toFixed(3)} collapsed, `
    + `on ${openFractionAt(p, 5).toFixed(2)} vs ${openFractionAt(ards, 5).toFixed(2)} of the lung`);
  // Close to the reciprocal of the open fraction, not equal to it: the open
  // fraction itself moves a little over those 400 mL, so the ratio is an average
  // over the interval rather than the value at its start.
  check('and the ratio tracks the reciprocal of the open fraction',
    near(gained(collapseOnly) / gained(p), openFractionAt(p, 5) / openFractionAt(collapseOnly, 5), 0.15),
    `${(gained(collapseOnly) / gained(p)).toFixed(2)} against `
    + `${(openFractionAt(p, 5) / openFractionAt(collapseOnly, 5)).toFixed(2)} at the resting point`);

  // The mechanism the single-compartment model could not express.
  const closed = lungRegions({ ...ards, riRatio: 0 }, 1.8);
  const opens = lungRegions({
    ...ards, openableDiseasedFraction: 1, pOpen: 12,
  }, 1.8);
  check('recruitment lowers strain per unit at an unchanged lung volume',
    opens.openFraction > closed.openFraction && opens.strain < closed.strain,
    `open ${closed.openFraction.toFixed(2)} -> ${opens.openFraction.toFixed(2)}, `
    + `strain ${closed.strain.toFixed(2)} -> ${opens.strain.toFixed(2)}`);

  check('recruitability does nothing to a lung that is not collapsed',
    lungRegions({ ...p, riRatio: 0 }, 2.2).openFraction
      === lungRegions({ ...p, riRatio: 1 }, 2.2).openFraction);

  // R/I is now a measured manoeuvre rather than a renamed unit fraction. The
  // calibration must reproduce attainable targets and disclose when the finite
  // collapsed compartment makes a larger request impossible.
  {
    const phenotype = { ...p, collapsed: 0.42, clung: 40, ccw: 200, pOpen: 20, riRatio: 0.6 };
    const calibration = calibrateRecruitmentToInflation(phenotype);
    const measured = recruitmentToInflation({
      ...phenotype,
      openableDiseasedFraction: calibration.openableFraction,
    });
    check('R/I calibration reproduces an attainable bedside phenotype',
      near(measured.ratio, 0.6, 0.01) && !calibration.limited,
      `target 0.60, achieved ${measured.ratio.toFixed(3)}, openable fraction ${calibration.openableFraction.toFixed(3)}`);

    const impossible = calibrateRecruitmentToInflation({
      ...p, collapsed: 0.1, clung: 40, pOpen: 30, riRatio: 2,
    });
    check('R/I calibration never invents lung beyond the collapsed compartment',
      impossible.limited && impossible.openableFraction <= 1,
      `target 2.00, maximum ${impossible.maximum.toFixed(3)}, fraction ${impossible.openableFraction.toFixed(3)}`);
  }

  // Transpulmonary pressure has to be the same number the mechanics produce,
  // otherwise the curve is drawn from one model and the patient lives in another.
  {
    const s = settled({ peep: 12, clung: 120 }, 20);
    const drawn = transpulmonaryAt(s.params, s.resp.lungVolume);
    check('the drawn transpulmonary pressure matches the integrator',
      near(drawn, s.resp.pl, 0.01), `${s.resp.pl.toFixed(3)} vs ${drawn.toFixed(3)} cmH₂O`);
  }

  // A reading of resistance is a reading at a phase of the breath, because it
  // follows lung volume. In a patient with a large tidal excursion that is worth
  // a third of the value, and quoting a sample as if it were the patient's
  // number is a mistake this pins down.
  {
    const s = settled({ ...SCENARIOS.find((x) => x.id === 'copd').params }, 45);
    let lo = Infinity, hi = -Infinity, sum = 0, n = 0;
    for (let i = 0; i < (60 / s.params.rr) / 0.01; i++) {
      s.advance(0.01, true);
      const v = s.metrics.pvrCoefficientWood;
      lo = Math.min(lo, v); hi = Math.max(hi, v); sum += v; n++;
    }
    // The mean moved when the tissue gained a ceiling — a hyperinflated lung is
    // further up a curve that now bends — but the point of this check is the
    // *swing*, which is what makes a single reading a reading at a phase.
    // Much smaller than it was, and that is the point of anchoring the curve: a
    // flatter J means a reading taken at the wrong moment in the breath is less
    // wrong than the model used to claim. It is still a swing, and still a reason
    // to quote the cycle mean.
    // Four hundredths of a Wood unit is enough to assert that the signal is
    // still phase-dependent without forcing the visual right-limb retuning back
    // toward the much steeper animal curve this model deliberately retired.
    check('resistance still swings within a breath, though far less than it used to',
      hi - lo > 0.03 && near(sum / n, 1.27, 0.2),
      `mean ${(sum / n).toFixed(2)}, range ${lo.toFixed(2)}–${hi.toFixed(2)} Wood units`);
  }

  // Hyperinflation must cost something, and it must not need to be asked for.
  // A lung that has lost its elastic recoil rests high by itself, which is the
  // reason resting volume stopped being a parameter.
  const emphysema = { ...p, clung: 300 };
  check('a lung with lost recoil rests hyperinflated without being told to',
    relaxationVolume(emphysema) > relaxationVolume(p) + 0.1,
    `${relaxationVolume(emphysema).toFixed(2)} L against ${relaxationVolume(p).toFixed(2)} normal`);
  // Measured where the patient actually breathes, not at their resting volume.
  // The nadir follows the fully open resting volume; trapped gas must still move
  // the operating point above it. This is a directional COPD demonstration, not
  // a quantitative calibration of pulmonary vascular disease in COPD.
  {
    const copd = settled({ ...SCENARIOS.find((x) => x.id === 'copd').params }, 45);
    const normal = settled({}, 45);
    check('and the gas it traps then puts it on the right limb',
      copd.metrics.pvrCoefficientWood > normal.metrics.pvrCoefficientWood * 1.01,
      `${copd.resp.lungVolume.toFixed(2)} L breathing at `
      + `${copd.metrics.pvrCoefficientWood.toFixed(2)} against a normal `
      + `${normal.metrics.pvrCoefficientWood.toFixed(2)} Wood units`);
  }

  // The claim the ARDS preset is built around, and the one that has drifted out
  // of the documentation twice. Asserted by direction rather than by value so it
  // survives retuning but still catches a sign flip.
  {
    const preset = SCENARIOS.find((x) => x.id === 'ards-rv').params;
    const at = (peep, over) => settled({ ...preset, peep, ...over }, 45).metrics;

    // Measured from PEEP 4 rather than 0, because below that even a consolidated
    // lung is reopening its *normal* units — those close at very low volume and
    // need almost no pressure back. That gives it a shallow optimum of its own
    // around PEEP 8, which is real and worth not asserting away.
    const consLow = at(4, { riRatio: 0 }), consHigh = at(20, { riRatio: 0 });
    const recrLow = at(4, {}), recrHigh = at(20, {});
    // On the derived value, because that is what a catheter reads and what the
    // trial these claims come from measured. The model's own coefficient falls
    // with PEEP in both lungs; the difference between them is what the bedside
    // sees, and it runs the other way.
    // Stated as the comparison, which is what the trial establishes. PEEP raises
    // the catheter number in both lungs over this range — cardiac output falls in
    // both — but far less where there is something to recruit.
    const recrRise = recrHigh.pvrDerivedWood / recrLow.pvrDerivedWood;
    const consRise = consHigh.pvrDerivedWood / consLow.pvrDerivedWood;
    check('PEEP costs the consolidated lung far more resistance than the recruitable one',
      consRise - recrRise > 0.15,
      `${((recrRise - 1) * 100).toFixed(0)}% recruitable vs ${((consRise - 1) * 100).toFixed(0)}% consolidated, PEEP 4 → 20`);
    check('so PEEP costs the consolidated lung more output',
      consLow.co - consHigh.co > recrLow.co - recrHigh.co,
      `${(recrLow.co - recrHigh.co).toFixed(2)} vs ${(consLow.co - consHigh.co).toFixed(2)} L/min lost`);

    // Even with nothing recruitable there is a best PEEP, and it is not zero.
    // No optimum at all in the consolidated lung: every increment of PEEP costs
    // it. That is what the corrected curve says, and it is the sharper teaching
    // point — there is nothing to recruit, so there is nothing to trade against.
    const sweep = [0, 4, 8, 12, 16, 20].map((peep) => at(peep, { riRatio: 0 }).pvrDerivedWood);
    check('and in a consolidated lung there is no best PEEP — every increment costs it',
      sweep.every((v, i) => i === 0 || v > sweep[i - 1]),
      sweep.map((v, i) => `${[0, 4, 8, 12, 16, 20][i]}:${v.toFixed(1)}`).join('  '));
  }

  check('open fraction is bounded and monotone in volume',
    (() => {
      let prev = -1;
      for (let v = 0.8; v <= 4.4; v += 0.05) {
        const f = lungRegions(ards, v).openFraction;
        if (!(f >= 0.05 && f <= 1) || f < prev - 1e-9) return false;
        prev = f;
      }
      return true;
    })());
}
