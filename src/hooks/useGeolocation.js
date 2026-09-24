import { useState, useEffect } from 'react';
import { locationService, DEFAULT_LOCATION } from '../services/locationService';

export function useGeolocation() {
  const [location, setLocation] = useState(() => locationService.currentLocation || DEFAULT_LOCATION);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const unsubscribe = locationService.subscribe((newLoc) => {
      setLocation(newLoc);
    });

    // Auto-detect if not already detected
    if (!localStorage.getItem('newsaxis_user_location')) {
      requestDetection();
    }

    return () => unsubscribe();
  }, []);

  const requestDetection = async () => {
    setDetecting(true);
    try {
      const loc = await locationService.detectLocation();
      setLocation(loc);
    } finally {
      setDetecting(false);
    }
  };

  const manualSetLocation = (city, region) => {
    const loc = {
      ...location,
      city,
      region,
      country: 'India'
    };
    locationService.saveLocation(loc);
  };

  return {
    location,
    detecting,
    requestDetection,
    manualSetLocation
  };
}
