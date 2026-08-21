// Directional heart-lung relations and the aggregate COPD/EFL teaching model.
import {
  staticEndExpiratoryVolume, section, check, near, settled,
} from '../support/model.mjs';

section('Ventilatory mode transitions');
{
  const sim = settled({ mode: 'spont', pmus: 10, peep: 0 }, 1);

  sim.setParam('mode', 'vcv');
  check('entering volume control clears effort inherited from a spontaneous scenario',
    sim.params.mode === 'vcv' && sim.params.pmus === 0);

  sim.setParam('pmus', 6);
  check('effort can be deliberately reintroduced after entering volume control',
    sim.params.mode === 'vcv' && sim.params.pmus === 6);

  sim.setParam('mode', 'psv');
  check('entering pressure support preserves patient effort',
    sim.params.mode === 'psv' && sim.params.pmus === 6);

  sim.setParam('mode', 'pcv');
  check('entering pressure control also starts from a passive patient',
    sim.params.mode === 'pcv' && sim.params.pmus === 0);
}

section('Physiological relations');
{
  const peep0 = settled({ peep: 0 });
  const peep16 = settled({ peep: 16 });
  check('PEEP raises central venous pressure',
    peep16.metrics.cvp > peep0.metrics.cvp,
    `${peep0.metrics.cvp.toFixed(1)} -> ${peep16.metrics.cvp.toFixed(1)} mmHg`);
  check('PEEP lowers cardiac output',
    peep16.metrics.co < peep0.metrics.co,
    `${peep0.metrics.co.toFixed(2)} -> ${peep16.metrics.co.toFixed(2)} L/min`);
  check('PEEP raises mean systemic filling pressure',
    peep16.metrics.pmsf > peep0.metrics.pmsf,
    `${peep0.metrics.pmsf.toFixed(1)} -> ${peep16.metrics.pmsf.toFixed(1)} mmHg`);

  const passive = settled({ mode: 'vcv', pmus: 0, peep: 0 });
  const spont = settled({ mode: 'spont', pmus: 8, peep: 0 });
  check('spontaneous breathing lowers measured central venous pressure',
    spont.metrics.cvp < passive.metrics.cvp,
    `${passive.metrics.cvp.toFixed(1)} -> ${spont.metrics.cvp.toFixed(1)} mmHg`);
  check('spontaneous breathing raises cardiac output',
    spont.metrics.co > passive.metrics.co,
    `${passive.metrics.co.toFixed(2)} -> ${spont.metrics.co.toFixed(2)} L/min`);
  check('transmural filling pressure exceeds the measured one when breathing in',
    spont.metrics.cvpTransmural > spont.metrics.cvp,
    `${spont.metrics.cvp.toFixed(1)} vs ${spont.metrics.cvpTransmural.toFixed(1)} mmHg`);

  const dry = settled({ stressedVolume: 330, vt: 560, ccw: 150, svr: 0.85, hr: 105 });
  const wet = settled({ stressedVolume: 830, vt: 560, ccw: 150, svr: 0.85, hr: 105 });
  // Phase 1 retired the Michard-based PPV calibration. Do not reintroduce it as
  // an unlabelled five-point separation here: with transit and the pulmonary
  // venous piston both active, variation is not monotone across filling states.
  // The model may display PPV descriptively, but the independent Guyton reserve
  // below is what is tested against a fluid response.
  check('a fluid bolus raises cardiac output more when the patient is dry',
    wet.metrics.co - dry.metrics.co > 1.0,
    `${dry.metrics.co.toFixed(2)} -> ${wet.metrics.co.toFixed(2)} L/min`);

  const roomy = settled({ raw: 5, rr: 12, ti: 1.2 });
  const trapped = settled({ raw: 24, rr: 26, ti: 0.9, clung: 300 });
  check('a short expiratory time generates intrinsic PEEP',
    trapped.metrics.autoPeep > 2 && roomy.metrics.autoPeep < 0.5,
    `${roomy.metrics.autoPeep.toFixed(2)} vs ${trapped.metrics.autoPeep.toFixed(2)} cmH2O`);

  const softChest = settled({ ccw: 250, vt: 500 });
  const stiffChest = settled({ ccw: 70, vt: 500 });
  check('a stiff chest wall raises the pleural swing for the same tidal volume',
    stiffChest.metrics.pplSwing > softChest.metrics.pplSwing * 2,
    `${softChest.metrics.pplSwing.toFixed(1)} vs ${stiffChest.metrics.pplSwing.toFixed(1)} cmH2O`);

  const rvFail = settled({ eesRv: 0.22, pvrBase: 0.30 });
  check('right ventricular failure dilates the RV relative to the LV',
    rvFail.metrics.rvLvRatio > 1.4,
    `RV:LV ${rvFail.metrics.rvLvRatio.toFixed(2)}`);

  // Isolating one mechanism means holding the compensation still. With the
  // reflex running, it partly makes up for what the septum costs, and the
  // remaining difference is smaller than the respiratory swing.
  const septum = settled({ eesRv: 0.22, pvrBase: 0.30, baroreflex: 0 }, 45);
  const noSeptum = settled({ eesRv: 0.22, pvrBase: 0.30, baroreflex: 0, septal: 0 }, 45);
  check('removing septal coupling lets the left ventricle fill',
    noSeptum.metrics.lvEdv > septum.metrics.lvEdv,
    `${septum.metrics.lvEdv.toFixed(1)} -> ${noSeptum.metrics.lvEdv.toFixed(1)} mL`);
}

