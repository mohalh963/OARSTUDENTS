// Aircraft data (converted from liters to USG: 1 liter = 0.264172 USG)
const aircraftData = {
  'DV20': {
      name: 'Diamond DV20',
      climb: 6.0,
      cruise: 6.0,
      descent: 6.0
  },
  'P208': {
      name: 'Tecnam P208',
      climb: 26 * 0.264172,  // 6.87 USG/h
      cruise: 15 * 0.264172, // 3.96 USG/h
      descent: 12 * 0.264172 // 3.17 USG/h
  }
};

document.addEventListener('DOMContentLoaded', function() {
  const aircraftSelect = document.getElementById('aircraftType');
  const aircraftInfo = document.getElementById('aircraftInfo');
  
  // Show/hide aircraft info based on selection
  aircraftSelect.addEventListener('change', function() {
      if (this.value && aircraftData[this.value]) {
          const aircraft = aircraftData[this.value];
          aircraftInfo.innerHTML = `
              <p><strong>${aircraft.name} Fuel Consumption:</strong></p>
              <p>Climb: ${roundUpToNearestTenth(aircraft.climb).toFixed(1)} USG/hour</p>
              <p>Cruise: ${roundUpToNearestTenth(aircraft.cruise).toFixed(1)} USG/hour</p>
              <p>Descent: ${roundUpToNearestTenth(aircraft.descent).toFixed(1)} USG/hour</p>
          `;
      } else {
          aircraftInfo.innerHTML = '';
      }
  });
  
  // Add leg button
  document.getElementById('addLegBtn').addEventListener('click', addLeg);
  
  // Calculate button
  document.getElementById('calculateBtn').addEventListener('click', calculate);
  
  // Auto-detect phase based on altitude changes
  document.addEventListener('input', function(e) {
      if (e.target.classList.contains('altitude')) {
          autoDetectPhase(e.target);
      }
  });
});

function addLeg() {
  const tbody = document.querySelector('#legsTable tbody');
  const template = tbody.querySelector('tr');
  const newRow = template.cloneNode(true);
  
  // Clear all input values
  newRow.querySelectorAll('input').forEach(input => {
      input.value = '';
      if (input.type === 'number') {
          input.value = '0';
      }
  });
  
  // Set phase to cruise by default
  newRow.querySelector('.phase').value = 'cruise';
  
  tbody.appendChild(newRow);
}

function autoDetectPhase(altitudeInput) {
  const row = altitudeInput.closest('tr');
  const phaseSelect = row.querySelector('.phase');
  const altitude = parseFloat(altitudeInput.value) || 0;
  
  // Find previous leg's altitude
  const allRows = document.querySelectorAll('#legsTable tbody tr');
  const currentIndex = Array.from(allRows).indexOf(row);
  
  if (currentIndex > 0) {
      const prevAltInput = allRows[currentIndex - 1].querySelector('.altitude');
      const prevAltitude = parseFloat(prevAltInput.value) || 0;
      
      if (altitude > prevAltitude) {
          phaseSelect.value = 'climb';
      } else if (altitude < prevAltitude) {
          phaseSelect.value = 'descent';
      } else {
          phaseSelect.value = 'cruise';
      }
  }
}

function roundUpToNearestTenth(value) {
  return Math.ceil(value * 10) / 10;
}

function getFuelConsumption(aircraft, phase) {
  if (!aircraftData[aircraft]) return 0;
  
  const consumption = aircraftData[aircraft][phase];
  return roundUpToNearestTenth(consumption);
}

