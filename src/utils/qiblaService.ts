import { Qibla, Coordinates } from 'adhan';
import { findCityByName } from '../data/citiesData';

export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
  name: 'Al-Masjid Al-Haram, Makkah Al-Mukarramah',
  arabicName: 'المسجد الحرام، مكة المكرمة',
};

/**
 * Normalizes an angle in degrees into the range [0, 360)
 */
export function normalizeAngle(degrees: number): number {
  let angle = degrees % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Calculates the shortest signed angular difference (target - current) in range [-180, 180]
 */
export function getShortestAngleDiff(target: number, current: number): number {
  let diff = (target - current + 180) % 360 - 180;
  return diff < -180 ? diff + 360 : diff;
}

/**
 * Calculates the True Qibla Bearing (clockwise angle from True North)
 * using Great Circle spherical trigonometry verified against adhan library.
 */
export function calculateTrueQibla(latitude: number, longitude: number): number {
  try {
    const coords = new Coordinates(latitude, longitude);
    const qiblaAngle = Qibla(coords);
    if (!isNaN(qiblaAngle)) {
      return normalizeAngle(qiblaAngle);
    }
  } catch {
    // Fallback Great Circle calculation
  }

  const phi1 = (latitude * Math.PI) / 180;
  const lambda1 = (longitude * Math.PI) / 180;
  const phi2 = (KAABA_COORDINATES.latitude * Math.PI) / 180;
  const lambda2 = (KAABA_COORDINATES.longitude * Math.PI) / 180;

  const dLambda = lambda2 - lambda1;
  const y = Math.sin(dLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLambda);

  const qiblaRad = Math.atan2(y, x);
  return normalizeAngle((qiblaRad * 180) / Math.PI);
}

/**
 * Calculates Great-Circle distance to the Holy Kaaba in Makkah (km and miles)
 */
export function calculateDistanceToKaaba(
  latitude: number,
  longitude: number
): { km: number; miles: number } {
  const R = 6371; // Earth mean radius in km
  const phi1 = (latitude * Math.PI) / 180;
  const phi2 = (KAABA_COORDINATES.latitude * Math.PI) / 180;
  const deltaPhi = ((KAABA_COORDINATES.latitude - latitude) * Math.PI) / 180;
  const deltaLambda = ((KAABA_COORDINATES.longitude - longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const km = Math.round(R * c);
  const miles = Math.round(km * 0.621371);
  return { km, miles };
}

/**
 * Returns cardinal point code, English label, and Arabic name for any degree
 */
export function getCompassHeadingName(heading: number): {
  code: string;
  name: string;
  arabic: string;
} {
  const normalized = normalizeAngle(heading);
  const directions = [
    { code: 'N', name: 'North', arabic: 'شمال' },
    { code: 'NNE', name: 'North-Northeast', arabic: 'شمال شمال شرق' },
    { code: 'NE', name: 'Northeast', arabic: 'شمال شرق' },
    { code: 'ENE', name: 'East-Northeast', arabic: 'شرق شمال شرق' },
    { code: 'E', name: 'East', arabic: 'شرق' },
    { code: 'ESE', name: 'East-Southeast', arabic: 'شرق جنوب شرق' },
    { code: 'SE', name: 'Southeast', arabic: 'جنوب شرق' },
    { code: 'SSE', name: 'South-Southeast', arabic: 'جنوب جنوب شرق' },
    { code: 'S', name: 'South', arabic: 'جنوب' },
    { code: 'SSW', name: 'South-Southwest', arabic: 'جنوب جنوب غرب' },
    { code: 'SW', name: 'Southwest', arabic: 'جنوب غرب' },
    { code: 'WSW', name: 'West-Southwest', arabic: 'غرب جنوب غرب' },
    { code: 'W', name: 'West', arabic: 'غرب' },
    { code: 'WNW', name: 'West-Northwest', arabic: 'غرب شمال غرب' },
    { code: 'NW', name: 'Northwest', arabic: 'شمال غرب' },
    { code: 'NNW', name: 'North-Northwest', arabic: 'شمال شمال غرب' },
  ];

  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Resolves location name to geographical coordinates
 */
export function resolveCoordinates(
  locationName: string = 'Makkah',
  customLat?: number,
  customLng?: number
): { lat: number; lng: number; displayName: string; isGPS: boolean } {
  if (typeof customLat === 'number' && typeof customLng === 'number' && !isNaN(customLat) && !isNaN(customLng)) {
    return {
      lat: customLat,
      lng: customLng,
      displayName: locationName || 'Current GPS Location',
      isGPS: true,
    };
  }

  const matchedCity = findCityByName(locationName);
  if (matchedCity) {
    return {
      lat: matchedCity.latitude,
      lng: matchedCity.longitude,
      displayName: `${matchedCity.name}, ${matchedCity.country}`,
      isGPS: false,
    };
  }

  // Default to Makkah
  return {
    lat: KAABA_COORDINATES.latitude,
    lng: KAABA_COORDINATES.longitude,
    displayName: 'Makkah, Saudi Arabia',
    isGPS: false,
  };
}

/**
 * Plays a soft, harmonic chime when the user's device aligns directly with the Kaaba
 */
export function playAlignmentChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Golden harmonic chord: 528 Hz (Love/Peace) + 792 Hz
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(792, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.85);
    osc2.stop(now + 0.85);

    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 1000);
  } catch {
    // AudioContext blocked or not allowed
  }
}

/**
 * Triggers light haptic feedback when aligned with Qibla
 */
export function triggerAlignmentHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([35, 40, 35]);
    }
  } catch {
    // Haptic ignored
  }
}
