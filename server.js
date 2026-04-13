const express = require('express');
const RSSParser = require('rss-parser');
const cron = require('node-cron');
const path = require('path');

const app = express();
const parser = new RSSParser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

const PORT = process.env.PORT || 3000;

// --- RSS Feed Sources ---
const FEEDS = [
  // US-focused
  { url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB', source: 'Google News', region: 'world' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NY Times', region: 'world' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', source: 'NY Times', region: 'us' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC', region: 'world' },
  { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC', region: 'us' },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC', region: 'india' },
  // India-focused
  { url: 'https://www.thehindu.com/news/national/feeder/default.rss', source: 'The Hindu', region: 'india' },
  { url: 'https://www.thehindu.com/news/international/feeder/default.rss', source: 'The Hindu', region: 'world' },
  { url: 'https://feeds.feedburner.com/ndtvnews-india-news', source: 'NDTV', region: 'india' },
  { url: 'https://feeds.feedburner.com/ndtvnews-world-news', source: 'NDTV', region: 'world' },
  // Al Jazeera
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', region: 'world' },
  // AP News
  { url: 'https://feedx.net/rss/ap.xml', source: 'AP News', region: 'world' },
];

// --- Geopolitical Keywords ---
const GEO_KEYWORDS = [
  // General geopolitics
  'geopolit', 'foreign policy', 'diplomacy', 'diplomat', 'bilateral', 'multilateral',
  'summit', 'treaty', 'accord', 'pact', 'alliance', 'nato', 'quad', 'g7', 'g20',
  'united nations', 'un security', 'general assembly',
  // Defense & Security
  'military', 'defense', 'defence', 'missile', 'nuclear', 'weapons', 'army', 'navy',
  'air force', 'pentagon', 'war', 'conflict', 'troops', 'soldier', 'drone', 'strike',
  'terrorism', 'terror', 'intelligence', 'espionage', 'cyber attack', 'border',
  'ceasefire', 'invasion', 'occupation',
  // Trade & Economy
  'tariff', 'sanction', 'trade war', 'trade deal', 'trade agreement', 'export ban',
  'import duty', 'economic sanction', 'embargo', 'trade deficit', 'trade surplus',
  'free trade', 'wto', 'imf', 'world bank', 'currency', 'oil price', 'opec',
  'supply chain', 'chips act', 'semiconductor',
  // Diplomacy
  'ambassador', 'embassy', 'consulate', 'extradition', 'asylum', 'refugee',
  'visa ban', 'travel ban', 'state visit', 'foreign minister', 'secretary of state',
  // US specific
  'white house', 'congress', 'senate', 'pentagon', 'state department', 'cia', 'fbi',
  'president biden', 'president trump', 'us-china', 'us-russia', 'us-india',
  'indo-pacific', 'taiwan', 'ukraine', 'iran', 'north korea',
  // India specific
  'modi', 'india-china', 'india-pakistan', 'kashmir', 'ladakh', 'arunachal',
  'lok sabha', 'rajya sabha', 'mea india', 'jaishankar', 'indian army',
  'brics', 'sco', 'asean', 'south asia', 'indian ocean',
  // Countries/regions of interest
  'china', 'russia', 'pakistan', 'israel', 'gaza', 'palestine', 'iran',
  'north korea', 'taiwan', 'afghanistan', 'myanmar', 'bangladesh', 'sri lanka',
  'middle east', 'south china sea', 'arctic',
];

// --- Category Classification ---
const CATEGORIES = {
  'Trade & Economy': [
    'tariff', 'sanction', 'trade', 'economic', 'export', 'import', 'wto', 'imf',
    'world bank', 'currency', 'oil price', 'opec', 'supply chain', 'semiconductor',
    'chips act', 'embargo', 'gdp', 'inflation', 'fiscal', 'monetary',
  ],
  'Diplomacy & Relations': [
    'diplomacy', 'diplomat', 'bilateral', 'multilateral', 'summit', 'treaty',
    'accord', 'pact', 'alliance', 'ambassador', 'embassy', 'consulate',
    'state visit', 'foreign minister', 'secretary of state', 'united nations',
    'general assembly', 'g7', 'g20', 'quad', 'brics', 'sco', 'asean',
  ],
  'Defense & Security': [
    'military', 'defense', 'defence', 'missile', 'nuclear', 'weapon', 'army',
    'navy', 'air force', 'pentagon', 'war', 'conflict', 'troops', 'soldier',
    'drone', 'strike', 'terrorism', 'terror', 'intelligence', 'espionage',
    'cyber attack', 'border', 'ceasefire', 'invasion', 'nato',
  ],
};

