// frontend/src/components/MapPanel.jsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SCHOOL_AIRPORTS } from '../data/airports';
import L from 'leaflet';
import airportIconPng from '../assets/airport-icon.png';

export default function MapPanel() {
  const [mode, setMode] = useState('VFR'); // or 'IFR'

  // Two base‐layers for IFR vs VFR
  const baseLayers = [
    {
      name: 'VFR (OSM)',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
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
          <Marker key={icao} position={coords} icon={airportIcon}>
          <Popup>{icao}: {name}</Popup>
        </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
