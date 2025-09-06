import React from 'react';
import { MoonPhase } from '../types';

interface MoonPhaseIconProps {
  phase: MoonPhase;
  size?: string | number;
}

// FIX: Define a type for the return value of getPathForPhase to ensure type safety for SVG properties.
type PathInfo = {
  path: string;
  fill: string;
  fillRule?: 'nonzero' | 'evenodd' | 'inherit';
};

const MoonPhaseIcon: React.FC<MoonPhaseIconProps> = ({ phase, size = '100%' }) => {
  const getPathForPhase = (p: MoonPhase): PathInfo => {
    const cx = 24;
    const cy = 24;
    const r = 22;

    const mainCircle = `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${2 * r},0 a ${r},${r} 0 1,0 -${2 * r},0`;

    switch (p) {
      case MoonPhase.NewMoon:
        return { path: mainCircle, fill: '#334155' };
      case MoonPhase.FullMoon:
        return { path: mainCircle, fill: '#f1f5f9' };
      case MoonPhase.FirstQuarter:
        return { path: `M${cx},${cy - r} V${cy + r} A${r},${r} 0 0 1 ${cx},${cy - r}z`, fill: '#f1f5f9' };
      case MoonPhase.ThirdQuarter:
        return { path: `M${cx},${cy - r} V${cy + r} A${r},${r} 0 0 0 ${cx},${cy - r}z`, fill: '#f1f5f9' };
      
      case MoonPhase.WaxingCrescent:
        return { path: `M${cx},${cy-r} A${r/1.5},${r} 0 0 0 ${cx},${cy+r} A${r},${r} 0 0 1 ${cx},${cy-r}z`, fill: '#f1f5f9' };
      case MoonPhase.WaningCrescent:
        return { path: `M${cx},${cy-r} A${r/1.5},${r} 0 0 1 ${cx},${cy+r} A${r},${r} 0 0 0 ${cx},${cy-r}z`, fill: '#f1f5f9' };
      
      case MoonPhase.WaxingGibbous:
        return { path: `M${cx},${cy - r} V${cy + r} A${r},${r} 0 0 1 ${cx},${cy - r}z M${cx},${cy-r} A${r/2},${r} 0 0 0 ${cx},${cy+r} A${r},${r} 0 0 1 ${cx},${cy-r}z`, fill: '#f1f5f9', fillRule: 'evenodd' };
      case MoonPhase.WaningGibbous:
        return { path: `M${cx},${cy - r} V${cy + r} A${r},${r} 0 0 0 ${cx},${cy - r}z M${cx},${cy-r} A${r/2},${r} 0 0 1 ${cx},${cy+r} A${r},${r} 0 0 0 ${cx},${cy-r}z`, fill: '#f1f5f9', fillRule: 'evenodd' };
        
      default:
        return { path: mainCircle, fill: '#f1f5f9' };
    }
  };
  
  const { path, fill, fillRule } = getPathForPhase(phase);
  const bgFill = phase === MoonPhase.NewMoon ? 'transparent' : '#334155';

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill={bgFill} />
      <path d={path} fill={fill} fillRule={fillRule || 'nonzero'} filter="url(#glow)" />
    </svg>
  );
};

export default MoonPhaseIcon;
