const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /api/* requests to http://localhost:8800/api/*
  // No path rewrite - keep the /api prefix
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8800',
      changeOrigin: true,
      // Don't rewrite paths - forward as-is
      logLevel: 'debug'
    })
  );
};

