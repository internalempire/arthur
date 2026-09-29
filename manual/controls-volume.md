# Volume and vascular controls

> These controls separate blood volume, venous capacity, venous compliance and resistance so similar pressure changes are not taught as the same mechanism.

---

## Controls

| control | range | model meaning |
|---|---:|---|
| blood volume change | 25 mL increments, with exact endpoints; bounds depend on blood already applied | prepare an amount, then apply it explicitly to add or remove actual blood |
| venous capacity reduction | −200 to +200 mL, in 25 mL steps; default 0 | positive reduces zero-transmural-pressure volume; negative increases it, at unchanged total blood volume |
| venous compliance | 30–200 mL/mmHg | converts stressed volume into elastic filling pressure |
| resistance to venous return | 0.020–0.300 mmHg·s/mL | sets the falling slope of the aggregate venous-return relation |
| systemic vascular resistance | 0.25–3.00 mmHg·s/mL | aggregate resistance opposing LV outflow |

### Blood volume change

Choose an amount, then press **Apply +… mL** or **Remove … mL**. Moving the selector only prepares the next intervention; it does not change the patient, the saved prescription or the Pin comparisons. Positive values add blood and negative values remove it. The button is disabled at zero. Each application changes total circulating blood by exactly the selected amount, including while paused, and returns the selector to zero. That return does not remove blood already given. Two applications of +250 mL add a cumulative 500 mL.

**Current total blood volume**, in litres, sums all circulatory compartments. **Net added/removed**, in mL, records the cumulative balance relative to the displayed **Starting patient volume**. These readings describe the patient independently of the prepared dose. The available dose range is shown beside the button and updates after each application: cumulative interventions must stay within the model's existing blood-volume domain. A request outside it is rejected rather than partially delivered. Keyboard arrows and pointer adjustments use a 25 mL grid around zero, with exact end limits also reachable.

Blood enters or leaves the systemic venous reservoir, initially changing its stressed volume by the same amount at fixed capacity and compliance. It then redistributes through the circulation. The intervention is instantaneous and entirely intravascular: no infusion time, crystalloid distribution, fluid escape into tissues or blood-product properties are simulated. See [stressed volume](stressed-volume.md).

Selecting a scenario establishes its own starting volume and zero cumulative balance. Reset of a Custom patient restarts its current prescription and retains its applied balance and starting reference. Saving and loading retain both; a version-2 file without the reference uses its own prescribed volume as the starting point. Scenario selection, Reset and loading discard an unsubmitted dose. A prepared dose is not saved or copied into a Pin. The phenotype marker describes the applied patient prescription, so it can remain present while the selector reads zero.

Pin and the optional Mechanisms view compare **actual total blood volume**, reference → current, with the difference in mL. This persists after the selector returns to zero and accumulates across applications. Each reference retains its own blood and continues circulating independently; capacity-only changes do not create a blood-total difference. The comparison describes the resulting states, not the timing or count of earlier applications.

### Venous capacity reduction

This control changes the size of the systemic venous reservoir at zero transmural pressure. Positive values make it smaller and convert existing unstressed volume into stressed volume; negative values do the reverse. Zero means no manual shift. Blood is neither added nor removed, and the compliance slope stays fixed. The circulation then redistributes the existing blood according to the resulting pressures. A rise in filling pressure does not guarantee a rise in cardiac output.

The manual shift remains present with the baroreflex off. With it on, the manual and reflex shifts add; the Guyton panel’s **?** values-and-description view lists each contribution and their total. Turning the reflex off removes only its contribution. Pin preserves the selected capacity in each evolving reference; saved version-2 patient files preserve it too, and a file without this setting uses zero. Deep CO freezes the combined shift once.

To isolate the mechanism, leave the baroreflex off, Pin the baseline and change capacity without adding or removing blood and with compliance fixed. The ±200 mL range is a teaching exploration range, not a drug-dose conversion or a validated human reserve. See [venous tone](venous-tone.md).

The adjacent **Stressed** reading is the current stressed volume divided by the blood physically present in the systemic venous reservoir. It is shown as a percentage with numerator and denominator in mL. It excludes the separate IVC, cardiac chambers and other vascular compartments. Blood redistribution can change this percentage even with capacity held fixed. The reading is not a target or an automatic regulator; it updates with the current patient, including immediate capacity edits while paused. A partition outside 0–100% is shown as unavailable rather than clipped. During waveform history inspection these sidebar observations remain with the current controls, not the historical trace.

### Venous compliance

At the same stressed volume, lower compliance generates higher elastic filling pressure. It does not itself reclassify blood from unstressed to stressed. The manual and reflex venous-capacity shifts are separate and explained under [venous tone](venous-tone.md).

### Resistance to venous return

This control changes how much flow a given Pmsf–right-atrial-pressure gradient can sustain. It aggregates venous, hepatic and caval resistance, split between the splanchnic reservoir and the [inferior vena cava](inferior-vena-cava.md) conduit (33% upstream, 67% downstream); abdominal pressure can add a dynamic contribution and create a waterfall plateau on the downstream segment.

### Systemic vascular resistance

SVR changes LV arterial load and systemic pressure. The active [baroreflex](baroreflex.md) can partly oppose a manual change by adjusting its own resistance, rate, tone and contractility together. Switch the baroreflex off when the aim is to isolate the selected SVR. The Systemic vascular resistance tile shows the effective value used by the circulation and identifies any reflex contribution.

## Why these are independent

Fluid, venoconstriction and reduced venous compliance can all raise Pmsf, but they do so by changing different properties. Combining them into one “preload” control would make it impossible to teach why pressure can rise without an equivalent increase in usable flow.

## Limits

- One systemic venous reservoir replaces separate splanchnic, renal, muscular and cutaneous beds.
- No infusion time, transcapillary exchange, interstitial compartment, renal handling or blood viscosity.
- SVR has resistance and compliance but no distributed arterial waves or regional organ flow.
- The controls do not represent vasoactive drug doses or receptor pharmacology.
- Extreme combinations can create internally valid but clinically implausible states; use the global validity banner and compare directions rather than targets.

## References

- Rothe CF. Venous system: physiology of the capacitance vessels. *Physiol Rev*. 1983;63:1281–1342. [doi:10.1152/physrev.1983.63.4.1281](https://doi.org/10.1152/physrev.1983.63.4.1281)
- Magder S. Volume and its relationship to cardiac output and venous return. *Crit Care*. 2016;20:271. [doi:10.1186/s13054-016-1438-7](https://doi.org/10.1186/s13054-016-1438-7)
- Persichini R, Silva S, Teboul JL, et al. Effects of norepinephrine on mean systemic pressure and venous return in human septic shock. *Crit Care Med*. 2012;40:3146–3153. [doi:10.1097/CCM.0b013e318260c6c3](https://doi.org/10.1097/CCM.0b013e318260c6c3)

---

## See also

[Stressed volume](stressed-volume.md) · [Venous tone](venous-tone.md) · [Venous return](venous-return.md) · [Inferior vena cava](inferior-vena-cava.md) · [Guyton panel](panel-guyton.md) · [Baroreflex](baroreflex.md)
