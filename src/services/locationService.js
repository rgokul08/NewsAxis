/**
 * NewsAxis Location & Geolocation Service
 * Automatically detects user region/city for localized news & community blogs
 */

const LOCATION_STORAGE_KEY = 'newsaxis_user_location';

export const DEFAULT_LOCATION = {
  city: 'New Delhi',
  region: 'Delhi',
  country: 'India',
  countryCode: 'IN',
  latitude: 28.6139,
  longitude: 77.2090,
  temperature: '32°C',
  weatherText: 'Partly Cloudy'
};

class LocationService {
  constructor() {
    this.currentLocation = this.getSavedLocation() || DEFAULT_LOCATION;
    this.listeners = new Set();
  }

  getSavedLocation() {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  saveLocation(loc) {
    this.currentLocation = loc;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
      } catch (err) {
        console.warn('Failed to save location', err);
      }
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.currentLocation);
    }
  }

  async detectLocation() {
    // 1. Try Browser Geolocation API
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err),
            { timeout: 8000, maximumAge: 600000 }
          );
        });

        // Reverse geocode via BigDataCloud free client API
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
        );
        if (res.ok) {
          const data = await res.json();
          const detected = {
            city: data.city || data.locality || 'Nearby',
            region: data.principalSubdivision || data.region || 'Regional',
            country: data.countryName || 'India',
            countryCode: data.countryCode || 'IN',
            latitude: coords.latitude,
            longitude: coords.longitude,
            temperature: '31°C',
            weatherText: 'Clear'
          };
          this.saveLocation(detected);
          return detected;
        }
      } catch (geoErr) {
        console.log('Browser geolocation rejected or timed out, trying IP fallback', geoErr);
      }
    }

    // 2. IP-based fallback detection
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const ipLocation = {
          city: data.city || 'Chennai',
          region: data.region || 'Tamil Nadu',
          country: data.country_name || 'India',
          countryCode: data.country_code || 'IN',
          latitude: data.latitude,
          longitude: data.longitude,
          temperature: '32°C',
          weatherText: 'Humid & Sunny'
        };
        this.saveLocation(ipLocation);
        return ipLocation;
      }
    } catch (ipErr) {
      console.warn('IP location fallback failed', ipErr);
    }

    return this.currentLocation;
  }
}

export const locationService = new LocationService();
export default locationService;
