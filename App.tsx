import React, { useState, useEffect, useCallback, useRef } from 'react';
import SunCalc from 'suncalc';
import { useTime } from './hooks/useTime';
import { getMoonPhase } from './services/celestialService';
import CelestialBody from './components/CelestialBody';
import MoonPhaseDisplay from './components/MoonPhaseDisplay';

// Interfaces for typed celestial data
interface Location {
  latitude: number;
  longitude: number;
}
interface CelestialInfo {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  moonrise: Date | null;
  moonset: Date | null;
  moonIllumination: number;
  sunPosition: { altitude: number; azimuth: number };
  moonPosition: { altitude: number; azimuth: number; parallacticAngle: number };
}


const celestialFacts = {
  Sun: [
    "The Sun accounts for 99.86% of the mass in the solar system.",
    "Sunlight takes about 8 minutes and 20 seconds to reach Earth.",
    "The Sun's surface temperature is around 5,500 degrees Celsius.",
    "The Sun is a middle-aged star, about 4.6 billion years old."
  ],
  Moon: [
    "The Moon is Earth's only natural satellite.",
    "The Moon is slowly moving away from Earth at a rate of about 3.8 cm per year.",
    "The same side of the Moon always faces Earth.",
    "The Moon has quakes, just like Earth, called 'moonquakes'."
  ]
};

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;

const playAlarmSound = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (oscillator) {
        oscillator.stop();
    }
    oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.5);
    
    oscillator.start();
};

const stopAlarmSound = () => {
    if (oscillator && audioContext) {
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
        oscillator.stop(audioContext.currentTime + 0.5);
        oscillator = null;
    }
};

