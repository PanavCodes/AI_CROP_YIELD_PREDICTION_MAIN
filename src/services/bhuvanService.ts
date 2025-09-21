// Bhuvan reverse geocoding service
// Tries backend proxy first: /api/geocode/bhuvan?lat=<lat>&lon=<lon>
// Falls back to OpenStreetMap Nominatim reverse geocoding if backend is unavailable

export interface AdminLocation {
  village?: string;
  district?: string;
  state?: string;
  source: 'bhuvan' | 'proxy' | 'nominatim' | 'mock';
}

function buildBhuvanUrl(lat: number, lon: number, apiBase: string, apiKey?: string): string {
  // Supports templated base like: "https://.../reverse?lat={lat}&lon={lon}&key={key}"
  if (apiBase.includes('{lat}') || apiBase.includes('{lon}') || apiBase.includes('{key}')) {
    return apiBase
      .replace('{lat}', encodeURIComponent(String(lat)))
      .replace('{lon}', encodeURIComponent(String(lon)))
      .replace('{key}', encodeURIComponent(String(apiKey || '')));
  }
  // Otherwise append common query params
  const url = new URL(apiBase);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  if (apiKey) url.searchParams.set('api_key', apiKey);
  return url.toString();
}

function parseAdminResponse(data: any): Pick<AdminLocation, 'village' | 'district' | 'state'> {
  // Flexible parsing based on common response shapes
  if (!data) return {};
  // Direct fields
  const v = data.village || data.VILLAGE || data.vill || data.p_village;
  const d = data.district || data.DISTRICT || data.dist || data.p_district;
  const s = data.state || data.STATE || data.st || data.p_state;
  if (v || d || s) return { village: v, district: d, state: s };
  // Nested address
  const a = data.address;
  if (a) {
    return {
      village: a.village || a.hamlet,
      district: a.city || a.town || a.village || a.county,
      state: a.state,
    };
  }
  return {};
}

export async function reverseGeocodeAdmin(lat: number, lon: number): Promise<AdminLocation> {
  const API_BASE = (import.meta as any).env?.VITE_BHUVAN_API_BASE as string | undefined;
  const API_KEY = (import.meta as any).env?.VITE_BHUVAN_API_KEY as string | undefined;

  // 1) Try direct Bhuvan call if configured
  if (API_BASE) {
    try {
      const url = buildBhuvanUrl(lat, lon, API_BASE, API_KEY);
      const res = await fetch(url, {
        headers: API_KEY
          ? {
              // Try common header names; backend may ignore if not used
              'x-api-key': API_KEY,
              Authorization: `Bearer ${API_KEY}`,
            }
          : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = parseAdminResponse(data);
        if (parsed.village || parsed.district || parsed.state) {
          return { ...parsed, source: 'bhuvan' };
        }
      }
    } catch (e) {
      // ignore and try proxy
    }
  }

  // 2) Try backend proxy to Bhuvan if available
  try {
    const proxyUrl = `/api/geocode/bhuvan?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      const parsed = parseAdminResponse(data);
      if (parsed.village || parsed.district || parsed.state) {
        return { ...parsed, source: 'proxy' };
      }
    }
  } catch (e) {
    // ignore and fall back
  }

  // 3) Fallback: Nominatim reverse geocoding (works without keys)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      return {
        village: address.village || address.hamlet,
        district: address.city || address.town || address.village || address.county,
        state: address.state,
        source: 'nominatim',
      };
    }
  } catch (e) {
    // ignore
  }

  // 4) If all else fails, return empty admin with mock source
  return { source: 'mock' };
}

export default { reverseGeocodeAdmin };
