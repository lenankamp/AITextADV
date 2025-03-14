// CSP Configuration
const csp = {
    'default-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"], // Allow inline styles
    'script-src': ["'self'"],
    'connect-src': ["'self'", "https://api.luan.tools", "https://openrouter.ai", "https://*.gradio.live"],
    'img-src': ["'self'", "blob:", "data:"],
    'worker-src': ["'self'", "blob:"],
};

// Export CSP configuration
module.exports = { csp };