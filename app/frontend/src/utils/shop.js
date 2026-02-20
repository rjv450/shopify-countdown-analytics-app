/**
 * Get the shop domain from URL or return development store
 * In embedded apps, Shopify automatically adds ?shop=... to the URL
 */
export function getShopDomain() {
  // Try to get shop from URL query parameter (Shopify adds this automatically)
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  
  if (shop) {
    return shop;
  }
  
  // Fallback to development store for local testing
  // This should only be used when testing outside of Shopify admin
  return 'development-store-15820042444.myshopify.com';
}

/**
 * Get the API base URL from environment variables
 * Priority:
 * 1. Check if in Shopify admin (ngrok) - use relative URLs (proxy handles it)
 * 2. VITE_API_URL (if set and not localhost when in Shopify admin)
 * 3. Localhost: use proxy (empty string)
 * 4. Fallback: relative URLs
 */
export function getApiBaseUrl() {
  // Check if we're in Shopify admin (has shop and host params, and not localhost)
  const urlParams = new URLSearchParams(window.location.search);
  const isShopifyAdmin = urlParams.get('shop') && urlParams.get('host') && 
    window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  
  // Priority 1: If in Shopify admin (ngrok), use relative URLs
  // The backend should be accessible via the same ngrok domain or proxy
  if (isShopifyAdmin) {
    console.log('[getApiBaseUrl] Shopify admin detected, using relative URLs (proxy)');
    return '';
  }
  
  // Priority 2: If VITE_API_URL is explicitly set, use it (but only if not localhost in Shopify admin)
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    // Don't use localhost URL if we're in Shopify admin context
    if (viteApiUrl.includes('localhost') && isShopifyAdmin) {
      console.warn('[getApiBaseUrl] VITE_API_URL is localhost but in Shopify admin, using relative URLs instead');
      return '';
    }
    console.log('[getApiBaseUrl] Using VITE_API_URL:', viteApiUrl);
    return viteApiUrl;
  }
  
  // Check if we're on localhost (Vite dev server)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Priority 3: For localhost (Vite dev server), use empty string to leverage proxy
  // The proxy in vite.config.js will handle /api requests and forward to backend
  if (isLocalhost) {
    console.log('[getApiBaseUrl] Using proxy (localhost)');
    return '';
  }
  
  // Last resort: relative URLs (proxy will handle it)
  console.log('[getApiBaseUrl] Using relative URLs (fallback)');
  return '';
}




