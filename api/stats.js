const { fetchAllFeeds } = require('./_lib/feeds');

module.exports = async function handler(req, res) {
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

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.json({ total: articles.length, byCategory, byCountry, bySource, lastFetched: data.lastFetched });
};
