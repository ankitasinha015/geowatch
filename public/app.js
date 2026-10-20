// === State ===
const state = {
  country: 'All',
  category: 'All',
  search: '',
  page: 1,
  articles: [],
  total: 0,
  loading: false,
};

const LIMIT = 30;

// === DOM ===
const heroSection = document.getElementById('hero-section');
const newsList = document.getElementById('news-list');
const loadingEl = document.getElementById('loading');
const statsBar = document.getElementById('stats-bar');
const lastUpdatedEl = document.getElementById('last-updated');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const loadMoreWrapper = document.getElementById('load-more-wrapper');
const loadMoreBtn = document.getElementById('load-more-btn');
const toast = document.getElementById('toast');

// === Fetch ===
async function fetchNews(append = false) {
  if (state.loading) return;
  state.loading = true;

  if (!append) {
    state.page = 1;
    heroSection.innerHTML = '';
    newsList.innerHTML = '';
    loadingEl.style.display = 'flex';
  }

  const params = new URLSearchParams({
    country: state.country,
    category: state.category,
    search: state.search,
    page: state.page,
    limit: LIMIT,
  });

  try {
    const res = await fetch(`/api/news?${params}`);
    const data = await res.json();

    state.articles = append ? [...state.articles, ...data.articles] : data.articles;
    state.total = data.total;

    if (data.lastFetched) {
      const d = new Date(data.lastFetched);
      lastUpdatedEl.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    render(append);
    renderLoadMore();
  } catch {
    if (!append) {
      newsList.innerHTML = `
        <div class="empty-state">
          <h3>Failed to load news</h3>
          <p>The server might still be fetching feeds. Try refreshing in a moment.</p>
        </div>`;
    }
  }

  state.loading = false;
  loadingEl.style.display = 'none';
}

// === Render ===
function render(append = false) {
  if (state.articles.length === 0) {
    heroSection.innerHTML = '';
    newsList.innerHTML = `
      <div class="empty-state">
        <h3>No articles found</h3>
        <p>Try adjusting your filters or search query.</p>
      </div>`;
    return;
  }

  if (!append) {
    heroSection.innerHTML = '';
    newsList.innerHTML = '';

    // Hero — first article
    const hero = state.articles[0];
    heroSection.innerHTML = renderHero(hero);

    // List — remaining
    const remaining = state.articles.slice(1);
    for (let i = 0; i < remaining.length; i++) {
      newsList.insertAdjacentHTML('beforeend', renderArticleRow(remaining[i], i));
    }
  } else {
    const newArticles = state.articles.slice(-LIMIT);
    const startIdx = state.articles.length - LIMIT - 1;
    for (let i = 0; i < newArticles.length; i++) {
      newsList.insertAdjacentHTML('beforeend', renderArticleRow(newArticles[i], startIdx + i));
    }
  }
}

function renderHero(article) {
  const time = getTimeAgo(article.timestamp);
  const readTime = getReadTime(article.description);
  const countries = article.countries.map(c => `${getFlag(c)} ${c}`).join('  ');

  return `
    <a href="${escAttr(article.link)}" target="_blank" rel="noopener noreferrer" class="hero-card">
      <div class="hero-label">
        <span class="hero-category" data-cat="${escAttr(article.category)}">${esc(article.category)}</span>
        <span style="font-size:0.72rem;color:var(--text-muted)">${countries}</span>
      </div>
      <h2 class="hero-title">${esc(article.title)}</h2>
      ${article.description ? `<p class="hero-desc">${esc(article.description)}</p>` : ''}
      <div class="hero-meta">
        <span class="hero-source">${esc(article.source)}</span>
        <span class="dot"></span>
        <span>${time}</span>
        <span class="dot"></span>
        <span>${readTime}</span>
      </div>
    </a>`;
}

function renderArticleRow(article, index) {
  const time = getTimeAgo(article.timestamp);
  const readTime = getReadTime(article.description);
  const countries = article.countries.map(c => `${getFlag(c)} ${c}`).join(' ');
  const delay = Math.min(index * 0.03, 0.6);

  return `
    <a href="${escAttr(article.link)}" target="_blank" rel="noopener noreferrer" class="article-row" style="animation-delay:${delay}s">
      <div class="article-body">
        <div class="article-top">
          <span class="article-cat" data-cat="${escAttr(article.category)}">${esc(article.category)}</span>
          <span class="article-country">${countries}</span>
        </div>
        <h3 class="article-title">${esc(article.title)}</h3>
        ${article.description ? `<p class="article-desc">${esc(article.description)}</p>` : ''}
        <div class="article-meta">
          <span class="article-source">${esc(article.source)}</span>
          <span class="dot"></span>
          <span>${time}</span>
          <span class="dot"></span>
          <span>${readTime}</span>
        </div>
      </div>
      <div class="article-actions">
        <button class="btn-share" onclick="shareArticle(event, '${escAttr(article.link)}')" title="Copy link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
      </div>
    </a>`;
}

// === Stats ===
async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    renderStats(data);
  } catch { /* silent */ }
}

