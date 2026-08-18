# Volume and vascular controls

> These controls separate blood volume, venous capacity, venous compliance and resistance so similar pressure changes are not taught as the same mechanism.

---

## Controls

| control | range | model meaning |
|---|---:|---|
| baseline stressed volume | 200–1,800 mL | adds or removes actual blood from the systemic venous reservoir |
| venous compliance | 30–200 mL/mmHg | converts stressed volume into elastic filling pressure |
| resistance to venous return | 0.020–0.300 mmHg·s/mL | sets the falling slope of the aggregate venous-return relation |
| systemic vascular resistance | 0.25–3.00 mmHg·s/mL | aggregate resistance opposing LV outflow |

### Stressed volume

Changing baseline stressed volume changes total circulating blood volume one-for-one at the moment of adjustment. The circulation then redistributes it. This is the model's fluid-volume intervention, but it is not a crystalloid or blood-product simulation. See [stressed volume](stressed-volume.md).

### Venous compliance

At the same stressed volume, lower compliance generates higher elastic filling pressure. It does not itself reclassify blood from unstressed to stressed. The autonomous venous-tone shift is separate and explained under [venous tone](venous-tone.md).

### Resistance to venous return

This control changes how much flow a given Pmsf–right-atrial-pressure gradient can sustain. It aggregates venous, hepatic and caval resistance, now split between the splanchnic reservoir and the [inferior vena cava](inferior-vena-cava.md) conduit (33% upstream, 67% downstream); abdominal pressure can add a dynamic contribution and create a waterfall plateau on the downstream segment.

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