// -------------------------------------------- expiratory flow limitation --

section('Expiratory flow limitation');
{
  const obstructed = {
    mode: 'vcv', pmus: 0, vt: 500, rr: 26, ti: 0.9, raw: 24, clung: 300,
  };
  const noLimit = settled({ ...obstructed, peep: 0, efl: 'off' }, 45);
  const flowLimited = settled({ ...obstructed, peep: 0, efl: 'on' }, 45);
  check('the expiratory choke adds trapping beyond linear resistance alone',
    flowLimited.metrics.trappedVolume > noLimit.metrics.trappedVolume + 400
      && flowLimited.metrics.co < noLimit.metrics.co - 0.2,
    `trapped ${noLimit.metrics.trappedVolume.toFixed(0)} -> ${flowLimited.metrics.trappedVolume.toFixed(0)} mL, `
      + `CO ${noLimit.metrics.co.toFixed(2)} -> ${flowLimited.metrics.co.toFixed(2)} L/min`);

  // In a flow-limited patient, modest downstream PEEP substitutes for part of
  // intrinsic PEEP with only a small residual change in absolute EELV and total
  // PEEP. Once it exceeds
  // the choke pressure it becomes real back-pressure again. This is the single
  // COPD-specific relation worth adding for heart-lung teaching; it is not a
  // patient-specific PEEP titration rule.
  const peep5 = settled({ ...obstructed, peep: 5, efl: 'on' }, 45);
  const peep13 = settled({ ...obstructed, peep: 13, efl: 'on' }, 45);
  check('PEEP below the choke does not add dynamic hyperinflation',
    Math.abs(peep5.metrics.endExpiratoryVolume - flowLimited.metrics.endExpiratoryVolume) < 0.05
      && Math.abs(peep5.metrics.totalPeep - flowLimited.metrics.totalPeep) < 0.5,
    `EELV ${flowLimited.metrics.endExpiratoryVolume.toFixed(2)} -> ${peep5.metrics.endExpiratoryVolume.toFixed(2)} L, `
      + `total PEEP ${flowLimited.metrics.totalPeep.toFixed(1)} -> ${peep5.metrics.totalPeep.toFixed(1)} cmH2O`);
  check('PEEP above the choke adds volume and haemodynamic cost',
    peep13.metrics.endExpiratoryVolume > peep5.metrics.endExpiratoryVolume + 0.5
      && peep13.metrics.cvp > peep5.metrics.cvp + 1.5
      && peep13.metrics.co < peep5.metrics.co - 0.1,
    `EELV ${peep5.metrics.endExpiratoryVolume.toFixed(2)} -> ${peep13.metrics.endExpiratoryVolume.toFixed(2)} L, `
      + `CVP ${peep5.metrics.cvp.toFixed(1)} -> ${peep13.metrics.cvp.toFixed(1)} mmHg, `
      + `CO ${peep5.metrics.co.toFixed(2)} -> ${peep13.metrics.co.toFixed(2)} L/min`);

  const longExpiration = settled({
    ...obstructed, peep: 5, efl: 'on', rr: 12, ti: 1,
  }, 45);
  check('more expiratory time unloads the circulation',
    longExpiration.metrics.autoPeep < peep5.metrics.autoPeep - 4
      && longExpiration.metrics.trappedVolume < peep5.metrics.trappedVolume - 500
      && longExpiration.metrics.co > peep5.metrics.co + 0.3,
    `intrinsic PEEP ${peep5.metrics.autoPeep.toFixed(1)} -> ${longExpiration.metrics.autoPeep.toFixed(1)}, `
      + `trapped ${peep5.metrics.trappedVolume.toFixed(0)} -> ${longExpiration.metrics.trappedVolume.toFixed(0)} mL, `
      + `CO ${peep5.metrics.co.toFixed(2)} -> ${longExpiration.metrics.co.toFixed(2)} L/min`);

  const staticEelv = staticEndExpiratoryVolume(peep5.params, peep5.params.peep);
  check('trapped volume is measured above static equilibrium at the same PEEP',
    near(peep5.metrics.trappedVolume,
      (peep5.metrics.endExpiratoryVolume - staticEelv) * 1000, 0.1));
}

// ------------------------------------------------------- pulmonary transit --
