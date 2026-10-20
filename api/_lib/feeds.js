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

const FEEDS = [
  // Geopolitics / World News (all free)
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC', region: 'world' },
  { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC', region: 'us' },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC', region: 'india' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business', region: 'world' },
  { url: 'https://feeds.feedburner.com/ndtvnews-india-news', source: 'NDTV', region: 'india' },
  { url: 'https://feeds.feedburner.com/ndtvnews-world-news', source: 'NDTV', region: 'world' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', region: 'world' },
  { url: 'https://feedx.net/rss/ap.xml', source: 'AP News', region: 'world' },
  { url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', source: 'CNBC', region: 'us' },

  // AI & Tech (all free)
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC Tech', region: 'us' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', region: 'us' },
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch AI', region: 'us' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', source: 'Ars Technica', region: 'us' },
  { url: 'https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml', source: 'MIT News', region: 'us' },
  { url: 'https://thenextweb.com/neural/feed', source: 'TNW Neural', region: 'us' },
  { url: 'https://www.artificialintelligence-news.com/feed/', source: 'AI News', region: 'us' },

  // Funding & Startups (all free)
  { url: 'https://techcrunch.com/category/venture/feed/', source: 'TechCrunch VC', region: 'us' },
  { url: 'https://techcrunch.com/category/startups/feed/', source: 'TechCrunch Startups', region: 'us' },
  { url: 'https://news.crunchbase.com/feed/', source: 'Crunchbase News', region: 'us' },
  { url: 'https://www.saastr.com/feed/', source: 'SaaStr', region: 'us' },
  { url: 'https://feeds.feedburner.com/ycombinator', source: 'Y Combinator', region: 'us' },
  { url: 'https://techfundingnews.com/feed/', source: 'Tech Funding News', region: 'us' },
  { url: 'https://sifted.eu/feed', source: 'Sifted', region: 'world' },
];

const CATEGORIES = {
  'Funding': [
    'funding', 'funded', 'raises', 'raised', 'seed round', 'series a', 'series b',
    'series c', 'series d', 'series e', 'pre-seed', 'ipo', 'spac', 'valuation',
    'unicorn', 'decacorn', 'venture capital', 'vc ', 'vc-', 'angel investor',
    'y combinator', 'yc ', 'accelerator', 'incubator', 'sequoia', 'andreessen',
    'a16z', 'tiger global', 'softbank vision', 'accel', 'benchmark',
    'greylock', 'khosla', 'lightspeed', 'index ventures', 'bessemer',
    'fundraise', 'fundraising', 'round of funding', 'capital raise',
    'growth round', 'debt financing', 'revenue financing', 'bridge round',
    'down round', 'up round', 'term sheet', 'lead investor', 'co-investor',
    'pitch deck', 'startup acquisition', 'acqui-hire', 'merger', 'acquisition',
    'acquired by', 'buyout', 'exit', 'went public', 'listing',
    'crunchbase', 'pitchbook', 'dealroom', 'pre-money', 'post-money',
    '$m funding', '$b funding', 'million funding', 'billion funding',
    'million round', 'billion round', 'seed funding', 'venture funding',
    'startup fund', 'investment round',
  ],
  'AI & Tech': [
    'artificial intelligence', 'generative ai', 'openai', 'chatgpt', 'gpt-',
    'anthropic', 'claude', 'google deepmind', 'deepmind', 'gemini ai', 'meta ai',
    'llama', 'mistral', 'ai model', 'large language', 'llm', 'machine learning',
    'deep learning', 'neural network', 'ai regulation', 'ai safety', 'ai policy',
    'ai chip', 'nvidia', 'ai startup', 'silicon valley', 'sam altman',
    'sundar pichai', 'satya nadella', 'mark zuckerberg', 'elon musk',
    'autonomous', 'self-driving', 'robotics', 'ai arms race', 'compute',
    'data center', 'cloud computing', 'microsoft ai', 'google ai', 'apple ai',
    'amazon ai', 'hugging face', 'stable diffusion', 'midjourney',
    'ai copyright', 'ai governance', 'eu ai act', 'executive order ai',
    'transformer model', 'diffusion model', 'text-to-image', 'text-to-video',
    'foundation model', 'frontier model', 'agi', 'artificial general',
    'reinforcement learning', 'computer vision', 'natural language processing',
    'nlp', 'ai agent', 'multimodal', 'open source ai', 'open-source ai',
    'ai benchmark', 'gpu', 'tpu', 'inference', 'fine-tuning', 'fine tuning',
    'prompt engineering', 'rag ', 'retrieval augmented', 'vector database',
    'embeddings', 'token', 'context window', 'reasoning model',
    'xai', 'groq', 'perplexity', 'cohere', 'databricks', 'snowflake ai',
    'ai hardware', 'neuromorphic', 'quantum computing', 'quantum computer',
  ],
  'Trade & Economy': [
    'tariff', 'sanction', 'trade war', 'trade deal', 'trade agreement', 'export ban',
    'import duty', 'economic sanction', 'embargo', 'trade deficit', 'trade surplus',
    'free trade', 'wto', 'imf', 'world bank', 'currency', 'oil price', 'opec',
    'supply chain', 'chips act', 'semiconductor', 'gdp', 'inflation', 'fiscal',
    'monetary', 'interest rate', 'federal reserve', 'central bank', 'recession',
    'economic growth', 'stock market', 'bond market', 'commodity',
  ],
  'Diplomacy & Relations': [
    'diplomacy', 'diplomat', 'bilateral', 'multilateral', 'summit', 'treaty',
    'accord', 'pact', 'alliance', 'ambassador', 'embassy', 'consulate',
    'state visit', 'foreign minister', 'secretary of state', 'united nations',
    'general assembly', 'g7', 'g20', 'quad', 'brics', 'sco', 'asean',
    'extradition', 'asylum', 'refugee', 'visa ban', 'travel ban',
  ],
  'Defense & Security': [
    'military', 'defense', 'defence', 'missile', 'nuclear', 'weapon', 'army',
    'navy', 'air force', 'pentagon', 'war', 'conflict', 'troops', 'soldier',
    'drone', 'strike', 'terrorism', 'terror', 'intelligence', 'espionage',
    'cyber attack', 'border', 'ceasefire', 'invasion', 'nato', 'occupation',
  ],
  'Geopolitics': [
    'geopolit', 'foreign policy', 'white house', 'congress', 'senate',
    'state department', 'cia', 'fbi', 'president biden', 'president trump',
    'us-china', 'us-russia', 'us-india', 'indo-pacific', 'taiwan', 'ukraine',
    'iran', 'north korea', 'modi', 'india-china', 'india-pakistan', 'kashmir',
    'ladakh', 'arunachal', 'lok sabha', 'rajya sabha', 'jaishankar',
    'china', 'russia', 'pakistan', 'israel', 'gaza', 'palestine',
    'afghanistan', 'myanmar', 'middle east', 'south china sea', 'arctic',
  ],
};

const US_KEYWORDS = [
  'united states', 'america', 'us ', 'u.s.', 'washington', 'white house',
  'congress', 'senate', 'pentagon', 'biden', 'trump', 'republican', 'democrat',
  'state department', 'cia', 'fbi', 'california', 'new york', 'texas',
  'silicon valley', 'san francisco', 'seattle',
];

const INDIA_KEYWORDS = [
  'india', 'indian', 'modi', 'delhi', 'mumbai', 'lok sabha', 'rajya sabha',
  'jaishankar', 'kashmir', 'ladakh', 'arunachal', 'hindu', 'bjp',
  'indian army', 'isro', 'chennai', 'kolkata', 'bangalore', 'bengaluru',
  'hyderabad',
];

// Module-level cache survives across warm serverless invocations
let cache = {
  articles: [],
  lastFetched: null,
  fetching: false,
};

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

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

  const filtered = articles.filter(a => {
    const text = `${a.title} ${a.description}`;
    return classifyCategory(text) !== null;
  });

  const enriched = filtered.map(a => {
    const text = `${a.title} ${a.description}`;
    return {
      ...a,
      category: classifyCategory(text) || 'Geopolitics',
      countries: detectCountry(text),
      timestamp: a.pubDate ? new Date(a.pubDate).getTime() : Date.now(),
    };
  });

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
