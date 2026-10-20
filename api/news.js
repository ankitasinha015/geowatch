const { fetchAllFeeds } = require('./_lib/feeds');

module.exports = async function handler(req, res) {
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

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.json({
    total: articles.length,
    page: parseInt(page),
    lastFetched: data.lastFetched,
    articles: paged,
  });
};
