const { fetchAllFeeds, cache } = require('./_lib/feeds');

module.exports = async function handler(req, res) {
  cache.lastFetched = null;
  const data = await fetchAllFeeds();
  res.json({
    ok: true,
    total: data.articles.length,
    lastFetched: data.lastFetched,
  });
};
