// script.js

document.getElementById('addLegBtn').addEventListener('click', addLeg);
document.getElementById('calculateBtn').addEventListener('click', calculate);

function addLeg() {
  // Clone the first row so new rows inherit all min/max/step/required attributes
  const tbody = document.querySelector('#legsTable tbody');
  const template = tbody.querySelector('tr');
  const newRow = template.cloneNode(true);
  newRow.querySelectorAll('input').forEach(input => input.value = '');
  tbody.appendChild(newRow);
}

function calculate() {
  const rows = document.querySelectorAll('#legsTable tbody tr');
  const resultsBody = document.querySelector('#resultsTable tbody');
  resultsBody.innerHTML = '';

  let totalTripFuel = 0;
  const warnings = [];

  // Global settings
  const fuelPerHour = parseFloat(document.getElementById('fuelPerHour').value) || 0;
  const altDist      = parseFloat(document.getElementById('alternateDistance').value) || 0;
  const additional   = parseFloat(document.getElementById('additionalFuel').value) || 0;
  const extra        = parseFloat(document.getElementById('extraFuel').value) || 0;
  const taxi         = parseFloat(document.getElementById('taxiFuel').value) || 0;

  // Validate global burn
  if (fuelPerHour <= 0) {
    warnings.push('Fuel consumption per hour must be greater than 0.');
  }

  rows.forEach((row, i) => {
    const cells = row.querySelectorAll('input');
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
    [startingPoint, endingPoint, tempDev, tas, mc, wca, mh, gs, ete, fuel]
      .forEach(val => {
        const cell = document.createElement('td');
        cell.textContent = (typeof val === 'number') ? val.toFixed(1) : val;
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

  // Fuel summary
  const contingency1    = totalTripFuel * 0.2;
  const contingency2    = (20 / 60) * fuelPerHour;
  const contingency     = Math.max(contingency1, contingency2);
  const alternateFuel   = (altDist / 90) * fuelPerHour;
  const finalReserve    = 0.75 * fuelPerHour;
  const totalReserve    = contingency + alternateFuel + finalReserve + additional;
  const totalTOFuel     = totalTripFuel + totalReserve;
  const rampFuel        = totalTOFuel + extra + taxi;
  const expectedLanding = totalTOFuel - totalTripFuel;

  document.getElementById('fuelSummary').innerHTML = `
    <p><strong>Trip Fuel:</strong> ${totalTripFuel.toFixed(2)} USG</p>
    <p><strong>Contingency (20% or 20 min):</strong> ${contingency.toFixed(2)} USG</p>
    <p><strong>Alternate Fuel:</strong> ${alternateFuel.toFixed(2)} USG</p>
    <p><strong>Final Reserve (45 min):</strong> ${finalReserve.toFixed(2)} USG</p>
    <p><strong>Additional Fuel:</strong> ${additional.toFixed(2)} USG</p>
    <p><strong>Total Reserve:</strong> ${totalReserve.toFixed(2)} USG</p>
    <p><strong>Total T/O Fuel:</strong> ${totalTOFuel.toFixed(2)} USG</p>
    <p><strong>Extra Fuel:</strong> ${extra.toFixed(2)} USG</p>
    <p><strong>Taxi Fuel:</strong> ${taxi.toFixed(2)} USG</p>
    <p><strong>Ramp Fuel:</strong> ${rampFuel.toFixed(2)} USG</p>
    <p><strong>Expected Landing Fuel:</strong> ${expectedLanding.toFixed(2)} USG</p>
  `;
}