function calculate() {
  const aircraft = document.getElementById('aircraftType').value;
  const rows = document.querySelectorAll('#legsTable tbody tr');
  const resultsBody = document.querySelector('#resultsTable tbody');
  resultsBody.innerHTML = '';
  
  // Validate aircraft selection
  if (!aircraft) {
      alert('Please select an aircraft type.');
      return;
  }
  
  let totalTripFuel = 0;
  const warnings = [];
  
  // Global settings
  const altDist      = parseFloat(document.getElementById('alternateDistance').value) || 0;
  const additional   = parseFloat(document.getElementById('additionalFuel').value) || 0;
  const extra        = parseFloat(document.getElementById('extraFuel').value) || 0;
  const taxi         = parseFloat(document.getElementById('taxiFuel').value) || 0;
  
  rows.forEach((row, i) => {
      const cells = row.querySelectorAll('input, select');
      const startingPoint = cells[0].value.trim() || 'N/A';
      const endingPoint   = cells[1].value.trim() || 'N/A';
      const alt           = parseFloat(cells[2].value)     || 0;
      const windDir       = parseFloat(cells[3].value);
      const windSpd       = parseFloat(cells[4].value);
      const temp          = parseFloat(cells[5].value);
      const ias           = parseFloat(cells[6].value);
      const tc            = parseFloat(cells[7].value);
      const variation     = parseFloat(cells[8].value)     || 0;
      const dist          = parseFloat(cells[9].value);
      const phase         = cells[10].value;
      
      // Get fuel consumption based on aircraft and phase
      const fuelPerHour = getFuelConsumption(aircraft, phase);
      
      // Row validation
      const rowWarnings = [];
      if (!cells[6].value || ias <= 0)      rowWarnings.push('IAS must be > 0');
      if (!cells[9].value || dist <= 0)     rowWarnings.push('Distance must be > 0');
      if (isNaN(windDir) || windDir < 0 || windDir > 360)
                                           rowWarnings.push('Wind angle 0°–360°');
      if (isNaN(windSpd) || windSpd < 0)    rowWarnings.push('Wind speed ≥ 0');
      if (!isNaN(temp) && (temp < -60 || temp > 50))
                                           rowWarnings.push('Temp −60° to +50°C');
      if (isNaN(tc) || tc < 0 || tc > 360)  rowWarnings.push('True course 0°–360°');
      if (Math.abs(variation) > 30)         rowWarnings.push('Variation >30°?');
      
      if (rowWarnings.length) {
          warnings.push(`Leg ${i+1} (${startingPoint}→${endingPoint}): ${rowWarnings.join('; ')}`);
          return; // skip this leg
      }
      
      // Calculations
      const tempDev   = temp - (15 - ((alt / 1000) * 2));
      const tas       = ias + (alt / 1000 * (ias * 0.02));
      const mc        = tc + variation;
      const windAngle = ((windDir - mc + 360) % 360);
      
      let wca = 0;
      if (tas > 0) {
          wca = Math.asin((windSpd * Math.sin(windAngle * Math.PI / 180)) / tas) * 180 / Math.PI;
      }
      
      const gs = tas - (windSpd * Math.cos(windAngle * Math.PI / 180));
      if (gs <= 0 || isNaN(gs)) {
          warnings.push(`Leg ${i+1} (${startingPoint}→${endingPoint}): invalid GS (${gs.toFixed(1)} kt)`);
          return;
      }
      
      const ete  = dist / gs * 60;
      const fuel = ete / 60 * fuelPerHour;
      if (!isFinite(ete) || !isFinite(fuel) || ete < 0 || fuel < 0) {
          warnings.push(`Leg ${i+1} (${startingPoint}→${endingPoint}): ETE/fuel calc failed`);
          return;
      }
      
      totalTripFuel += fuel;
      
      // Append results row
      const resultRow = document.createElement('tr');
      const mh        = mc + wca;
      
      const values = [
          startingPoint, 
          endingPoint,
          phase.charAt(0).toUpperCase() + phase.slice(1), // Capitalize phase
          tempDev.toFixed(1),
          tas.toFixed(1),
          mc.toFixed(1),
          wca.toFixed(1),
          mh.toFixed(1),
          gs.toFixed(1),
          ete.toFixed(1),
          roundUpToNearestTenth(fuel).toFixed(1) // Round up fuel
      ];
      
      values.forEach(val => {
          const cell = document.createElement('td');
          cell.textContent = val;
          resultRow.appendChild(cell);
      });
      
      resultsBody.appendChild(resultRow);
  });
  
  // Show all warnings (if any)
  if (warnings.length) {
      alert('Please fix the following:\n\n' + warnings.join('\n'));
  }
  
  // Skip summary if nothing valid
  if (totalTripFuel <= 0 || isNaN(totalTripFuel)) return;
  
  // Calculate average fuel consumption for reserve calculations
  const avgFuelPerHour = aircraftData[aircraft].cruise;
  
  // Fuel summary
  const contingency1    = totalTripFuel * 0.2;
  const contingency2    = (5 / 60) * avgFuelPerHour;
  const contingency     = Math.max(contingency1, contingency2);
  const alternateFuel   = (altDist / 90) * avgFuelPerHour;
  const finalReserve    = 0.75 * avgFuelPerHour;
  const totalReserve    = contingency + alternateFuel + finalReserve + additional;
  const totalTOFuel     = totalTripFuel + totalReserve;
  const rampFuel        = totalTOFuel + extra + taxi;
  const expectedLanding = totalTOFuel - totalTripFuel;
  
  // Format summary with rounded up values
  document.getElementById('fuelSummary').innerHTML = `
      <p><strong>Trip Fuel:</strong> ${roundUpToNearestTenth(totalTripFuel).toFixed(1)} USG</p>
      <p><strong>Contingency (20% or 5min):</strong> ${roundUpToNearestTenth(contingency).toFixed(1)} USG</p>
      <p><strong>Alternate Fuel:</strong> ${roundUpToNearestTenth(alternateFuel).toFixed(1)} USG</p>
      <p><strong>Final Reserve (45min):</strong> ${roundUpToNearestTenth(finalReserve).toFixed(1)} USG</p>
      <p><strong>Additional Fuel:</strong> ${roundUpToNearestTenth(additional).toFixed(1)} USG</p>
      <p><strong>Total Reserve:</strong> ${roundUpToNearestTenth(totalReserve).toFixed(1)} USG</p>
      <p><strong>Total T/O Fuel:</strong> ${roundUpToNearestTenth(totalTOFuel).toFixed(1)} USG</p>
      <p><strong>Extra Fuel:</strong> ${roundUpToNearestTenth(extra).toFixed(1)} USG</p>
      <p><strong>Taxi Fuel:</strong> ${roundUpToNearestTenth(taxi).toFixed(1)} USG</p>
      <p><strong>Ramp Fuel:</strong> ${roundUpToNearestTenth(rampFuel).toFixed(1)} USG</p>
      <p><strong>Expected Landing Fuel:</strong> ${roundUpToNearestTenth(expectedLanding).toFixed(1)} USG</p>
  `;
}