const App: React.FC = () => {
  const now = useTime();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [celestialInfo, setCelestialInfo] = useState<CelestialInfo | null>(null);
  const [activeFact, setActiveFact] = useState<{ body: 'Sun' | 'Moon'; text: string; angle: number } | null>(null);
  const [alarmTime, setAlarmTime] = useState<Date | null>(() => {
    const savedAlarm = localStorage.getItem('sunriseAlarm');
    return savedAlarm ? new Date(savedAlarm) : null;
  });
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  
  const clockRef = useRef<HTMLDivElement>(null);
  const interactionState = useRef({
    isPinching: false,
    initialPinchDist: 0,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    isInteracting: false,
  });

  // Request geolocation on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Location access denied. Displaying generic data.");
        // Fallback to a default location
        setLocation({ latitude: 51.5074, longitude: -0.1278 }); 
      }
    );
  }, []);

  // Calculate celestial data when location or time changes
  useEffect(() => {
    if (location) {
      const times = SunCalc.getTimes(now, location.latitude, location.longitude);
      const moonTimes = SunCalc.getMoonTimes(now, location.latitude, location.longitude);
      const sunPos = SunCalc.getPosition(now, location.latitude, location.longitude);
      const moonPos = SunCalc.getMoonPosition(now, location.latitude, location.longitude);
      const moonIllum = SunCalc.getMoonIllumination(now);
      
      setCelestialInfo({
        sunrise: times.sunrise,
        sunset: times.sunset,
        solarNoon: times.solarNoon,
        moonrise: moonTimes.rise || null,
        moonset: moonTimes.set || null,
        moonIllumination: moonIllum.fraction,
        sunPosition: sunPos,
        moonPosition: moonPos,
      });
    }
  }, [now, location]);

  useEffect(() => {
    if (activeFact) {
      const timer = setTimeout(() => setActiveFact(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [activeFact]);

  // Alarm logic
  useEffect(() => {
    if (alarmTime && !isAlarmRinging) {
        if (now.getHours() === alarmTime.getHours() && now.getMinutes() === alarmTime.getMinutes() && now.getSeconds() === 0) {
            setIsAlarmRinging(true);
            playAlarmSound();
        }
    }
  }, [now, alarmTime, isAlarmRinging]);

  const getSkyGradient = (sunAltitude: number): string => {
    const altDegrees = sunAltitude * (180 / Math.PI);
    if (altDegrees > 5) return 'from-sky-500 to-blue-700'; // Daytime
    if (altDegrees > -5) return 'from-indigo-300 via-orange-400 to-red-500'; // Sunrise/Sunset
    return 'from-gray-900 to-black'; // Nighttime
  };

  const moonPhaseInfo = getMoonPhase(now);
  
  // Calculate positions for rendering
  const sunAzimuthDegrees = celestialInfo ? celestialInfo.sunPosition.azimuth * (180 / Math.PI) : 0;
  const sunAngle = sunAzimuthDegrees + 180; // Map azimuth to 360 rotation
  const sunAltitudeOffset = celestialInfo ? (1 - Math.sin(celestialInfo.sunPosition.altitude)) * 50 : 50; // 0% (high) to 100% (low)

  const moonAzimuthDegrees = celestialInfo ? celestialInfo.moonPosition.azimuth * (180 / Math.PI) : 0;
  const moonAngle = moonAzimuthDegrees + 180;
  const moonAltitudeOffset = celestialInfo ? (1 - Math.sin(celestialInfo.moonPosition.altitude)) * 50 : 50;

  const handleBodyClick = (body: 'Sun' | 'Moon') => {
    const facts = celestialFacts[body];
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    const angle = body === 'Sun' ? sunAngle : moonAngle;
    setActiveFact({ body, text: randomFact, angle });
  };
  
  const setSunriseAlarm = useCallback(() => {
    if (!celestialInfo) return;
    const alarmDate = celestialInfo.sunrise;
    if (alarmDate < new Date()) {
      // If sunrise has already passed today, set it for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTimes = SunCalc.getTimes(tomorrow, location!.latitude, location!.longitude);
      setAlarmTime(tomorrowTimes.sunrise);
      localStorage.setItem('sunriseAlarm', tomorrowTimes.sunrise.toISOString());
    } else {
      setAlarmTime(alarmDate);
      localStorage.setItem('sunriseAlarm', alarmDate.toISOString());
    }
  }, [celestialInfo, location]);

  const clearAlarm = useCallback(() => {
    setAlarmTime(null);
    localStorage.removeItem('sunriseAlarm');
  }, []);
  
  const dismissAlarm = () => {
    setIsAlarmRinging(false);
    stopAlarmSound();
    // Set alarm for the next day automatically
    setSunriseAlarm();
  };

  const resetTransform = () => {
    interactionState.current.isInteracting = false;
    setTransform({ scale: 1, x: 0, y: 0 });
  };
  
  // All interaction handlers (zoom/pan) remain the same
  const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); interactionState.current.isInteracting = true; const { deltaY } = e; const zoomFactor = 0.05; setTransform(prev => ({ ...prev, scale: Math.max(1, Math.min(4, prev.scale - deltaY * zoomFactor * prev.scale)) })); };
  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); interactionState.current.isInteracting = true; interactionState.current.isPanning = true; interactionState.current.panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y }; };
  const handleMouseMove = (e: React.MouseEvent) => { if (!interactionState.current.isPanning) return; e.preventDefault(); setTransform(prev => ({ ...prev, x: e.clientX - interactionState.current.panStart.x, y: e.clientY - interactionState.current.panStart.y })); };
  const handleMouseUpOrLeave = () => { interactionState.current.isPanning = false; interactionState.current.isInteracting = false; };
  const handleTouchStart = (e: React.TouchEvent) => { interactionState.current.isInteracting = true; if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; interactionState.current.initialPinchDist = Math.sqrt(dx * dx + dy * dy); interactionState.current.isPinching = true; } else if (e.touches.length === 1) { interactionState.current.isPanning = true; interactionState.current.panStart = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y, }; } };
  const handleTouchMove = (e: React.TouchEvent) => { if (interactionState.current.isPinching && e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; const newDist = Math.sqrt(dx * dx + dy * dy); const scaleChange = newDist / interactionState.current.initialPinchDist; setTransform(prev => ({ ...prev, scale: Math.max(1, Math.min(4, prev.scale * scaleChange)) })); } else if (interactionState.current.isPanning && e.touches.length === 1) { setTransform(prev => ({ ...prev, x: e.touches[0].clientX - interactionState.current.panStart.x, y: e.touches[0].clientY - interactionState.current.panStart.y })); } };
  const handleTouchEnd = () => { interactionState.current.isPinching = false; interactionState.current.isPanning = false; interactionState.current.isInteracting = false; };

  if (!celestialInfo) {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-900 text-white">
            <h1 className="text-2xl font-bold mb-4">Celestial Clock</h1>
            <p>{locationError || "Awaiting location access to personalize your sky..."}</p>
        </main>
    );
  }

  const isZoomed = transform.scale !== 1 || transform.x !== 0 || transform.y !== 0;

  return (
    <main className={`relative flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br ${getSkyGradient(celestialInfo.sunPosition.altitude)} text-white transition-all duration-1000 overflow-hidden`}>
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10"></div>
      
      {isAlarmRinging && (
        <div className="absolute inset-0 bg-amber-400/30 z-40 flex items-center justify-center animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
          <div className="text-center p-8 bg-black/50 rounded-2xl backdrop-blur-lg">
            <h2 className="text-4xl font-bold mb-2">Good Morning!</h2>
            <p className="text-lg mb-6">The sun is rising at your location.</p>
            <button onClick={dismissAlarm} className="px-6 py-2 bg-white/90 text-black font-bold rounded-full hover:bg-white transition-transform transform hover:scale-105">Dismiss</button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-4 z-10 w-full max-w-7xl">
        <div
          ref={clockRef}
          className="relative w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] flex items-center justify-center overflow-hidden touch-none"
          style={{ cursor: interactionState.current.isPanning ? 'grabbing' : 'grab' }}
          onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        >
            <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transition: interactionState.current.isInteracting ? 'none' : 'transform 0.2s ease-out' }}
            >
              <div className="absolute w-full h-full border border-white/20 rounded-full" style={{transform: `scaleY(${1 - sunAltitudeOffset/100})`, top: `${sunAltitudeOffset/2}%`}}></div>

              <CelestialBody name="Sun" angle={sunAngle} verticalOffset={sunAltitudeOffset} isAboveHorizon={celestialInfo.sunPosition.altitude > 0} onClick={() => handleBodyClick('Sun')} />
              <CelestialBody name="Moon" angle={moonAngle} verticalOffset={moonAltitudeOffset} isAboveHorizon={celestialInfo.moonPosition.altitude > 0} phase={moonPhaseInfo.phase} onClick={() => handleBodyClick('Moon')} isDay={celestialInfo.sunPosition.altitude > -0.017} />

              {activeFact && (
              <div
                  className="absolute w-[175px] h-[175px] sm:w-[250px] sm:h-[250px] pointer-events-none"
                  style={{ transform: `rotate(${activeFact.angle}deg) translateY(-${activeFact.body === 'Sun' ? sunAltitudeOffset : moonAltitudeOffset}%) translateY(-100%) rotate(${-activeFact.angle}deg)` }}
              >
                      <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-48 p-3 bg-black/30 rounded-lg backdrop-blur-md text-center text-sm transition-all duration-300 ${activeFact ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                          {activeFact.text}
                      </div>
              </div>
              )}

              <div className="z-10 text-center">
                  <h1 className="text-6xl sm:text-8xl font-bold tracking-wider text-white/90">
                      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </h1>
                  <p className="text-lg sm:text-xl text-white/70">
                      {now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
              </div>
            </div>
             {isZoomed && (<button onClick={resetTransform} className="absolute bottom-4 right-4 z-20 px-3 py-1.5 text-xs bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all">Reset View</button>)}
        </div>
      
        <div className="flex flex-col gap-6 w-full max-w-sm">
            <MoonPhaseDisplay info={{...moonPhaseInfo, illumination: celestialInfo.moonIllumination}} />

            <div className="p-4 bg-black/20 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white/90 mb-3">Cosmic Briefing</h3>
                <ul className="space-y-2 text-white/80">
                    <li className="flex justify-between text-sm"><span>Sunrise</span><span className="font-medium text-white/60">{celestialInfo.sunrise.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></li>
                    <li className="flex justify-between text-sm"><span>Sunset</span><span className="font-medium text-white/60">{celestialInfo.sunset.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></li>
                    {celestialInfo.moonrise && <li className="flex justify-between text-sm"><span>Moonrise</span><span className="font-medium text-white/60">{celestialInfo.moonrise.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></li>}
                    {celestialInfo.moonset && <li className="flex justify-between text-sm"><span>Moonset</span><span className="font-medium text-white/60">{celestialInfo.moonset.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></li>}
                </ul>
                 {locationError && <p className="text-xs text-amber-300 mt-2">{locationError}</p>}
            </div>
            
            <div className="p-4 bg-black/20 rounded-lg backdrop-blur-sm text-center">
                {alarmTime ? (
                     <div>
                        <p className="text-lg">Sunrise alarm set for <span className="font-bold">{alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                        <button onClick={clearAlarm} className="mt-2 text-sm text-amber-300 hover:underline">Clear Alarm</button>
                    </div>
                ) : (
                    <button onClick={setSunriseAlarm} className="w-full px-6 py-3 bg-amber-400/80 text-black font-bold rounded-lg hover:bg-amber-400 transition-all transform hover:scale-105">
                        Set True Sunrise Alarm
                    </button>
                )}
            </div>
        </div>
      </div>

       <footer className="absolute bottom-4 text-xs text-white/50 z-20">
        Celestial Clock - Your personal connection to the cosmos
      </footer>
    </main>
  );
};

export default App;