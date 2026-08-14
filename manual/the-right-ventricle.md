# The right ventricle

> The right ventricle integrates venous return, intrathoracic pressure, pulmonary vascular load and ventricular interaction, making it the central chamber of heart–lung interaction.

---

## Physiology

The normal right ventricle ejects the same long-term flow as the left ventricle into a circulation with much lower resistance and pressure. Its thin wall and geometry are efficient for moving volume but poorly suited to an abrupt pressure load. When pulmonary vascular load rises acutely, the RV cannot simply generate LV-like pressure: stroke volume falls, end-systolic and end-diastolic volume rise, and systemic output may fall.

RV performance depends on four linked domains:

1. **preload** — the pressure and resistance governing systemic [venous return](venous-return.md), interpreted relative to pleural and pericardial pressure;
2. **contractility** — the chamber's ability to generate pressure at a given volume;
3. **afterload** — pulmonary vascular resistance, pressure-dependent vessel closure and the pulsatile properties of the pulmonary arteries;
4. **interaction with the LV** — shared septum, pericardium and serial flow through the pulmonary circulation.

Positive-pressure ventilation can impair the first domain and worsen the third in the same breath. Rising pleural pressure reduces the gradient into the thorax or increases resistance to return. Rising lung volume may compress alveolar vessels, and high alveolar pressure can create a vascular waterfall. Recruitment can have the opposite pulmonary effect when it restores a previously unavailable vascular bed.

### Why pressure alone is insufficient

Mean pulmonary artery pressure is clinically important, but it does not uniquely describe RV afterload. The same mPAP can accompany different flow, wedge pressure, PVR, pulmonary arterial compliance and wave reflection. Conversely, a failing RV can generate only a modest mPAP despite a severe load. Read pressure together with flow, filling and chamber response.

### The spiral of acute RV failure

When the RV dilates, septal displacement and pericardial constraint can reduce LV filling. Lower LV output reduces systemic and coronary perfusion, while increased RV wall stress raises oxygen demand. The clinical spiral includes right coronary perfusion and myocardial ischaemia; the model reproduces mechanical interdependence but not the coronary component.

## In the model

The RV uses time-varying elastance with a lower default end-systolic elastance than the LV. Its pressure is calculated relative to pleural and pericardial pressure. A one-way pulmonic valve connects it to the pulmonary artery.

Pulmonary load includes the volume-dependent [PVR J-curve](pulmonary-vascular-resistance.md), parallel open and derecruited vascular pathways, aggregate zone-2 waterfall behaviour and downstream pulmonary venous pressure. The circulation is resistive and compliant; characteristic impedance and reflected waves are absent.

RV dilatation affects the LV through two explicit routes. Diastolic septal coupling raises the LV filling penalty as the RV becomes larger, and pericardial pressure rises when total cardiac volume exceeds the represented reserve. A separate systolic term permits LV contraction to assist RV pressure generation. These coefficients are teaching representations, not echocardiographic measurements.

Changing RV output reaches LV preload after [pulmonary transit](pulmonary-transit.md), whereas pleural pressure, the pulmonary venous piston and ventricular interaction act immediately. This distinction explains why the right and left ventricular effects of one breath can appear in different respiratory phases.

## Why this and not something else

A single PVR multiplier would be cheaper, but it would hide the principal pulmonary teaching point: recruitment, absolute lung volume and alveolar pressure can change RV load by different routes. The chosen model retains those routes while avoiding a regional pulmonary network.

Pulsatile pulmonary impedance, wave reflection, RV wall stress, coronary perfusion and oxygen consumption were not added. They matter clinically, particularly in advanced RV failure, but would add states and parameters whose behaviour is less visible than the core sequence from lung pressure to vascular load, RV dilatation and LV underfilling.

## Limits

### Of the construction

- RV afterload is predominantly resistive and pressure-dependent; pulmonary arterial impedance, wave reflection and frequency dependence are absent.
- There is no right coronary circulation, myocardial oxygen balance, ischaemia or infarction.
- Tricuspid and pulmonic valves cannot stenose or regurgitate, and there is no congenital shunt.
- RV geometry is a lumped volume and elastance, not a crescentic three-dimensional chamber; the displayed RV:LV ratio is a model volume ratio, not the echocardiographic diameter ratio.
- Pericardial constraint is weak or inactive until aggregate chamber volume reaches its model threshold; it is not a tamponade model.
- Autonomic compensation senses systemic MAP, not PVR, mPAP, hypoxaemia or RV wall stress directly.

### Of clinical application

- A model mPAP, PVR or RV:LV ratio cannot diagnose acute cor pulmonale or determine when to intubate, prone or give fluid.
- Absence of a large mPAP rise does not exclude severe RV afterload in vivo, especially when output is low.
- The model can demonstrate a direction of interaction but cannot reproduce individual RV reserve, coronary vulnerability or the full haemodynamic phenotype of ARDS or pulmonary embolism.

## Validation

Executable rows require raised pulmonary vascular load to increase RV pressure and volume, reduce output when contractile reserve is insufficient, and transmit a delayed effect to LV filling. Separate tests constrain septal interaction, PEEP–recruitability effects on PVR and volume conservation. They provide face and mechanism validity, not clinical calibration of RV pressure or geometry.

## References

- Ventetuolo CE, Klinger JR. Management of acute right ventricular failure in the intensive care unit. *Ann Am Thorac Soc*. 2014;11:811–822. [doi:10.1513/AnnalsATS.201312-446FR](https://doi.org/10.1513/AnnalsATS.201312-446FR)
- Repessé X, Charron C, Vieillard-Baron A. Right ventricular failure in acute lung injury and acute respiratory distress syndrome. *Minerva Anestesiol*. 2012;78:941–948.
- Vieillard-Baron A, Price LC, Matthay MA. Acute cor pulmonale in ARDS. *Intensive Care Med*. 2013;39:1836–1838. [doi:10.1007/s00134-013-3045-2](https://doi.org/10.1007/s00134-013-3045-2)
- Paternot A, Repessé X, Vieillard-Baron A. Rationale and description of right ventricle-protective ventilation in ARDS. *Respir Care*. 2016;61:1391–1396. [doi:10.4187/respcare.04943](https://doi.org/10.4187/respcare.04943)
- Haddad F, Doyle R, Murphy DJ, Hunt SA. Right ventricular function in cardiovascular disease, part II. *Circulation*. 2008;117:1717–1731. [doi:10.1161/CIRCULATIONAHA.107.653584](https://doi.org/10.1161/CIRCULATIONAHA.107.653584)

---

## See also

[Venous return](venous-return.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Pulmonary transit](pulmonary-transit.md) · [Ventricular interdependence](ventricular-interdependence.md) · [PV loops](panel-pv-loops.md) · [Clinical scenarios](scenarios.md)
