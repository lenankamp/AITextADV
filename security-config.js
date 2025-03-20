// CSP Configuration
const csp = {
    'default-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"], // Allow inline styles
    'script-src': ["'self'"],
    'connect-src': [
        "'self'", 
        "https://api.luan.tools", 
        "https://openrouter.ai", 
        "https://*.gradio.live",
        "http://192.168.86.180:5001",
        "http://192.168.86.180:7860"
    ],
    'img-src': ["'self'", "blob:", "data:"],
    'worker-src': ["'self'", "blob:"],
};

// Convert CSP object to header string
const cspHeader = {
    'Content-Security-Policy': Object.entries(csp)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ')
};

// Function to validate navigation URLs
function validateNavigation(url) {
    const allowedDomains = [
        'api.luan.tools',
        'openrouter.ai',
        '192.168.86.180'
    ];
    try {
        const parsedUrl = new URL(url);
        return allowedDomains.some(domain => parsedUrl.hostname.includes(domain));
    } catch {
        return false;
    }
}

module.exports = { cspHeader, validateNavigation };