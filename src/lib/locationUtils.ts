// Utility functions for location-based calculations and search

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get coordinates from a location string using OpenStreetMap Nominatim API
 */
export async function getCoordinatesFromLocation(
  location: string
): Promise<{ lat: number; lon: number; display_name: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "LifeLink-BloodBank-Search/1.0",
        },
      }
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
}

/**
 * Get nearby cities based on a location
 * Returns an array of nearby city names to expand search
 */
export function getNearbySearchTerms(location: string): string[] {
  const lowerLocation = location.toLowerCase();
  const terms = [lowerLocation];

  // Map of locations to nearby areas
  const nearbyMap: Record<string, string[]> = {
    vijayawada: [
      "bhimavaram",
      "rajamundry",
      "visakhapatnam",
      "guntur",
      "krishna",
      "andhra pradesh",
    ],
    bhimavaram: ["vijayawada", "rajamundry", "krishna district"],
    rajamundry: ["bhimavaram", "vijayawada", "east godavari"],
    visakhapatnam: ["vijayawada", "guntur", "vizag", "andhra pradesh"],
    guntur: ["vijayawada", "ongole", "guntur district"],
    ongole: ["guntur", "nellore", "prakasam district"],
    nellore: ["ongole", "tirupati", "chittoor"],
    tirupati: ["nellore", "chittoor", "andhra pradesh"],
    hyderabad: ["secunderabad", "telangana"],
    bangalore: ["karnataka", "bengaluru"],
  };

  // Add nearby cities if found
  const nearby = nearbyMap[lowerLocation];
  if (nearby) {
    terms.push(...nearby);
  }

  return terms;
}

/**
 * Parse location string to extract city, district, and state
 */
export function parseLocation(location: string): {
  city: string;
  district?: string;
  state?: string;
} {
  const parts = location.split(",").map((p) => p.trim());

  return {
    city: parts[0] || "",
    district: parts[1],
    state: parts[2],
  };
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)}m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Legacy: Simulate distance for mock data
 * Used when actual coordinates aren't available
 */
export function generateMockDistance(index: number, seed: number): string {
  const distance = 1.2 + index * 0.7 + ((seed * 11) % 10) / 10;
  return formatDistance(distance);
}
