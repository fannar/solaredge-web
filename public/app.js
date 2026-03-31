(function () {
  if (window.__SE_APP_INITIALIZED__) return;
  window.__SE_APP_INITIALIZED__ = true;

  const statusEl = document.getElementById("status");
  const statusDot = document.getElementById("status-dot");
  const sunIcon = document.getElementById("sun-icon");
  const gaugeArc = document.getElementById("gauge-arc");

  const els = {
    ac: document.getElementById("kpi-power-ac"),
    dc: document.getElementById("kpi-power-dc"),
    energy: document.getElementById("kpi-energy"),
    vdc: document.getElementById("kpi-vdc"),
    freq: document.getElementById("kpi-freq"),
    temp: document.getElementById("kpi-temp"),
    pf: document.getElementById("kpi-pf"),
  };

  // Gauge math: circumference of r=72 circle
  const GAUGE_CIRCUMF = 2 * Math.PI * 72; // ~452.4

  function scaleValue(value, scale) {
    if (typeof value !== "number" || typeof scale !== "number") return null;
    return value * Math.pow(10, scale);
  }

  function formatNumber(num, unit, fractionDigits) {
    if (num === null || Number.isNaN(num)) return "–";
    const n =
      typeof fractionDigits === "number"
        ? Number(num).toFixed(fractionDigits)
        : Number(num).toLocaleString();
    return unit ? n + " " + unit : n;
  }

  // ─── Chart Setup ───
  const powerCtx = document.getElementById("chart-power").getContext("2d");
  const powerData = [];
  const powerLabels = [];
  const MAX_POINTS = 60;

  const amber = "#f0a830";
  const amberFaded = "rgba(240, 168, 48, 0.08)";
  const gridColor = "rgba(255, 190, 60, 0.06)";
  const tickColor = "#4a463f";

  const powerChart = new Chart(powerCtx, {
    type: "line",
    data: {
      labels: powerLabels,
      datasets: [
        {
          label: "AC Power (kW)",
          data: powerData,
          borderColor: amber,
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: amber,
          fill: true,
          backgroundColor: function (context) {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return amberFaded;
            const grad = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            grad.addColorStop(0, "rgba(240, 168, 48, 0.20)");
            grad.addColorStop(0.6, "rgba(240, 168, 48, 0.04)");
            grad.addColorStop(1, "rgba(240, 168, 48, 0.00)");
            return grad;
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      normalized: true,
      parsing: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            color: tickColor,
            font: { family: "'IBM Plex Mono', monospace", size: 10 },
            maxTicksLimit: 8,
          },
          grid: { color: gridColor },
          border: { color: "rgba(255,255,255,0.04)" },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: tickColor,
            font: { family: "'IBM Plex Mono', monospace", size: 10 },
            callback: function (v) {
              return v + " kW";
            },
          },
          grid: { color: gridColor },
          border: { color: "transparent" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1a1a20",
          borderColor: "rgba(240,168,48,0.2)",
          borderWidth: 1,
          titleFont: {
            family: "'IBM Plex Mono', monospace",
            size: 11,
            weight: "normal",
          },
          bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
          titleColor: "#7a756c",
          bodyColor: "#f0a830",
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: function (ctx) {
              return ctx.parsed.y.toFixed(2) + " kW";
            },
          },
        },
      },
    },
  });

  // ─── Update Logic ───

  function setGauge(pct) {
    const clamped = Math.max(0, Math.min(100, Math.abs(pct)));
    const offset = GAUGE_CIRCUMF - (clamped / 100) * GAUGE_CIRCUMF;
    gaugeArc.style.strokeDashoffset = offset;
  }

  function updateKpis(d) {
    const acW = scaleValue(d.power_ac, d.power_ac_scale);
    const dcW = scaleValue(d.power_dc, d.power_dc_scale);
    const vdc = scaleValue(d.voltage_dc, d.voltage_dc_scale);
    const freq = scaleValue(d.frequency, d.frequency_scale);
    const tempC = scaleValue(d.temperature, d.temperature_scale);
    const energyWh = scaleValue(d.energy_total, d.energy_total_scale);
    const energyKWh = typeof energyWh === "number" ? energyWh / 1000 : null;
    let pfPct = scaleValue(d.power_factor, d.power_factor_scale);
    if (typeof pfPct === "number")
      pfPct = Math.max(-100, Math.min(100, pfPct));

    // Sun icon glow when producing power
    if (typeof acW === "number" && acW > 0) {
      sunIcon.classList.add("active");
    } else {
      sunIcon.classList.remove("active");
    }

    // KPI values with unit spans
    els.ac.innerHTML =
      typeof acW === "number"
        ? (acW / 1000).toFixed(2) + '<span class="unit">kW</span>'
        : "–";
    els.dc.innerHTML =
      typeof dcW === "number"
        ? (dcW / 1000).toFixed(2) + '<span class="unit">kW</span>'
        : "–";
    els.energy.innerHTML =
      energyKWh !== null
        ? energyKWh.toFixed(1) + '<span class="unit">kWh</span>'
        : "–";
    els.vdc.innerHTML =
      vdc !== null
        ? Number(vdc).toFixed(0) + '<span class="unit">V</span>'
        : "–";
    els.freq.innerHTML =
      freq !== null
        ? Number(freq).toFixed(2) + '<span class="unit">Hz</span>'
        : "–";
    els.temp.innerHTML =
      tempC !== null
        ? Number(tempC).toFixed(1) + '<span class="unit">°C</span>'
        : "–";

    // Power factor gauge
    if (typeof pfPct === "number") {
      els.pf.textContent = Math.abs(pfPct).toFixed(1);
      setGauge(pfPct);
    } else {
      els.pf.textContent = "–";
      setGauge(0);
    }

    // Power chart
    if (typeof acW === "number") {
      const ts = new Date();
      const label = ts.toLocaleTimeString([], {
        hour12: false,
        timeStyle: "medium",
      });
      powerLabels.push(label);
      powerData.push(acW / 1000);
      if (powerLabels.length > MAX_POINTS) {
        powerLabels.shift();
        powerData.shift();
      }
      powerChart.update("none");
    }
  }

  // ─── Polling ───

  async function poll() {
    try {
      const res = await fetch("/api", { cache: "no-store" });
      if (!res.ok) throw new Error("Status " + res.status);
      const json = await res.json();
      const d = json && json.data ? json.data : {};
      updateKpis(d);
      statusDot.classList.add("live");
      statusEl.textContent =
        "Live · " + new Date().toLocaleTimeString([], { hour12: false });
    } catch (err) {
      statusDot.classList.remove("live");
      statusEl.textContent = "Offline · " + err.message;
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

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopPolling();
    else startPolling();
  });

  window.addEventListener("beforeunload", function () {
    stopPolling();
    try {
      powerChart.destroy();
    } catch (_) {}
  });

  // Initialize gauge dasharray
  gaugeArc.style.strokeDasharray = GAUGE_CIRCUMF;
  gaugeArc.style.strokeDashoffset = GAUGE_CIRCUMF;

  startPolling();
})();