// --- Country Detection ---
const US_KEYWORDS = [
  'united states', 'america', 'us ', 'u.s.', 'washington', 'white house',
  'congress', 'senate', 'pentagon', 'biden', 'trump', 'republican', 'democrat',
  'state department', 'cia', 'fbi', 'california', 'new york', 'texas',
];

const INDIA_KEYWORDS = [
  'india', 'indian', 'modi', 'delhi', 'mumbai', 'lok sabha', 'rajya sabha',
  'jaishankar', 'kashmir', 'ladakh', 'arunachal', 'hindu', 'bjp',
  'indian army', 'isro', 'chennai', 'kolkata', 'bangalore',
];

// --- Cache ---
let newsCache = {
  articles: [],
  lastFetched: null,
  fetching: false,
};

function isGeopolitical(text) {
  const lower = text.toLowerCase();
  return GEO_KEYWORDS.some(kw => lower.includes(kw));
}

function classifyCategory(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    scores[cat] = keywords.filter(kw => lower.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'Geopolitics';
}

function detectCountry(text) {
  const lower = text.toLowerCase();
  const countries = [];
  if (US_KEYWORDS.some(kw => lower.includes(kw))) countries.push('US');
  if (INDIA_KEYWORDS.some(kw => lower.includes(kw))) countries.push('India');
  return countries.length > 0 ? countries : ['World'];
}

async function fetchAllFeeds() {
  if (newsCache.fetching) return;
  newsCache.fetching = true;
  console.log(`[${new Date().toLocaleTimeString()}] Fetching news feeds...`);

  const articles = [];

  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      try {
        const data = await parser.parseURL(feed.url);
        return (data.items || []).map(item => ({
          title: item.title || '',
          link: item.link || '',
          description: (item.contentSnippet || item.content || item.summary || '').slice(0, 300),
          pubDate: item.pubDate || item.isoDate || '',
          source: feed.source,
          feedRegion: feed.region,
        }));
      } catch (err) {
        console.warn(`  Failed to fetch ${feed.source} (${feed.url}): ${err.message}`);
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  // Filter for geopolitical relevance
  const filtered = articles.filter(a => {
    const text = `${a.title} ${a.description}`;
    return isGeopolitical(text);
  });

  // Classify and tag
  const enriched = filtered.map(a => {
    const text = `${a.title} ${a.description}`;
    return {
      ...a,
      category: classifyCategory(text),
      countries: detectCountry(text),
      timestamp: a.pubDate ? new Date(a.pubDate).getTime() : Date.now(),
    };
  });

  // Sort by date (newest first) and deduplicate by title similarity
  enriched.sort((a, b) => b.timestamp - a.timestamp);

  const seen = new Set();
  const deduped = enriched.filter(a => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  newsCache.articles = deduped;
  newsCache.lastFetched = new Date().toISOString();
  newsCache.fetching = false;

  console.log(`  Fetched ${articles.length} total articles, ${deduped.length} geopolitical after filtering.`);
}

// --- Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- API ---
app.get('/api/news', (req, res) => {
  const { country, category, search, page = 1, limit = 30 } = req.query;
  let articles = [...newsCache.articles];

  if (country && country !== 'All') {
    articles = articles.filter(a => a.countries.includes(country));
  }
  if (category && category !== 'All') {
    articles = articles.filter(a => a.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }

  const start = (parseInt(page) - 1) * parseInt(limit);
  const paged = articles.slice(start, start + parseInt(limit));

  res.json({
    total: articles.length,
    page: parseInt(page),
    lastFetched: newsCache.lastFetched,
    articles: paged,
  });
});

app.get('/api/refresh', async (req, res) => {
  await fetchAllFeeds();
  res.json({ success: true, total: newsCache.articles.length, lastFetched: newsCache.lastFetched });
});

app.get('/api/stats', (req, res) => {
  const articles = newsCache.articles;
  const byCategory = {};
  const byCountry = {};
  const bySource = {};

  for (const a of articles) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    for (const c of a.countries) {
      byCountry[c] = (byCountry[c] || 0) + 1;
    }
    bySource[a.source] = (bySource[a.source] || 0) + 1;
  }

  res.json({ total: articles.length, byCategory, byCountry, bySource, lastFetched: newsCache.lastFetched });
});

// --- Start ---
app.listen(PORT, async () => {
  console.log(`\n  Geopolitical News Dashboard`);
  console.log(`  Running at http://localhost:${PORT}\n`);
  await fetchAllFeeds();
});

// Refresh feeds every 30 minutes
cron.schedule('*/30 * * * *', () => {
  fetchAllFeeds();
});