function renderStats(data) {
  const cats = [
    { name: 'Funding', color: 'var(--teal)', count: data.byCategory['Funding'] || 0 },
    { name: 'AI & Tech', color: 'var(--purple)', count: data.byCategory['AI & Tech'] || 0 },
    { name: 'Geopolitics', color: 'var(--blue)', count: data.byCategory['Geopolitics'] || 0 },
    { name: 'Trade', color: 'var(--amber)', count: data.byCategory['Trade & Economy'] || 0 },
    { name: 'Diplomacy', color: 'var(--green)', count: data.byCategory['Diplomacy & Relations'] || 0 },
    { name: 'Defense', color: 'var(--red)', count: data.byCategory['Defense & Security'] || 0 },
  ];

  statsBar.innerHTML = `
    <span class="stat-item"><strong class="stat-count">${data.total}</strong> articles</span>
    ${cats.map(c => `
      <span class="stat-item">
        <span class="stat-dot" style="background:${c.color}"></span>
        ${c.name} <strong class="stat-count">${c.count}</strong>
      </span>
    `).join('')}
  `;
}

function renderLoadMore() {
  loadMoreWrapper.style.display = state.articles.length < state.total ? 'block' : 'none';
}

// === Share ===
function shareArticle(e, url) {
  e.preventDefault();
  e.stopPropagation();
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copied to clipboard');
  }).catch(() => {
    showToast('Could not copy link');
  });
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// === Helpers ===
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getReadTime(text) {
  if (!text) return '1 min read';
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function getFlag(country) {
  const flags = { US: '\u{1F1FA}\u{1F1F8}', India: '\u{1F1EE}\u{1F1F3}', World: '\u{1F30E}' };
  return flags[country] || '';
}

function esc(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function escAttr(text) {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
}

// === Events ===

// Country tabs
document.getElementById('country-tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('#country-tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  state.country = btn.dataset.country;
  fetchNews();
});

// Category filters
document.getElementById('category-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('.cat');
  if (!btn) return;
  document.querySelectorAll('#category-filters .cat').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  state.category = btn.dataset.category;
  fetchNews();
});

// Search
let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.search = searchInput.value.trim();
    fetchNews();
  }, 350);
});

// Refresh
refreshBtn.addEventListener('click', async () => {
  refreshBtn.classList.add('spinning');
  refreshBtn.disabled = true;
  try {
    await fetch('/api/refresh');
    await Promise.all([fetchNews(), fetchStats()]);
  } finally {
    refreshBtn.classList.remove('spinning');
    refreshBtn.disabled = false;
  }
});

// Load more
loadMoreBtn.addEventListener('click', () => {
  state.page++;
  fetchNews(true);
});

// === Init ===
fetchNews();
fetchStats();

// Auto-refresh every 5 minutes
setInterval(() => {
  fetchNews();
  fetchStats();
}, 5 * 60 * 1000);
