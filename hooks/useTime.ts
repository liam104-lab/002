
import { useState, useEffect } from 'react';

export const useTime = (updateInterval: number = 1000): Date => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => {
      clearInterval(timerId);
    };
  }, [updateInterval]);

  return currentTime;
};
