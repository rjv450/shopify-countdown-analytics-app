import { render } from 'preact';
import { CountdownTimer } from './CountdownTimer.jsx';

function getProductIdFromUrl() {
  const match = window.location.pathname.match(/\/products\/([^/]+)/);
  return match ? match[1] : null;
}

function getShopFromHostname() {
  const host = window.location.hostname;
  // Extract shop domain from hostname (e.g., development-store-15820042444.myshopify.com)
  if (host.includes('.myshopify.com')) {
    return host;
  }
  // Fallback: try to construct from hostname if it's a custom domain
  // This is a fallback for development/testing
  return null;
}

function mount() {
  const container = document.getElementById('countdown-timer-block');
  if (!container) return;

  const productId = container.getAttribute('data-product-id') || getProductIdFromUrl();
  let shop = container.getAttribute('data-shop');
  
  // Fallback to hostname if data-shop is not set
  if (!shop) {
    shop = getShopFromHostname();
  }
  
  const apiUrl = container.getAttribute('data-api-url') || 'http://localhost:3001/api/public/timer';

  // Log for debugging
  if (!shop) {
    console.warn('Countdown Timer: Shop domain not found. Make sure the block is added to a product page.');
    return;
  }
  
  if (!productId) {
    console.warn('Countdown Timer: Product ID not found.');
    return;
  }

  const mountNode = document.createElement('div');
  mountNode.id = 'countdown-timer-widget';
  container.appendChild(mountNode);

  render(<CountdownTimer productId={productId} shop={shop} apiUrl={apiUrl} />, mountNode);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}



