const RSSParser = require('rss-parser');

const parser = new RSSParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  requestOptions: {
    rejectUnauthorized: false,
  },
});

// Each feed has a `category` — if set, ALL articles from that feed go into
// that category without keyword filtering. Only feeds with category: null
// go through keyword classification.
const FEEDS = [
  // === FUNDING & STARTUPS (direct — every article is funding news) ===
  { url: 'https://techcrunch.com/category/venture/feed/', source: 'TechCrunch', region: 'us', category: 'Funding' },
  { url: 'https://techcrunch.com/category/startups/feed/', source: 'TechCrunch', region: 'us', category: 'Funding' },
  { url: 'https://news.crunchbase.com/feed/', source: 'Crunchbase', region: 'us', category: 'Funding' },
  { url: 'https://www.saastr.com/feed/', source: 'SaaStr', region: 'us', category: 'Funding' },
  { url: 'https://feeds.feedburner.com/ycombinator', source: 'Hacker News', region: 'us', category: 'Funding' },
  { url: 'https://techfundingnews.com/feed/', source: 'Tech Funding News', region: 'world', category: 'Funding' },
  { url: 'https://sifted.eu/feed', source: 'Sifted', region: 'world', category: 'Funding' },
  { url: 'https://inc42.com/feed/', source: 'Inc42', region: 'india', category: 'Funding' },
  { url: 'https://entrackr.com/feed/', source: 'Entrackr', region: 'india', category: 'Funding' },
  { url: 'https://yourstory.com/feed', source: 'YourStory', region: 'india', category: 'Funding' },

  // === AI & TECH (direct — every article is AI/tech news) ===
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch', region: 'us', category: 'AI & Tech' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge', region: 'us', category: 'AI & Tech' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', source: 'Ars Technica', region: 'us', category: 'AI & Tech' },
  { url: 'https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml', source: 'MIT News', region: 'us', category: 'AI & Tech' },
  { url: 'https://www.artificialintelligence-news.com/feed/', source: 'AI News', region: 'us', category: 'AI & Tech' },
  { url: 'https://the-decoder.com/feed/', source: 'The Decoder', region: 'world', category: 'AI & Tech' },
  { url: 'https://www.marktechpost.com/feed/', source: 'MarkTechPost', region: 'us', category: 'AI & Tech' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', region: 'us', category: 'AI & Tech' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC Tech', region: 'world', category: 'AI & Tech' },

  // === GEOPOLITICS & WORLD (general — keyword filtered) ===
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC', region: 'world', category: null },
  { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC', region: 'us', category: null },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC', region: 'india', category: null },
  { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', source: 'BBC', region: 'world', category: null },
  { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC', region: 'world', category: null },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business', region: 'world', category: null },
  { url: 'https://feeds.feedburner.com/ndtvnews-india-news', source: 'NDTV', region: 'india', category: null },
  { url: 'https://feeds.feedburner.com/ndtvnews-world-news', source: 'NDTV', region: 'world', category: null },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', region: 'world', category: null },
  { url: 'https://feedx.net/rss/ap.xml', source: 'AP News', region: 'world', category: null },
  { url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', source: 'CNBC', region: 'us', category: null },
  { url: 'https://www.france24.com/en/rss', source: 'France 24', region: 'world', category: null },
  { url: 'https://www.dw.com/rss/en/top-stories/s-9097', source: 'DW News', region: 'world', category: null },
  { url: 'https://english.alarabiya.net/tools/rss', source: 'Al Arabiya', region: 'world', category: null },
  { url: 'https://www3.nhk.or.jp/nhkworld/en/news/feeds/', source: 'NHK World', region: 'world', category: null },
];

// Keywords only used for general news feeds (category: null)
const CATEGORIES = {
  'Funding': [
    'funding', 'funded', 'raises', 'raised', 'seed round', 'series a', 'series b',
    'series c', 'series d', 'pre-seed', 'ipo', 'valuation', 'unicorn',
    'venture capital', 'angel investor', 'accelerator', 'fundraise',
    'startup acquisition', 'acqui-hire', 'acquired by', 'buyout',
    'million round', 'billion round', 'investment round',
  ],
  'AI & Tech': [
    'artificial intelligence', 'generative ai', 'openai', 'chatgpt', 'gpt-',
    'anthropic', 'claude', 'deepmind', 'gemini ai', 'meta ai',
    'llama', 'mistral', 'ai model', 'large language', 'llm', 'machine learning',
    'deep learning', 'neural network', 'ai regulation', 'ai safety',
    'ai chip', 'nvidia', 'silicon valley', 'sam altman',
    'autonomous', 'self-driving', 'robotics', 'data center',
    'foundation model', 'frontier model', 'agi',
    'quantum computing', 'ai agent', 'gpu', 'tpu',
  ],
  'Trade & Economy': [
    'tariff', 'sanction', 'trade war', 'trade deal', 'trade agreement', 'export ban',
    'import duty', 'embargo', 'trade deficit', 'wto', 'imf', 'world bank',
    'oil price', 'opec', 'supply chain', 'semiconductor', 'gdp', 'inflation',
    'interest rate', 'federal reserve', 'central bank', 'recession',
    'economic growth', 'stock market',
  ],
  'Diplomacy & Relations': [
    'diplomacy', 'diplomat', 'bilateral', 'multilateral', 'summit', 'treaty',
    'accord', 'pact', 'alliance', 'ambassador', 'embassy',
    'state visit', 'foreign minister', 'secretary of state', 'united nations',
    'general assembly', 'g7', 'g20', 'quad', 'brics', 'sco', 'asean',
    'asylum', 'refugee', 'visa ban', 'travel ban', 'extradition',
  ],
  'Defense & Security': [
    'military', 'defense', 'defence', 'missile', 'nuclear', 'weapon', 'army',
    'navy', 'air force', 'pentagon', 'war ', 'conflict', 'troops', 'soldier',
    'drone strike', 'terrorism', 'terror attack', 'espionage',
    'cyber attack', 'ceasefire', 'invasion', 'nato', 'occupation',
  ],
  'Geopolitics': [
    'geopolit', 'foreign policy', 'white house', 'congress', 'senate',
    'state department', 'president biden', 'president trump',
    'us-china', 'us-russia', 'indo-pacific', 'taiwan strait', 'ukraine',
    'north korea', 'modi government', 'india-china', 'india-pakistan',
    'kashmir', 'israel', 'gaza', 'palestine', 'protest', 'coup',
    'election', 'referendum', 'political crisis', 'regime',
    'south china sea', 'middle east',
  ],
};

const US_KEYWORDS = [
  'united states', 'america', 'u.s.', 'washington', 'white house',
  'congress', 'senate', 'pentagon', 'biden', 'trump', 'republican', 'democrat',
  'california', 'new york', 'texas', 'silicon valley', 'san francisco',
];

const INDIA_KEYWORDS = [
  'india', 'indian', 'modi', 'delhi', 'mumbai', 'lok sabha', 'rajya sabha',
  'jaishankar', 'kashmir', 'bjp', 'isro', 'bangalore', 'bengaluru',
  'hyderabad', 'chennai', 'kolkata',
];

let cache = {
  articles: [],
  lastFetched: null,
  fetching: false,
};

const CACHE_TTL = 15 * 60 * 1000;

function classifyCategory(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    scores[cat] = keywords.filter(kw => lower.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : null;
}

function detectCountry(text) {
  const lower = text.toLowerCase();
  const countries = [];
  if (US_KEYWORDS.some(kw => lower.includes(kw))) countries.push('US');
  if (INDIA_KEYWORDS.some(kw => lower.includes(kw))) countries.push('India');
  return countries.length > 0 ? countries : ['World'];
}

async function fetchAllFeeds() {
  if (cache.fetching) return cache;
  if (cache.lastFetched && (Date.now() - new Date(cache.lastFetched).getTime()) < CACHE_TTL) {
    return cache;
  }

  cache.fetching = true;
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
          feedCategory: feed.category,
        }));
      } catch {
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  // For feeds with a set category, include ALL articles.
  // For general feeds (category: null), only include if keywords match.
  const enriched = [];
  for (const a of articles) {
    const text = `${a.title} ${a.description}`;
    let category;

    if (a.feedCategory) {
      category = a.feedCategory;
    } else {
      category = classifyCategory(text);
      if (!category) continue;
    }

    enriched.push({
      ...a,
      category,
      countries: detectCountry(text),
      timestamp: a.pubDate ? new Date(a.pubDate).getTime() : Date.now(),
    });
  }

  enriched.sort((a, b) => b.timestamp - a.timestamp);

  const seen = new Set();
  const deduped = enriched.filter(a => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  cache.articles = deduped;
  cache.lastFetched = new Date().toISOString();
  cache.fetching = false;

  return cache;
}

module.exports = { fetchAllFeeds, cache };
