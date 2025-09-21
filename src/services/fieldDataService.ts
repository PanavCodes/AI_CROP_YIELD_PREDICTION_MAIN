// Service to ingest field location and fetch aggregated admin/LULC/soil data
// This calls the backend API if available; otherwise it returns a safe mock.

export type GeoJSONPoint = {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
};

export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: [number, number][][]; // rings
};

export type FieldGeometry = GeoJSONPoint | GeoJSONPolygon;

export interface FieldAggregationResult {
  field_id?: string;
  location?: {
    village?: string;
    district?: string;
    state?: string;
    confidence?: number;
    source?: string;
    fetched_at?: string;
  };
  land_use?: {
    class?: string;
    coverage_percent?: number;
    source?: string;
    confidence?: number;
  };
  soil?: {
    soil_type?: string;
    soil_depth?: string;
    ph?: number;
    organic_carbon?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    source?: string;
    confidence?: number;
  };
}

export interface IngestFieldLocationRequest {
  field_id?: string;
  geometry: FieldGeometry;
}

export async function fetchAggregatedFieldData(
  req: IngestFieldLocationRequest
): Promise<FieldAggregationResult> {
  try {
    const res = await fetch('/api/fields/ingest-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (res.ok) {
      return await res.json();
    }

    // Non-OK response, fall back to mock
    console.warn('Backend unavailable for /api/fields/ingest-location, using mock');
    return buildMockAggregation(req);
  } catch (e) {
    console.warn('Error calling /api/fields/ingest-location, using mock:', e);
    return buildMockAggregation(req);
  }
}

function buildMockAggregation(req: IngestFieldLocationRequest): FieldAggregationResult {
  const [lng, lat] = req.geometry.type === 'Point'
    ? (req.geometry as GeoJSONPoint).coordinates
    : (req.geometry as GeoJSONPolygon).coordinates[0][0];

  return {
    field_id: req.field_id,
    location: {
      village: undefined,
      district: 'Sample District',
      state: 'Sample State',
      source: 'mock',
      confidence: 0.7,
      fetched_at: new Date().toISOString(),
    },
    land_use: {
      class: 'Cropland',
      coverage_percent: 85.3,
      source: 'mock',
      confidence: 0.6,
    },
    soil: {
      soil_type: 'Loamy',
      soil_depth: '100-150 cm',
      ph: 6.5,
      organic_carbon: 0.8,
      nitrogen: 85,
      phosphorus: 40,
      potassium: 42,
      source: 'mock',
      confidence: 0.6,
    },
  };
}

export default {
  fetchAggregatedFieldData,
};
