const playerInput = document.getElementById('playerInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultDashboard = document.getElementById('resultDashboard');
const emptyState = document.getElementById('emptyState');
const inputSection = document.getElementById('inputSection');
const errorSection = document.getElementById('errorSection');
const errorText = document.getElementById('errorText');
const backBtn = document.getElementById('backBtn');

function showLoading() {
  loadingSection.style.display = 'block';
  resultDashboard.classList.remove('show');
  emptyState.style.display = 'none';
  errorSection.classList.remove('show');
  inputSection.style.display = 'none';
  analyzeBtn.classList.add('loading');
  analyzeBtn.disabled = true;
}

function showResults() {
  loadingSection.style.display = 'none';
  resultDashboard.classList.add('show');
  emptyState.style.display = 'none';
  errorSection.classList.remove('show');
  inputSection.style.display = 'none';
  analyzeBtn.classList.remove('loading');
  analyzeBtn.disabled = false;
  
  setTimeout(() => {
    resultDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function showEmpty() {
  loadingSection.style.display = 'none';
  resultDashboard.classList.remove('show');
  emptyState.style.display = 'block';
  errorSection.classList.remove('show');
  inputSection.style.display = 'block';
  analyzeBtn.classList.remove('loading');
  analyzeBtn.disabled = false;
}

function showError(message) {
  loadingSection.style.display = 'none';
  resultDashboard.classList.remove('show');
  emptyState.style.display = 'none';
  errorSection.classList.add('show');
  inputSection.style.display = 'block';
  analyzeBtn.classList.remove('loading');
  analyzeBtn.disabled = false;
  errorText.textContent = message;
}

function resetToInput() {
  showEmpty();
  playerInput.value = '';
  playerInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const API_BASE_URL = 'https://smurf-api.typedefs.workers.dev';

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function fetchSmurfAnalysis(playerId) {
  const response = await fetch(`${API_BASE_URL}/api/analyze?player=${encodeURIComponent(playerId)}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "API request failed");
  }
  
  return await response.json();
}

function updateMetric(metricId, scoreId, rawValue, normalizedValue, showBar = true) {
  const metricFill = document.getElementById(metricId);
  const metricScore = document.getElementById(scoreId);
  const metricBar = metricFill?.parentElement;
  
  if (metricBar) {
    metricBar.style.display = showBar ? 'block' : 'none';
  }
  
  if (metricFill && showBar) {
    const clampedValue = Math.max(0, Math.min(100, normalizedValue));
    const displayValue = Math.max(3, clampedValue);
    metricFill.style.width = displayValue + '%';
    
    if (clampedValue < 30) {
      metricFill.style.background = '#51cf66';
    } else if (clampedValue < 60) {
      metricFill.style.background = '#ffa502';
    } else {
      metricFill.style.background = '#ff6b6b';
    }
  }
  
  if (metricScore) {
    metricScore.textContent = rawValue;
  }
}

function renderDashboard(data) {
  document.getElementById('suspicionScore').textContent = data.smurf_score + '%';
  document.getElementById('winRate').textContent = data.win_rate + '%';
  document.getElementById('kdRatio').textContent = data.kd_ratio;
  document.getElementById('matchesPlayed').textContent = data.matches_played;
  
  const scoreValue = document.getElementById('suspicionScore');
  scoreValue.classList.remove('high', 'medium', 'low');
  if (data.smurf_score > 75) {
    scoreValue.classList.add('high');
  } else if (data.smurf_score > 40) {
    scoreValue.classList.add('medium');
  } else {
    scoreValue.classList.add('low');
  }
  
  if (data.metrics) {
    updateMetric('metricAge', 'scoreAge', data.metrics.age.raw, data.metrics.age.norm, true);
    updateMetric('metricConsistency', 'scoreConsistency', data.metrics.consistency.raw, data.metrics.consistency.norm, true);
    updateMetric('metricHeadshot', 'scoreHeadshot', data.metrics.headshot.raw, data.metrics.headshot.norm, true);
    updateMetric('metricWinStreak', 'scoreWinStreak', data.metrics.winstreak.raw, data.metrics.winstreak.norm, true);
    updateMetric('metricImprovement', 'scoreImprovement', data.metrics.improvement.raw, data.metrics.improvement.norm, true);
    updateMetric('metricPlaytime', 'scorePlaytime', data.metrics.playtime.raw, data.metrics.playtime.norm, true);
    updateMetric('metricRegion', 'scoreRegion', data.metrics.region.raw, data.metrics.region.norm, false);
    updateMetric('metricBehavior', 'scoreBehavior', data.metrics.behavior.raw, data.metrics.behavior.norm, false);
  }
  
  renderFlags(data.flags || []);
  renderMatches(data.matches || []);
}

function renderFlags(flags) {
  const flagsList = document.getElementById('flagsList');
  
  if (!flags || flags.length === 0) {
    flagsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✓</div>
        <div class="empty-state-text">No suspicion flags detected</div>
      </div>
    `;
    return;
  }
  
  flagsList.innerHTML = flags.map(flag => {
    const level = ['low', 'medium', 'high'].includes(flag.level) ? flag.level : 'medium';
    return `
    <div class="flag-item ${level}">
      <div class="flag-icon">⚠</div>
      <div class="flag-content">
        <div class="flag-title">${escapeHtml(flag.title || 'Flag')}</div>
        <div class="flag-description">${escapeHtml(flag.description || '')}</div>
      </div>
    </div>
  `}).join('');
}

function renderMatches(matches) {
  const tbody = document.getElementById('matchesTableBody');
  
  if (!matches || matches.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div style="padding: 20px 0;">
            <div style="font-size: 14px; opacity: 0.6;">No matches to display</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = matches.map(match => {
    const result = ['WIN', 'LOSS', 'DRAW'].includes(match.result) ? match.result : 'DRAW';
    return `
    <tr>
      <td>${escapeHtml(match.date || 'N/A')}</td>
      <td><span class="match-result ${result.toLowerCase()}">${result}</span></td>
      <td>${escapeHtml(match.map || 'Unknown')}</td>
      <td>${parseInt(match.kills) || 0}</td>
      <td>${parseInt(match.deaths) || 0}</td>
      <td>${parseInt(match.assists) || 0}</td>
      <td>${parseFloat(match.kd) || '0.00'}</td>
      <td>${parseInt(match.headshots) || 0}%</td>
      <td class="stat-muted">${escapeHtml(match.duration || 'N/A')}</td>
    </tr>
  `}).join('');
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

async function analyzePlayer(playerId) {
  try {
    showLoading();
    const data = await fetchSmurfAnalysis(playerId);
    renderDashboard(data);
    showResults();
  } catch (error) {
    console.error('Analysis error:', error);
    showError('Player not found or API error. Please try again.');
  }
}

const handleAnalyze = debounce(async () => {
  const playerId = playerInput.value.trim();
  
  if (!playerId) {
    showError('Please enter a FaceIt Player ID or Username');
    return;
  }
  
  if (playerId.length > 50) {
    showError('Player name is too long');
    return;
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(playerId)) {
    showError('Player name contains invalid characters. Use only letters, numbers, _ and -');
    return;
  }
  
  if (analyzeBtn.disabled) {
    return;
  }
  
  await analyzePlayer(playerId);
}, 300);

analyzeBtn.addEventListener('click', handleAnalyze);

playerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleAnalyze();
  }
});

backBtn.addEventListener('click', () => {
  resetToInput();
});
