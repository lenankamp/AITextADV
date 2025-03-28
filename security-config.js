// Convert CSP object to header string
const cspHeader = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: *",
        "connect-src 'self' *",  // Allow connections to any domain for API flexibility
        "worker-src 'self' blob:",
        "media-src 'self' blob:",
    ].join('; ')
};

// Function to validate navigation URLs
function validateNavigation(url) {
    try {
        const urlObj = new URL(url);
        // Only allow navigation to http/https URLs
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

module.exports = {
    cspHeader,
    validateNavigation
};