const apiKeyMiddleware = (req, res, next) => {
  const configuredApiKey = process.env.API_KEY;

  if (!configuredApiKey) {
    return next();
  }

  if (req.path === '/health') {
    return next();
  }

  const incomingApiKey = req.headers['x-api-key'];

  if (!incomingApiKey || incomingApiKey !== configuredApiKey) {
    return res.status(401).json({ message: 'Invalid or missing API key' });
  }

  return next();
};

module.exports = apiKeyMiddleware;
