import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.startsWith('AIza');

interface MapDisplayProps {
  center?: { lat: number; lng: number };
  markers?: Array<{ id: string; position: { lat: number; lng: number }; title: string }>;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ 
  center = { lat: 17.3850, lng: 78.4867 }, // Default Hyderabad
  markers = [] 
}) => {
  if (!hasValidKey) {
    return (
      <div className="w-full h-[400px] bg-natural-surface rounded-[40px] flex items-center justify-center border border-dashed border-natural-border p-8 text-center">
        <div>
          <h3 className="text-sm font-bold text-natural-text mb-2">Maps Integration Available</h3>
          <p className="text-xs text-natural-muted leading-relaxed max-w-xs mx-auto">
            Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> to your secrets to enable live service tracking and maps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="w-full h-[400px] rounded-[40px] overflow-hidden shadow-xl border border-natural-border">
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          disableDefaultUI
        >
          {markers.map(m => (
            <AdvancedMarker key={m.id} position={m.position} title={m.title}>
              <Pin background="#FF6B6B" borderColor="#8B2F31" glyphColor="#fff" />
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
};

export default MapDisplay;
