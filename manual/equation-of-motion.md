# The equation of motion

> The lung and chest wall share one volume but have separate pressure–volume relations. Their pressures add at the alveolus; airway resistance adds a further pressure only while gas is flowing.

---

## Physiology

The respiratory system contains two elastic structures in series. At any instant, the pressure needed to hold a given volume is the sum of lung recoil and chest-wall recoil:

$$
P_{alv}=P_l+P_{cw}-P_{mus}
$$

During flow, the airway also pays a resistive pressure:

$$
P_{aw}=P_{alv}+\dot V R_{aw}
$$

- $P_l$ is transpulmonary pressure: the pressure distending the lung.
- $P_{cw}$ is the relaxed chest-wall recoil pressure at the current absolute volume. It is negative when the wall tends to spring outward and positive when it tends inward.
- $P_{mus}$ is inspiratory muscle pressure. It lowers pleural pressure when the patient makes an inspiratory effort.
- $\dot V R_{aw}$ is the pressure lost across airway resistance.

Pleural pressure in this one-compartment construction is therefore:

$$
P_{pl}=P_{cw}-P_{mus}
$$

This partition is clinically important. The lung component determines lung stress; the chest-wall component is transmitted around the heart and intrathoracic vessels. The same airway pressure can therefore have different pulmonary and haemodynamic meanings in two patients.

When flow stops during a hold, the resistive term disappears. This is why peak airway pressure contains resistance whereas plateau pressure represents the combined elastic load.

---

## In the model

Both elastic elements are evaluated from the same **absolute lung volume**, but neither is defined from the other:

$$
P_l=F_l(V,\varphi), \qquad P_{cw}=F_{cw}(V;C_{cw})+L_{cw}
$$

$F_l$ is the nonlinear lung relation described on the [pressure–volume curve](pressure-volume-curve.md) page. It contains aerated-tissue compliance, maximum capacity and the fraction of lung that is open.

$F_{cw}$ is an independent sigmoid relaxation curve. Around ordinary tidal breathing it is close to a straight line, so the `Chest wall compliance` control remains an intuitive local slope. At large departures from that region the curve progressively stiffens instead of allowing a constant compliance to continue indefinitely. $L_{cw}$ is the separate `Chest wall load`: it shifts the curve without changing its reference slope.

### Passive equilibrium

At zero applied airway pressure and with relaxed respiratory muscles, the resting volume is not assigned to either element. It is solved from:

$$
P_l(V_{relax})+P_{cw}(V_{relax})=0
$$

At a static PEEP:

$$
P_l(V_{EE})+P_{cw}(V_{EE})=PEEP
$$

This is the key structural change. A collapsed, stiff lung now meets the unchanged wall at a lower volume and a higher transpulmonary recoil. A lung with lost recoil meets the same wall at a higher volume. Changing the lung no longer silently moves the chest-wall reference.

### Dynamic breaths

Volume control imposes inspiratory flow and lets pressure emerge. Pressure control applies airway pressure and lets flow decay as alveolar pressure approaches it. Spontaneous and assisted breaths subtract effective inspiratory-muscle pressure from the relaxed wall pressure.

The neural command and effective muscle pressure are not treated as the same instantaneous signal. One internal activation state rises rapidly during neural inspiration and decays more slowly after neural switch-off. The residual pressure lowers pleural and alveolar pressure during early expiration, reducing outward flow. Volume then changes more slowly, which feeds back through both nonlinear recoil relations. This is the model's aggregate representation of post-inspiratory expiratory braking; the [Campbell diagram](panel-campbell.md#what-happens-during-active-expiration) shows its pressure–volume consequence.

The simulator stores respiratory volume as displacement from the current passive equilibrium for numerical convenience, but lung and wall pressure are always calculated from absolute volume. When an elastic control changes, the gas already in the lung is preserved and only this internal reference is updated.

---

## Why this implementation

