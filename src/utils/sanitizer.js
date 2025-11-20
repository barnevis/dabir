/**
 * Sanitizes HTML string to prevent XSS attacks.
 * Removes dangerous tags, event handlers, and malicious URLs.
 * 
 * @param {string} html - The dirty HTML string.
 * @returns {string} - The sanitized HTML string.
 */
export function sanitize(html) {
    if (!html) return '';
    if (typeof html !== 'string') return '';

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body;

        // List of tags that are unsafe and should be removed entirely
        const bannedTags = [
            'SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'APPLET', 
            'LINK', 'STYLE', 'META', 'FORM', 'BASE', 'INPUT', 'BUTTON'
        ];

        // Convert to array to avoid live collection issues during removal
        const nodes = Array.from(body.querySelectorAll('*'));

        for (const node of nodes) {
            // 1. Remove banned tags
            if (bannedTags.includes(node.tagName)) {
                node.remove();
                continue;
            }

            // 2. Sanitize Attributes
            const attrs = Array.from(node.attributes);
            for (const attr of attrs) {
                const name = attr.name.toLowerCase();
                const value = attr.value.toLowerCase();

                // Rule: Remove event handlers (e.g., onclick, onload, onmouseover)
                if (name.startsWith('on')) {
                    node.removeAttribute(attr.name);
                    continue;
                }

                // Rule: Sanitize URLs in href, src, action, data
                if (['href', 'src', 'action', 'data', 'cite', 'poster'].includes(name)) {
                    // Remove hidden control characters and whitespace for the check
                    const cleanValue = value.replace(/[\s\x00-\x1f]/g, '');
                    
                    if (cleanValue.startsWith('javascript:') || 
                        cleanValue.startsWith('vbscript:') || 
                        cleanValue.startsWith('data:')) {
                        node.removeAttribute(attr.name);
                    }
                }

                // Rule: Sanitize Style attribute
                if (name === 'style') {
                    // Prevent 'expression' (IE legacy) and 'behavior' (IE legacy) and javascript in styles
                    if (value.includes('expression') || 
                        value.includes('behavior') || 
                        value.includes('javascript:') ||
                        value.includes('url(')) { // block urls in style for extra safety
                         node.removeAttribute(attr.name);
                    }
                }
            }
        }

        return body.innerHTML;
    } catch (error) {
        console.error('Dabir.js Error: Sanitization failed.', error);
        // Fail safe: return empty string or encoded text if parsing fails
        return ''; 
    }
}