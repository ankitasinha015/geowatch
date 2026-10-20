process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cron = require('node-cron');
const path = require('path');
const { fetchAllFeeds, cache } = require('./api/_lib/feeds');

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API
app.get('/api/news', async (req, res) => {
  const { country, category, search, page = 1, limit = 30 } = req.query;
  const data = await fetchAllFeeds();
  let articles = [...data.articles];

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
    lastFetched: data.lastFetched,
    articles: paged,
  });
});

app.get('/api/refresh', async (req, res) => {
  cache.lastFetched = null;
  const data = await fetchAllFeeds();
  res.json({ success: true, total: data.articles.length, lastFetched: data.lastFetched });
});

app.get('/api/stats', async (req, res) => {
  const data = await fetchAllFeeds();
  const articles = data.articles;
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

  res.json({ total: articles.length, byCategory, byCountry, bySource, lastFetched: data.lastFetched });
});

// Start
app.listen(PORT, async () => {
  console.log(`\n  Pulse — News Intelligence Dashboard`);
  console.log(`  http://localhost:${PORT}\n`);
  await fetchAllFeeds();
});

// Refresh every 15 minutes
cron.schedule('*/15 * * * *', () => {
  cache.lastFetched = null;
  fetchAllFeeds();
});
