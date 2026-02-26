// Aircraft data (each aircraft uses its REAL unit — no conversions)
const aircraftData = {
    'DV20': {
        name: 'Diamond DV20',
        unit: 'USG',
        climb: 6.0,
        cruise: 6.0,
        descent: 6.0
    },
    'P208': {
        name: 'Tecnam P208',
        unit: 'L',
        climb: 25,   // L/h
        cruise: 15,  // L/h
        descent: 12  // L/h
    }
  };
  
  document.addEventListener('DOMContentLoaded', function() {
    const aircraftSelect = document.getElementById('aircraftType');
    const aircraftInfo = document.getElementById('aircraftInfo');
  
    aircraftSelect.addEventListener('change', function() {
        if (this.value && aircraftData[this.value]) {
            const aircraft = aircraftData[this.value];
            aircraftInfo.innerHTML = `
                <p><strong>${aircraft.name} Fuel Consumption:</strong></p>
                <p>Climb: ${roundUpToNearestTenth(aircraft.climb).toFixed(1)} ${aircraft.unit}/hour</p>
                <p>Cruise: ${roundUpToNearestTenth(aircraft.cruise).toFixed(1)} ${aircraft.unit}/hour</p>
                <p>Descent: ${roundUpToNearestTenth(aircraft.descent).toFixed(1)} ${aircraft.unit}/hour</p>
            `;
        } else {
            aircraftInfo.innerHTML = '';
        }
    });
  
    document.getElementById('addLegBtn').addEventListener('click', addLeg);
    document.getElementById('calculateBtn').addEventListener('click', calculate);
  
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
  
    newRow.querySelectorAll('input').forEach(input => {
        input.value = '';
        if (input.type === 'number') input.value = '0';
    });
  
    newRow.querySelector('.phase').value = 'cruise';
    tbody.appendChild(newRow);
  }
  
  function autoDetectPhase(altitudeInput) {
    const row = altitudeInput.closest('tr');
    const phaseSelect = row.querySelector('.phase');
    const altitude = parseFloat(altitudeInput.value) || 0;
  
    const allRows = document.querySelectorAll('#legsTable tbody tr');
    const currentIndex = Array.from(allRows).indexOf(row);
  
    if (currentIndex > 0) {
        const prevAltInput = allRows[currentIndex - 1].querySelector('.altitude');
        const prevAltitude = parseFloat(prevAltInput.value) || 0;
  
        if (altitude > prevAltitude) phaseSelect.value = 'climb';
        else if (altitude < prevAltitude) phaseSelect.value = 'descent';
        else phaseSelect.value = 'cruise';
    }
  }
  
  function roundUpToNearestTenth(value) {
    return Math.ceil(value * 10) / 10;
  }
  
  function getFuelConsumption(aircraft, phase) {
    if (!aircraftData[aircraft]) return 0;
    return aircraftData[aircraft][phase];
  }
  
  function calculate() {
  
    const aircraftKey = document.getElementById('aircraftType').value;
    const rows = document.querySelectorAll('#legsTable tbody tr');
    const resultsBody = document.querySelector('#resultsTable tbody');
    resultsBody.innerHTML = '';
  
    if (!aircraftKey) {
        alert('Please select an aircraft type.');
        return;
    }
  
    const aircraft = aircraftData[aircraftKey];
    const fuelUnit = aircraft.unit;
  
    // Update fuel column header dynamically
    document.getElementById('fuelHeader').textContent = `Fuel (${fuelUnit})`;
  
    let totalTripFuel = 0;
    const warnings = [];
  
    const altDist    = parseFloat(document.getElementById('alternateDistance').value) || 0;
    const additional = parseFloat(document.getElementById('additionalFuel').value) || 0;
    const extra      = parseFloat(document.getElementById('extraFuel').value) || 0;
    const taxi       = parseFloat(document.getElementById('taxiFuel').value) || 0;
  
    rows.forEach((row, i) => {
  
        const cells = row.querySelectorAll('input, select');
        const startingPoint = cells[0].value.trim() || 'N/A';
        const endingPoint   = cells[1].value.trim() || 'N/A';
        const alt           = parseFloat(cells[2].value) || 0;
        const windDir       = parseFloat(cells[3].value);
        const windSpd       = parseFloat(cells[4].value);
        const temp          = parseFloat(cells[5].value);
        const ias           = parseFloat(cells[6].value);
        const tc            = parseFloat(cells[7].value);
        const variation     = parseFloat(cells[8].value) || 0;
        const dist          = parseFloat(cells[9].value);
        const phase         = cells[10].value;
  
        const fuelPerHour = getFuelConsumption(aircraftKey, phase);
  
        const rowWarnings = [];
  
        if (!cells[6].value || ias <= 0) rowWarnings.push('IAS must be > 0');
        if (!cells[9].value || dist <= 0) rowWarnings.push('Distance must be > 0');
        if (isNaN(windDir) || windDir < 0 || windDir > 360) rowWarnings.push('Wind angle 0°–360°');
        if (isNaN(windSpd) || windSpd < 0) rowWarnings.push('Wind speed ≥ 0');
        if (!isNaN(temp) && (temp < -60 || temp > 50)) rowWarnings.push('Temp −60° to +50°C');
        if (isNaN(tc) || tc < 0 || tc > 360) rowWarnings.push('True course 0°–360°');
        if (Math.abs(variation) > 30) rowWarnings.push('Variation >30°?');
  
        if (rowWarnings.length) {
            warnings.push(`Leg ${i+1} (${startingPoint}→${endingPoint}): ${rowWarnings.join('; ')}`);
            return;
        }
  
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
            warnings.push(`Leg ${i+1} (${startingPoint}→${endingPoint}): invalid GS`);
            return;
        }
  
        const ete  = dist / gs * 60;
        const fuel = ete / 60 * fuelPerHour;
  
        totalTripFuel += fuel;
  
        const resultRow = document.createElement('tr');
        const mh        = mc + wca;
  
        const values = [
            startingPoint,
            endingPoint,
            phase.charAt(0).toUpperCase() + phase.slice(1),
            tempDev.toFixed(1),
            tas.toFixed(1),
            mc.toFixed(1),
            wca.toFixed(1),
            mh.toFixed(1),
            gs.toFixed(1),
            ete.toFixed(1),
            roundUpToNearestTenth(fuel).toFixed(1)
        ];
  
        values.forEach(val => {
            const cell = document.createElement('td');
            cell.textContent = val;
            resultRow.appendChild(cell);
        });
  
        resultsBody.appendChild(resultRow);
    });
  
    if (warnings.length) {
        alert('Please fix:\n\n' + warnings.join('\n'));
    }
  
    if (totalTripFuel <= 0 || isNaN(totalTripFuel)) return;
  
    const avgFuelPerHour = aircraft.cruise;
  
    const contingency1  = totalTripFuel * 0.2;
    const contingency2  = (5 / 60) * avgFuelPerHour;
    const contingency   = Math.max(contingency1, contingency2);
  
    const alternateFuel = (altDist / 90) * avgFuelPerHour;
    const finalReserve  = 0.75 * avgFuelPerHour;
  
    const totalReserve  = contingency + alternateFuel + finalReserve + additional;
    const totalTOFuel   = totalTripFuel + totalReserve;
    const rampFuel      = totalTOFuel + extra + taxi;
    const expectedLanding = totalTOFuel - totalTripFuel;
  
    document.getElementById('fuelSummary').innerHTML = `
        <p><strong>Trip Fuel:</strong> ${roundUpToNearestTenth(totalTripFuel).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Contingency (20% or 5min):</strong> ${roundUpToNearestTenth(contingency).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Alternate Fuel:</strong> ${roundUpToNearestTenth(alternateFuel).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Final Reserve (45min):</strong> ${roundUpToNearestTenth(finalReserve).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Additional Fuel:</strong> ${roundUpToNearestTenth(additional).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Total Reserve:</strong> ${roundUpToNearestTenth(totalReserve).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Total T/O Fuel:</strong> ${roundUpToNearestTenth(totalTOFuel).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Extra Fuel:</strong> ${roundUpToNearestTenth(extra).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Taxi Fuel:</strong> ${roundUpToNearestTenth(taxi).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Ramp Fuel:</strong> ${roundUpToNearestTenth(rampFuel).toFixed(1)} ${fuelUnit}</p>
        <p><strong>Expected Landing Fuel:</strong> ${roundUpToNearestTenth(expectedLanding).toFixed(1)} ${fuelUnit}</p>
    `;
  }