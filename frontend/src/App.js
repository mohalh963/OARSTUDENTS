import React from 'react';
import './App.css';
import MapPanel from './components/MapPanel';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>OFP Calculator – Map</h1>
      </header>
      <main style={{ padding: '20px' }}>
        <MapPanel />
      </main>
    </div>
  );
}

export default App;

