const apiKeyMiddleware = (req, res, next) => {
  const configuredApiKey = String(process.env.API_KEY || '').trim();

  // Explicitly require API_KEY to be set; fail fast to avoid open access.
  if (!configuredApiKey) {
    return res.status(500).json({ message: 'Server API key not configured' });
  }

  if (req.path === '/health') {
    return next();
  }

  const incomingApiKey = String(req.headers['x-api-key'] || '').trim();

  if (!incomingApiKey || incomingApiKey !== configuredApiKey) {
    return res.status(401).json({ message: 'Invalid or missing API key' });
  }

  return next();
};

module.exports = apiKeyMiddleware;
