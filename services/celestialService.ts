import { MoonPhase } from '../types';

export interface MoonPhaseInfo {
  phase: MoonPhase;
  age: number;
  fraction: number;
  illumination?: number;
}

// Astronomical constants
const LUNAR_MONTH = 29.530588853;
// A known new moon (synodic epoch)
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();

const daysSinceKnownNewMoon = (date: Date): number => {
  const msSince = date.getTime() - KNOWN_NEW_MOON;
  return msSince / (1000 * 60 * 60 * 24);
};

export const getMoonPhase = (date: Date): MoonPhaseInfo => {
  const days = daysSinceKnownNewMoon(date);
  const age = days % LUNAR_MONTH;
  const fraction = age / LUNAR_MONTH;

  let phase: MoonPhase;

  if (fraction < 0.03 || fraction >= 0.97) {
    phase = MoonPhase.NewMoon;
  } else if (fraction < 0.23) {
    phase = MoonPhase.WaxingCrescent;
  } else if (fraction < 0.27) {
    phase = MoonPhase.FirstQuarter;
  } else if (fraction < 0.48) {
    phase = MoonPhase.WaxingGibbous;
  } else if (fraction < 0.52) {
    phase = MoonPhase.FullMoon;
  } else if (fraction < 0.73) {
    phase = MoonPhase.WaningGibbous;
  } else if (fraction < 0.77) {
    phase = MoonPhase.ThirdQuarter;
  } else {
    phase = MoonPhase.WaningCrescent;
  }

  return { phase, age, fraction };
};