**One aggregate wall is enough for the teaching aim.** A separate rib cage, diaphragm and abdomen would better reproduce posture, obesity and regional pleural gradients, but each would add poorly identifiable parameters. One independent nonlinear wall corrects the important causal error without turning the app into a respiratory-mechanics simulator.

**Stiffness and load are different controls.** Low compliance makes the pleural-pressure swing larger for a given delivered volume. A positive load shifts resting pleural pressure and passive volume even before a breath is delivered. Obesity or intra-abdominal hypertension can contain both effects; treating them as synonyms would hide the distinction.

**A sigmoid is used as a physiological shape, not a patient fit.** Human relaxation curves are near-linear in their middle range and stiffen toward the volume extremes. The model calibrates the normal operating point and local compliance, but it does not claim that the curve's remote asymptotes are measured RV or TLC.

**Airway-pressure curvature is no longer exclusively pulmonary.** In the ordinary tidal range, chest-wall curvature is small and the [stress index](stress-index.md) remains mainly a readout of changing lung compliance. At extreme volume or wall mechanics, however, the wall can contribute to the airway-pressure shape. This is physiologically more honest than forcing the wall to remain linear merely to make the index easier to interpret.

---

## Limits

- One global lung and one global chest wall replace regional mechanics and pleural-pressure gradients.
- The wall curve is a calibrated teaching relation, not a patient-specific oesophageal pressure–volume fit.
- Rib cage, diaphragm and abdominal wall are not separate compartments.
- The `Chest wall load` is an aggregate pressure offset; it is not calculated from body mass, ascites volume or a fixed fraction of abdominal pressure.
- Post-inspiratory inspiratory activity is represented by one regular decay, but there is no separately recruited expiratory-muscle pressure, inspiratory threshold load, respiratory-drive controller or respiratory-muscle fatigue.
- Pressure support has simplified flow cycling; the model does not reproduce the full range of patient–ventilator dyssynchrony.
- Airway resistance is linear except for the separate [expiratory flow-limitation](expiratory-flow-limitation.md) choke.
- The ventilator has no circuit compliance, leak, trigger delay or rise-time control.

---

## References

- Rahn H, Otis AB, Chadwick LE, Fenn WO. The pressure-volume diagram of the thorax and lung. *Am J Physiol*. 1946;146:161–178. [doi:10.1152/ajplegacy.1946.146.2.161](https://doi.org/10.1152/ajplegacy.1946.146.2.161)
- Agostoni E, Hyatt RE. Static behavior of the respiratory system. In: *Handbook of Physiology, The Respiratory System*. 1986:113–130. [doi:10.1002/cphy.cp030309](https://doi.org/10.1002/cphy.cp030309)
- Pereira C, Bohé J, Rosselli S, et al. Sigmoidal equation for lung and chest wall volume-pressure curves in acute respiratory failure. *J Appl Physiol*. 2003;95:2064–2071. [doi:10.1152/japplphysiol.00385.2003](https://doi.org/10.1152/japplphysiol.00385.2003)
- Akoumianaki E, Maggiore SM, Valenza F, et al. The application of esophageal pressure measurement in patients with respiratory failure. *Am J Respir Crit Care Med*. 2014;189:520–531. [doi:10.1164/rccm.201312-2193CI](https://doi.org/10.1164/rccm.201312-2193CI)
- Shee CD, Ploy-Song-Sang Y, Milic-Emili J. Decay of inspiratory muscle pressure during expiration in conscious humans. *J Appl Physiol*. 1985;58:1859–1865. [doi:10.1152/jappl.1985.58.6.1859](https://doi.org/10.1152/jappl.1985.58.6.1859)

---

## See also

[Pleural pressure](pleural-pressure.md) · [Pressure–volume curve](pressure-volume-curve.md) · [The two-population lung](two-population-lung.md) · [Stress index](stress-index.md) · [The Campbell diagram](panel-campbell.md) · [Controls: mechanics](controls-mechanics.md)
