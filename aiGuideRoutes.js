const SUPPORTED = ['en', 'ar', 'de', 'fr', 'es', 'zh'];

module.exports = (req, res, next) => {
  const requested = String(req.query.lang || req.get('Accept-Language') || 'en')
    .split(',')[0]
    .split('-')[0]
    .toLowerCase();

  req.lang = SUPPORTED.includes(requested) ? requested : 'en';
  next();
};
