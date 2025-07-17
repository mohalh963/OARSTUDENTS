import React from 'react';
import './App.css';
import logo from './assets/logo.png';        // your school logo
import MapPanel from './components/MapPanel';

function App() {
  return (
    <div className="App">
      <header className="site-header">
        <img src={logo} alt="OAR STUDENTS" className="site-logo" />
        <h1 className="site-title">OAR STUDENTS</h1>
        <nav className="site-nav">
          <ul>
            <li><a href="/">Auto OFP</a></li>
            <li><a href="/legacy/index.html" target="_blank" rel="noopener noreferrer">
              Manual OFP
            </a></li>
            {/* add more links here as you build other sections */}
          </ul>
        </nav>
      </header>

      <main className="page-content">
        <h2 className="page-title">Auto OFP – Interactive Map</h2>
        <h3> STILL IN DEVELOPMENT, YOU CAN USE MANUAL OFP </h3>
        <MapPanel />
      </main>
    </div>
  );
}

export default App;
