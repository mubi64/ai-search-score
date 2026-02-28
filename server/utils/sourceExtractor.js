/**
 * Extract URLs and sources from LLM response text
 * Returns an object mapping source domains to arrays of URL objects
 */

/**
 * Extract URLs from text using regex patterns
 * @param {string} text - The LLM response text
 * @returns {Object} - Object mapping domain names to arrays of {url, context} objects
 */
export function extractSources(text) {
    if (!text || typeof text !== 'string') return {};

    const sources = {};

    // Regex to match URLs (http, https, and www patterns)
    const urlPatterns = [
        // Standard URLs with protocol
        /https?:\/\/(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)(?:\/[^\s<>"\[\]]*)?/gi,
        // URLs starting with www
        /www\.([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)(?:\/[^\s<>"\[\]]*)?/gi
    ];

    // Track unique URLs to avoid duplicates
    const seenUrls = new Set();

    urlPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const fullUrl = match[0].replace(/[.,;:!?)'"]+$/, ''); // Clean trailing punctuation
            const domain = match[1]?.toLowerCase();

            if (!domain || seenUrls.has(fullUrl)) continue;
            seenUrls.add(fullUrl);

            // Get context around the URL (surrounding text)
            const urlIndex = text.indexOf(fullUrl);
            const contextStart = Math.max(0, urlIndex - 100);
            const contextEnd = Math.min(text.length, urlIndex + fullUrl.length + 100);
            let context = text.slice(contextStart, contextEnd).trim();

            // Clean up context
            if (contextStart > 0) context = '...' + context;
            if (contextEnd < text.length) context = context + '...';

            // Group by domain
            const domainName = extractDomainName(domain);
            if (!sources[domainName]) {
                sources[domainName] = [];
            }

            sources[domainName].push({
                url: fullUrl.startsWith('http') ? fullUrl : `https://${fullUrl}`,
                context: context
            });
        }
    });

    return sources;
}

/**
 * Extract a readable domain name from a domain string
 */
function extractDomainName(domain) {
    // Remove common prefixes
    let name = domain.replace(/^www\./i, '');

    // Get the main domain (e.g., "example" from "example.com")
    const parts = name.split('.');
    if (parts.length >= 2) {
        // Handle cases like co.uk, com.au
        const tlds = ['co', 'com', 'org', 'net', 'gov', 'edu'];
        if (parts.length > 2 && tlds.includes(parts[parts.length - 2])) {
            name = parts[parts.length - 3];
        } else {
            name = parts[parts.length - 2];
        }
    }

    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Merge multiple source objects into one
 * @param  {...Object} sourceObjects - Multiple source objects to merge
 * @returns {Object} - Merged sources
 */
export function mergeSources(...sourceObjects) {
    const merged = {};

    sourceObjects.forEach(sources => {
        if (!sources) return;

        Object.entries(sources).forEach(([domain, urls]) => {
            if (!merged[domain]) {
                merged[domain] = [];
            }

            // Add URLs that don't already exist
            urls.forEach(urlData => {
                const exists = merged[domain].some(existing => existing.url === urlData.url);
                if (!exists) {
                    merged[domain].push(urlData);
                }
            });
        });
    });

    return merged;
}
