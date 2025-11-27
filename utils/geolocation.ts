/**
 * Geolocation utility functions
 * Uses free, no-key services: Nominatim (OSM) + REST Countries
 */

/**
 * Returns the ISO 4217 currency code (e.g. "USD", "EUR") for a lat/lon.
 * Uses only free, no-key services: Nominatim (OSM) + REST Countries.
 */
export async function getCurrencyCode(lat: number, lon: number): Promise<string> {
  // 1) Reverse geocode to get country code (ISO 3166-1 alpha-2)
  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("lat", String(lat));
  nominatimUrl.searchParams.set("lon", String(lon));
  nominatimUrl.searchParams.set("zoom", "3");
  nominatimUrl.searchParams.set("addressdetails", "1");

  const nominatimRes = await fetch(nominatimUrl.toString(), {
    headers: {
      // Nominatim requires a valid identifying User-Agent
      "User-Agent": "finance-app/1.0 (contact@example.com)"
    }
  });

  if (!nominatimRes.ok) {
    throw new Error(`Nominatim request failed: ${nominatimRes.status} ${nominatimRes.statusText}`);
  }

  const nominatimData = await nominatimRes.json();
  
  // Try multiple ways to get country code from Nominatim response
  let countryCode2 = 
    nominatimData?.address?.country_code ||
    nominatimData?.address?.ISO3166_1_alpha_2;

  if (!countryCode2 && nominatimData?.address?.ISO3166_1_alpha_3) {
    // If we only have alpha-3, we can't use it directly, but some APIs might accept it
    // For now, we'll just log it and fail
  }

  if (!countryCode2) {
    throw new Error("Could not determine country code from coordinates.");
  }

  // Ensure country code is uppercase (ISO 3166-1 alpha-2 should be uppercase)
  countryCode2 = String(countryCode2).toUpperCase();

  // 2) Use REST Countries to map country code → currency
  // Try with fields parameter first, then fallback to full response
  let restUrl = `https://restcountries.com/v3.1/alpha/${countryCode2}?fields=currencies`;
  let restRes = await fetch(restUrl);

  if (!restRes.ok) {
    // Try without fields parameter as fallback
    restUrl = `https://restcountries.com/v3.1/alpha/${countryCode2}`;
    restRes = await fetch(restUrl);
    
    if (!restRes.ok) {
      throw new Error(`REST Countries request failed: ${restRes.status} ${restRes.statusText}`);
    }
  }

  const restData = await restRes.json();
  
  // REST Countries v3.1 returns an array, but handle both array and object responses
  let countryData;
  if (Array.isArray(restData)) {
    if (restData.length === 0) {
      throw new Error(`No country data found for code: ${countryCode2}`);
    }
    countryData = restData[0];
  } else {
    countryData = restData;
  }

  const currencies = countryData?.currencies;

  if (!currencies || typeof currencies !== "object" || Array.isArray(currencies)) {
    throw new Error(`No currency information found for country code: ${countryCode2}`);
  }

  const currencyCodes = Object.keys(currencies);
  if (currencyCodes.length === 0) {
    throw new Error("No currency codes listed for this country.");
  }

  // In most cases there is only one; use the first one as the default.
  return currencyCodes[0];
}

/**
 * Get user's current location and return currency code
 * Returns null if geolocation is not available or user denies permission
 */
export async function getCurrencyFromGeolocation(): Promise<string | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const currencyCode = await getCurrencyCode(
            position.coords.latitude,
            position.coords.longitude
          );
          resolve(currencyCode);
        } catch {
          resolve(null);
        }
      },
      () => {
        resolve(null);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
      }
    );
  });
}

