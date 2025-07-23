// frontend/src/components/MapPanel.jsx
import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Marker,
  Popup,
  WMSTileLayer        // ← add this import
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SCHOOL_AIRPORTS } from '../data/airports';
import L from 'leaflet';
import airportIconPng from '../assets/airport-icon.png';

export default function MapPanel() {
  const [mode, setMode] = useState('VFR'); // or 'IFR'

  // Base layers for VFR vs IFR
  const baseLayers = [
    {
      name: 'VFR (TOPO)',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors, &copy; OpenTopoMap (CC‑BY‑SA)'
    },
    {
      name: 'IFR (Light Terrain)',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CartoDB'
    }
  ];

  const airportIcon = new L.Icon({
    iconUrl: airportIconPng,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ marginBottom: 8 }}>
        <label>
          <input
            type="radio"
            value="VFR"
            checked={mode === 'VFR'}
            onChange={() => setMode('VFR')}
          /> VFR
        </label>
        <label style={{ marginLeft: 16 }}>
          <input
            type="radio"
            value="IFR"
            checked={mode === 'IFR'}
            onChange={() => setMode('IFR')}
          /> IFR
        </label>
      </div>

      {/* Map */}
      <MapContainer
        center={[37.5, -1.5]}
        zoom={7}
        style={{ height: '80vh', width: '100%' }}  // make it taller
      >
        <LayersControl position="topright">

          {/* Base layers */}
          {baseLayers.map(({ name, url, attribution }) => (
            <LayersControl.BaseLayer
              key={name}
              name={name}
              checked={name.startsWith(mode)}
            >
              <TileLayer url={url} attribution={attribution} />
            </LayersControl.BaseLayer>
          ))}

          {/* Contour lines overlay */}
          <LayersControl.Overlay name="Contours">
            <WMSTileLayer
              url="https://ows.terrestris.de/osm/service"
              layers="SRTM30-Contour"
              format="image/png"
              transparent={true}
              attribution="&copy; SRTM (NASA) &copy; terrestris GmbH"
            />
          </LayersControl.Overlay>

          {/* Stub for future weather overlays */}
          <LayersControl.Overlay name="Weather Data">
            <div />
          </LayersControl.Overlay>
        </LayersControl>

        {/* Airport markers */}
        {SCHOOL_AIRPORTS.map(({ icao, name, coords }) => (
          <Marker key={icao} position={coords} icon={airportIcon}>
            <Popup>
              <strong>{icao}</strong><br />{name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
