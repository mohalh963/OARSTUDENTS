// frontend/src/components/MapPanel.jsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SCHOOL_AIRPORTS } from '../data/airports';

export default function MapPanel() {
  const [mode, setMode] = useState('VFR'); // or 'IFR'

  // Two base‐layers for IFR vs VFR
  const baseLayers = [
    {
      name: 'VFR (OSM)',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
    {
      name: 'IFR (Aeronautical)',
      url: 'https://tiles.openaip.net/geo/tiles/{z}/{x}/{y}.png', // example aeronautical tiles
    }
  ];

  return (
    <div>
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

      <MapContainer
        center={[37.5, -1.5]}
        zoom={7}
        style={{ height: '500px', width: '100%' }}
      >
        <LayersControl position="topright">
          {baseLayers.map(({ name, url }) => (
            <LayersControl.BaseLayer
              key={name}
              checked={name.startsWith(mode)}
              name={name}
            >
              <TileLayer url={url} />
            </LayersControl.BaseLayer>
          ))}

          {/* Stub for future weather overlays */}
          <LayersControl.Overlay name="Weather Data">
            <div /> 
          </LayersControl.Overlay>
        </LayersControl>

        {SCHOOL_AIRPORTS.map(({ icao, name, coords }) => (
          <Marker key={icao} position={coords}>
            <Popup>
              <strong>{icao}</strong><br />{name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
