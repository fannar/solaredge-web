(function() {
  if (window.__SE_APP_INITIALIZED__) return;
  window.__SE_APP_INITIALIZED__ = true;
  const statusEl = document.getElementById('status');
  const els = {
    ac: document.getElementById('kpi-power-ac'),
    dc: document.getElementById('kpi-power-dc'),
    energy: document.getElementById('kpi-energy'),
    vdc: document.getElementById('kpi-vdc'),
    freq: document.getElementById('kpi-freq'),
    temp: document.getElementById('kpi-temp'),
    pf: document.getElementById('kpi-pf')
  };

  function scaleValue(value, scale) {
    if (typeof value !== 'number' || typeof scale !== 'number') return null;
    return value * Math.pow(10, scale);
  }

  function formatNumber(num, unit, fractionDigits) {
    if (num === null || Number.isNaN(num)) return '–';
    const n = (typeof fractionDigits === 'number') ? Number(num).toFixed(fractionDigits) : Number(num).toLocaleString();
    return unit ? n + ' ' + unit : n;
  }

  const powerCtx = document.getElementById('chart-power').getContext('2d');
  const pfCtx = document.getElementById('chart-pf').getContext('2d');
  const powerData = [];
  const powerLabels = [];
  const MAX_POINTS = 60; // ~5 min @ 5s interval

  const accent2 = getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim() || '#3b82f6';
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#42b883';

  const powerChart = new Chart(powerCtx, {
    type: 'line',
    data: { labels: powerLabels, datasets: [{ label: 'AC Power (kW)', data: powerData, borderColor: accent2, backgroundColor: 'transparent', tension: 0.25, pointRadius: 0, borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, normalized: true, parsing: false, scales: { x: { ticks: { maxRotation: 0 }, grid: { color: 'rgba(148,163,184,0.12)' } }, y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.12)' } } }, plugins: { legend: { display: false } } }
  });

  const pfChart = new Chart(pfCtx, {
    type: 'doughnut',
    data: { labels: ['PF', ''], datasets: [{ data: [0, 100], backgroundColor: [accent, 'rgba(148,163,184,0.2)'], borderWidth: 0, cutout: '70%' }] },
    options: { animation: false, plugins: { legend: { display: false } } }
  });

  function updateKpis(d) {
    const acW = scaleValue(d.power_ac, d.power_ac_scale);
    const dcW = scaleValue(d.power_dc, d.power_dc_scale);
    const vdc = scaleValue(d.voltage_dc, d.voltage_dc_scale);
    const freq = scaleValue(d.frequency, d.frequency_scale);
    const tempC = scaleValue(d.temperature, d.temperature_scale);
    const energyWh = scaleValue(d.energy_total, d.energy_total_scale);
    const energyKWh = typeof energyWh === 'number' ? energyWh / 1000 : null;
    let pfPct = scaleValue(d.power_factor, d.power_factor_scale);
    if (typeof pfPct === 'number') pfPct = Math.max(-100, Math.min(100, pfPct));

    els.ac.textContent = (typeof acW === 'number') ? (acW/1000).toFixed(2) + ' kW' : '–';
    els.dc.textContent = (typeof dcW === 'number') ? (dcW/1000).toFixed(2) + ' kW' : '–';
    els.energy.textContent = formatNumber(energyKWh, 'kWh', 1);
    els.vdc.textContent = formatNumber(vdc, 'V', 0);
    els.freq.textContent = formatNumber(freq, 'Hz', 2);
    els.temp.textContent = formatNumber(tempC, '°C', 1);
    els.pf.textContent = (typeof pfPct === 'number') ? pfPct.toFixed(2) + ' %' : '–';

    if (typeof pfPct === 'number') {
      const absPct = Math.abs(pfPct);
      pfChart.data.datasets[0].data = [absPct, 100 - absPct];
      pfChart.update('none');
    }

    if (typeof acW === 'number') {
      const ts = new Date();
      const label = ts.toLocaleTimeString([], { hour12: false, timeStyle: 'medium' });
      powerLabels.push(label);
      powerData.push(acW / 1000);
      if (powerLabels.length > MAX_POINTS) { powerLabels.shift(); powerData.shift(); }
      powerChart.update('none');
    }
  }

  async function poll() {
    try {
      const res = await fetch('/api', { cache: 'no-store' });
      if (!res.ok) throw new Error('Status ' + res.status);
      const json = await res.json();
      const d = json && json.data ? json.data : {};
      updateKpis(d);
      statusEl.textContent = 'Updated ' + new Date().toLocaleTimeString();
    } catch (err) {
      statusEl.textContent = 'Error: ' + err.message;
      console.error(err);
    }
  }

  const POLL_MS = 5000;
  let pollTimer = null;

  function startPolling() {
    if (pollTimer) return;
    poll();
    pollTimer = setInterval(poll, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPolling(); else startPolling();
  });

  window.addEventListener('beforeunload', () => {
    stopPolling();
    try { powerChart.destroy(); } catch (_) {}
    try { pfChart.destroy(); } catch (_) {}
  });

  startPolling();
})();


