import React from 'react';
import { MoonPhase } from '../types';
import MoonPhaseIcon from './MoonPhaseIcon';

interface CelestialBodyProps {
  name: 'Sun' | 'Moon';
  angle: number;
  verticalOffset: number; // 0 (high in sky) to 100 (at horizon)
  isAboveHorizon: boolean;
  phase?: MoonPhase;
  onClick: () => void;
  isDay?: boolean; // Only for moon to adjust opacity
}

const CelestialBody: React.FC<CelestialBodyProps> = ({ name, angle, verticalOffset, isAboveHorizon, phase, onClick, isDay }) => {
  const radius = 'w-[175px] h-[175px] sm:w-[250px] sm:h-[250px]'; // Half of the container size

  const iconStyle = `absolute transition-transform duration-1000 linear`;

  const sunIcon = (
    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 rounded-full shadow-[0_0_20px_5px_rgba(250,204,21,0.7)]"></div>
  );

  const moonIcon = (
    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
        {phase && <MoonPhaseIcon phase={phase} size="100%" />}
    </div>
  );

  // Visibility logic:
  // - A body is only visible if it's above the horizon.
  // - The Moon has reduced opacity during the day.
  let visibilityClass = 'opacity-0';
  if (isAboveHorizon) {
    if (name === 'Moon' && isDay) {
        visibilityClass = 'opacity-40';
    } else {
        visibilityClass = 'opacity-100';
    }
  }
  
  return (
    <button
      onClick={onClick}
      aria-label={`More information about the ${name}`}
      className={`${radius} ${iconStyle} ${visibilityClass} transition-opacity duration-1000 p-0 bg-transparent border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full`}
      style={{
        transform: `rotate(${angle}deg) translateY(-${verticalOffset}%) translateY(-100%) rotate(${-angle}deg)`
      }}
    >
      <div className="flex items-center justify-center w-full h-full pointer-events-none">
        {name === 'Sun' ? sunIcon : moonIcon}
      </div>
    </button>
  );
};

export default CelestialBody;