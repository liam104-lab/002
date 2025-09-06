import React from 'react';
import { MoonPhaseInfo } from '../services/celestialService';
import MoonPhaseIcon from './MoonPhaseIcon';

interface MoonPhaseDisplayProps {
  info: MoonPhaseInfo;
}

const MoonPhaseDisplay: React.FC<MoonPhaseDisplayProps> = ({ info }) => {
  return (
    <div className="flex items-center justify-center p-4 bg-black/20 rounded-lg backdrop-blur-sm">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mr-4">
        <MoonPhaseIcon phase={info.phase} />
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white/90">{info.phase}</h2>
        <p className="text-sm sm:text-base text-white/70">
            {info.illumination ? `${(info.illumination * 100).toFixed(1)}% illuminated` : `Day ${Math.floor(info.age)} of cycle`}
        </p>
      </div>
    </div>
  );
};

export default MoonPhaseDisplay;