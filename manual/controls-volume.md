# Volume and vascular controls

> These controls separate blood volume, venous capacity, venous compliance and resistance so similar pressure changes are not taught as the same mechanism.

---

## Controls

| control | range | model meaning |
|---|---:|---|
| blood added/removed | 25 mL increments, with exact endpoints; patient-dependent bounds | net blood added or removed relative to the stated starting patient volume |
| venous capacity reduction | −200 to +200 mL, in 25 mL steps; default 0 | positive reduces zero-transmural-pressure volume; negative increases it, at unchanged total blood volume |
| venous compliance | 30–200 mL/mmHg | converts stressed volume into elastic filling pressure |
| resistance to venous return | 0.020–0.300 mmHg·s/mL | sets the falling slope of the aggregate venous-return relation |
| systemic vascular resistance | 0.25–3.00 mmHg·s/mL | aggregate resistance opposing LV outflow |

### Blood added/removed

Positive values add actual blood; negative values remove it. The number is the **net change from the starting patient volume**, shown explicitly below the control. Zero means that no blood has been added or removed relative to that reference; it does not mean an empty circulation. **Current total blood volume**, in litres, is the sum of the blood in all circulatory compartments. Both readouts respond immediately to a volume adjustment, including while paused.

Selecting a scenario establishes its own starting volume and sets the displayed intervention to zero. Other control changes and Pin preserve that reference. Reset of a Custom patient restarts the current prescription and preserves the reference and net intervention. Patient saving preserves both; a version-2 file without the reference starts at zero using its own prescribed blood volume. The relative bounds depend on the reference, while the allowed physical prescription is unchanged. Keyboard arrows and pointer adjustments use a 25 mL grid around zero, with the exact end limits also reachable.

Blood enters or leaves the systemic venous reservoir and then redistributes. This is the model's fluid-volume intervention, but it is not a crystalloid or blood-product simulation. The phenotype marker can remain present at zero because the patient's starting volume differs from the neutral model reference. See [stressed volume](stressed-volume.md).

### Venous capacity reduction

This control changes the size of the systemic venous reservoir at zero transmural pressure. Positive values make it smaller and convert existing unstressed volume into stressed volume; negative values do the reverse. Zero means no manual shift. Blood is neither added nor removed, and the compliance slope stays fixed. The circulation then redistributes the existing blood according to the resulting pressures. A rise in filling pressure does not guarantee a rise in cardiac output.

The manual shift remains present with the baroreflex off. With it on, the manual and reflex shifts add; the Guyton panel’s **?** values-and-description view lists each contribution and their total. Turning the reflex off removes only its contribution. Pin preserves the selected capacity in each evolving reference; saved version-2 patient files preserve it too, and a file without this setting uses zero. Deep CO freezes the combined shift once.

To isolate the mechanism, leave the baroreflex off, Pin the baseline and change capacity while keeping blood added/removed and compliance fixed. The ±200 mL range is a teaching exploration range, not a drug-dose conversion or a validated human reserve. See [venous tone](venous-tone.md).

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
