// ─── SAMPLE DATASETS ───
const samples = {
  low:    [98, 102, 95, 105, 99, 101, 103, 97, 100, 104],
  medium: [108, 115, 112, 118, 105, 120, 110, 116, 113, 119],
  high:   [135, 142, 128, 150, 138, 145, 130, 148, 141, 136]
};

function loadSample(type) {
  document.getElementById('salesInput').value = samples[type].join(', ');
  document.getElementById('discountSlider').value = type === 'low' ? 5 : type === 'medium' ? 20 : 40;
  document.getElementById('discountLabel').textContent =
    (type === 'low' ? 5 : type === 'medium' ? 20 : 40) + '%';
}

// ─── CHART INSTANCES ───
let salesChart = null;
let distChart = null;

// ─── ANALYZE ───
async function analyze() {
  const btn = document.getElementById('analyzeBtn');
  const errorMsg = document.getElementById('error-msg');
  errorMsg.textContent = '';

  const rawInput = document.getElementById('salesInput').value.trim();
  const expectedMean = parseFloat(document.getElementById('expectedMean').value);
  const discount = parseFloat(document.getElementById('discountSlider').value);

  // Validate
  if (!rawInput) {
    errorMsg.textContent = '⚠ Please enter sales data.';
    return;
  }
  const salesData = rawInput.split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
  if (salesData.length < 2) {
    errorMsg.textContent = '⚠ Enter at least 2 valid numbers.';
    return;
  }
  if (isNaN(expectedMean) || expectedMean <= 0) {
    errorMsg.textContent = '⚠ Expected mean must be a positive number.';
    return;
  }

  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing…';

  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sales_data: salesData, expected_mean: expectedMean, discount })
    });

    const data = await res.json();

    if (data.error) {
      errorMsg.textContent = '⚠ ' + data.error;
      return;
    }

    renderResults(data);
    renderCharts(data);

  } catch (e) {
    errorMsg.textContent = '⚠ Connection error. Is the Flask server running?';
  } finally {
    btn.classList.remove('loading');
    btn.innerHTML = '<span class="btn-icon">⚡</span> Run Statistical Analysis';
  }
}

// ─── RENDER RESULTS ───
function renderResults(d) {
  document.getElementById('placeholderState').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  // Verdict
  const banner = document.getElementById('verdictBanner');
  banner.textContent = d.conclusion;
  banner.className = 'verdict-banner' + (d.significant ? '' : ' fail');

  // Stats
  document.getElementById('statMean').textContent = d.mean;
  document.getElementById('statStd').textContent = d.std;
  document.getElementById('statT').textContent = d.t_stat;
  document.getElementById('statP').textContent = d.p_value;
  document.getElementById('statN').textContent = d.n;
  document.getElementById('statUplift').textContent = d.uplift_pct + '%';

  // CI
  document.getElementById('ciLower').textContent = d.ci_lower;
  document.getElementById('ciUpper').textContent = d.ci_upper;

  // Hypothesis
  document.getElementById('hypExpected').textContent = d.expected_mean;
  document.getElementById('hypExpected2').textContent = d.expected_mean;
  document.getElementById('h0Status').textContent = d.significant ? '❌ Rejected' : '✅ Not Rejected';
  document.getElementById('h1Status').textContent = d.significant ? '✅ Supported' : '❌ Not Supported';

  // Optimal discount
  const optBox = document.getElementById('optimalBox');
  if (d.optimal_discount !== null) {
    document.getElementById('optimalText').textContent =
      `Based on observed uplift, an optimal discount around ${d.optimal_discount}% may maximize sales returns.`;
    optBox.style.display = 'flex';
  } else {
    optBox.style.display = 'none';
  }
}

// ─── RENDER CHARTS ───
function renderCharts(d) {
  const chartCard = document.getElementById('chartCard');
  chartCard.style.display = 'block';
  chartCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const labels = d.sales_data.map((_, i) => `Day ${i + 1}`);
  const accentColor = '#f5c842';
  const accentGreen = '#4fffb0';
  const dimColor = 'rgba(255,255,255,0.08)';
  const gridColor = 'rgba(255,255,255,0.06)';

  const chartDefaults = {
    color: '#9ca3af',
    borderColor: gridColor,
    plugins: { legend: { labels: { color: '#9ca3af', font: { family: 'DM Mono', size: 11 } } } }
  };

  // ── Bar Chart ──
  if (salesChart) salesChart.destroy();
  const ctx1 = document.getElementById('salesChart').getContext('2d');
  salesChart = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Daily Sales',
          data: d.sales_data,
          backgroundColor: d.sales_data.map(v => v > d.expected_mean
            ? 'rgba(79,255,176,0.6)' : 'rgba(255,90,90,0.5)'),
          borderColor: d.sales_data.map(v => v > d.expected_mean ? accentGreen : '#ff5a5a'),
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: `Expected (${d.expected_mean})`,
          data: Array(d.sales_data.length).fill(d.expected_mean),
          type: 'line',
          borderColor: accentColor,
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: chartDefaults.plugins.legend,
        tooltip: { backgroundColor: '#1c1f27', titleColor: '#e8eaf0', bodyColor: '#9ca3af', borderColor: '#2a2d38', borderWidth: 1 }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: '#6b7280', font: { family: 'DM Mono', size: 10 } } },
        y: { grid: { color: gridColor }, ticks: { color: '#6b7280', font: { family: 'DM Mono', size: 10 } } }
      }
    }
  });

  // ── Distribution Chart ──
  if (distChart) distChart.destroy();
  const ctx2 = document.getElementById('distChart').getContext('2d');
  const sorted = [...d.sales_data].sort((a, b) => a - b);
  distChart = new Chart(ctx2, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Sales Points',
          data: sorted.map((v, i) => ({ x: i + 1, y: v })),
          backgroundColor: accentColor,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: `Mean (${d.mean})`,
          data: [{ x: 0, y: d.mean }, { x: sorted.length + 1, y: d.mean }],
          type: 'line',
          borderColor: accentGreen,
          borderWidth: 2,
          borderDash: [5, 3],
          pointRadius: 0,
          fill: false,
        },
        {
          label: `Expected (${d.expected_mean})`,
          data: [{ x: 0, y: d.expected_mean }, { x: sorted.length + 1, y: d.expected_mean }],
          type: 'line',
          borderColor: '#ff5a5a',
          borderWidth: 2,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: chartDefaults.plugins.legend,
        tooltip: { backgroundColor: '#1c1f27', titleColor: '#e8eaf0', bodyColor: '#9ca3af', borderColor: '#2a2d38', borderWidth: 1 }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: '#6b7280', font: { family: 'DM Mono', size: 10 } }, title: { display: true, text: 'Rank', color: '#6b7280', font: { family: 'DM Mono', size: 10 } } },
        y: { grid: { color: gridColor }, ticks: { color: '#6b7280', font: { family: 'DM Mono', size: 10 } }, title: { display: true, text: 'Sales', color: '#6b7280', font: { family: 'DM Mono', size: 10 } } }
      }
    }
  });
}

// Allow Enter key in textarea
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('salesInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.ctrlKey) analyze();
  });
});
