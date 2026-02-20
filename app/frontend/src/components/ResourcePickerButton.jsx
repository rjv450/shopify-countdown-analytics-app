import React from 'react';

/**
 * ResourcePickerButton - A button that opens Shopify's ResourcePicker
 * Only works when App Bridge is available (embedded app context)
 * Uses the shopify.resourcePicker API (App Bridge v4+)
 */
export default function ResourcePickerButton({ 
  resourceType = 'product', 
  onSelection, 
  buttonText = 'Browse',
  className = 'btn btn-secondary'
}) {
  // Check if shopify global is available (App Bridge v4+)
  const isAvailable = typeof window !== 'undefined' && window.shopify;

  if (!isAvailable) {
    return null;
  }

  const handleClick = async () => {
    try {
      // Debug: Log what's available in window.shopify
      console.log('[ResourcePicker] window.shopify:', window.shopify);
      console.log('[ResourcePicker] Available methods:', Object.keys(window.shopify || {}));
      
      // Try different API patterns for App Bridge v4+
      let result;
      
      // Pattern 1: Try as a function call (App Bridge v4+)
      if (typeof window.shopify.resourcePicker === 'function') {
        console.log('[ResourcePicker] Using function call pattern');
        result = await window.shopify.resourcePicker({
          type: resourceType, // 'product' or 'collection'
          action: 'select',
          multiple: true,
        });
      }
      // Pattern 2: Try with .open() method
      else if (window.shopify.resourcePicker && typeof window.shopify.resourcePicker.open === 'function') {
        console.log('[ResourcePicker] Using .open() method pattern');
        result = await window.shopify.resourcePicker.open({
          type: resourceType,
          action: 'select',
          multiple: true,
        });
      }
      // Pattern 3: Try as a promise-based API
      else if (window.shopify.resourcePicker && typeof window.shopify.resourcePicker === 'object') {
        console.log('[ResourcePicker] Trying object-based API');
        // Some versions might use a different structure
        const picker = window.shopify.resourcePicker;
        if (picker.select) {
          result = await picker.select({ type: resourceType, multiple: true });
        } else {
          throw new Error('ResourcePicker API not found. Available: ' + Object.keys(window.shopify));
        }
      }
      else {
        throw new Error('ResourcePicker API not available. window.shopify.resourcePicker is: ' + typeof window.shopify.resourcePicker);
      }

      // Process the result
      if (result && result.selection) {
        const selection = Array.isArray(result.selection) ? result.selection : [result.selection];
        const ids = selection.map((item) => {
          // ResourcePicker returns items with id in GID format: gid://shopify/Product/123456789
          const idString = String(item.id || item);
          // Extract numeric ID from GID format
          const match = idString.match(/\/(\d+)$/);
          return match ? match[1] : idString;
        });
        if (onSelection) {
          onSelection(ids);
        }
      } else if (result) {
        // Result might be directly an array
        const ids = Array.isArray(result) ? result : [result];
        const processedIds = ids.map((item) => {
          const idString = String(item.id || item);
          const match = idString.match(/\/(\d+)$/);
          return match ? match[1] : idString;
        });
        if (onSelection) {
          onSelection(processedIds);
        }
      }
    } catch (err) {
      console.error('[ResourcePicker] Error opening ResourcePicker:', err);
      console.error('[ResourcePicker] Error details:', {
        message: err.message,
        stack: err.stack,
        shopify: window.shopify ? Object.keys(window.shopify) : 'not available'
      });
      alert('Unable to open ResourcePicker. Please enter IDs manually or check the console for details.');
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      style={{ whiteSpace: 'nowrap' }}
      title="Browse and select from Shopify (requires App Bridge)"
    >
      {buttonText}
    </button>
  );
}

