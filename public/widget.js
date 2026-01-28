/**
 * AI Recommendations Widget
 * Embeddable script for Shopify stores
 * 
 * Usage:
 * <script src="https://your-app.vercel.app/widget.js" 
 *         data-shop="mystore.myshopify.com"
 *         data-product-id="123456789"
 *         data-container="#recommendations">
 * </script>
 */

(function() {
  'use strict';
  
  // Configuration
  const WIDGET_VERSION = '1.0.0';
  const API_BASE = window.AIRecommendations?.apiBase || 
    (document.currentScript?.src ? new URL(document.currentScript.src).origin : '');
  
  // Get config from script tag or window
  const scriptTag = document.currentScript;
  const config = {
    shop: scriptTag?.dataset?.shop || window.AIRecommendations?.shop || Shopify?.shop,
    productId: scriptTag?.dataset?.productId || window.AIRecommendations?.productId,
    container: scriptTag?.dataset?.container || window.AIRecommendations?.container || '#ai-recommendations',
    limit: parseInt(scriptTag?.dataset?.limit || window.AIRecommendations?.limit || '4', 10),
    title: scriptTag?.dataset?.title || window.AIRecommendations?.title || 'You may also like',
    theme: scriptTag?.dataset?.theme || window.AIRecommendations?.theme || 'light'
  };
  
  // Styles
  const styles = `
    .ai-rec-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px 0;
      max-width: 100%;
    }
    .ai-rec-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: ${config.theme === 'dark' ? '#fff' : '#1a1a1a'};
    }
    .ai-rec-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .ai-rec-product {
      background: ${config.theme === 'dark' ? '#2a2a2a' : '#fff'};
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      color: inherit;
      display: block;
    }
    .ai-rec-product:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .ai-rec-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      background: ${config.theme === 'dark' ? '#333' : '#f5f5f5'};
    }
    .ai-rec-info {
      padding: 12px;
    }
    .ai-rec-product-title {
      font-size: 0.95rem;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: ${config.theme === 'dark' ? '#fff' : '#1a1a1a'};
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .ai-rec-price {
      font-size: 0.9rem;
      color: ${config.theme === 'dark' ? '#4ade80' : '#16a34a'};
      font-weight: 600;
    }
    .ai-rec-compare-price {
      text-decoration: line-through;
      color: #888;
      font-size: 0.85rem;
      margin-left: 8px;
      font-weight: 400;
    }
    .ai-rec-loading {
      text-align: center;
      padding: 40px;
      color: #888;
    }
    .ai-rec-error {
      text-align: center;
      padding: 20px;
      color: #dc2626;
      background: #fef2f2;
      border-radius: 8px;
    }
    .ai-rec-empty {
      text-align: center;
      padding: 20px;
      color: #666;
    }
  `;
  
  // Inject styles
  function injectStyles() {
    if (document.getElementById('ai-rec-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'ai-rec-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
  
  // Format price
  function formatPrice(price) {
    if (!price) return '';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD'
    }).format(price);
  }
  
  // Render products
  function renderProducts(products, container) {
    if (!products.length) {
      container.innerHTML = '<div class="ai-rec-empty">No recommendations available</div>';
      return;
    }
    
    const html = `
      <div class="ai-rec-container">
        <h3 class="ai-rec-title">${config.title}</h3>
        <div class="ai-rec-grid">
          ${products.map(product => `
            <a href="/products/${product.handle}" class="ai-rec-product">
              <img class="ai-rec-image" 
                   src="${product.image || 'https://via.placeholder.com/400x400?text=No+Image'}" 
                   alt="${product.title}"
                   loading="lazy">
              <div class="ai-rec-info">
                <h4 class="ai-rec-product-title">${product.title}</h4>
                <div class="ai-rec-price">
                  ${formatPrice(product.price)}
                  ${product.compareAtPrice && product.compareAtPrice > product.price 
                    ? `<span class="ai-rec-compare-price">${formatPrice(product.compareAtPrice)}</span>` 
                    : ''}
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  // Fetch recommendations
  async function fetchRecommendations() {
    const container = document.querySelector(config.container);
    if (!container) {
      console.warn('[AI Recommendations] Container not found:', config.container);
      return;
    }
    
    // Validate config
    if (!config.shop) {
      console.warn('[AI Recommendations] Shop not configured');
      return;
    }
    
    if (!config.productId) {
      // Try to get from Shopify meta
      const meta = document.querySelector('meta[property="og:type"][content="product"]');
      if (meta) {
        const productMeta = document.querySelector('meta[property="product:id"]');
        config.productId = productMeta?.content;
      }
      
      // Try from URL
      if (!config.productId && window.location.pathname.includes('/products/')) {
        // Will need to resolve handle to ID, skip for now
        console.warn('[AI Recommendations] Product ID not found');
        return;
      }
    }
    
    if (!config.productId) {
      console.warn('[AI Recommendations] Product ID not configured');
      return;
    }
    
    // Show loading
    container.innerHTML = '<div class="ai-rec-loading">Loading recommendations...</div>';
    
    try {
      const url = `${API_BASE}/api/recommend?productId=${config.productId}&shop=${config.shop}&limit=${config.limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.recommendations) {
        renderProducts(data.recommendations, container);
        
        // Track impression
        if (window.gtag) {
          window.gtag('event', 'ai_recommendations_shown', {
            product_id: config.productId,
            count: data.recommendations.length
          });
        }
      } else {
        container.innerHTML = '<div class="ai-rec-empty">No recommendations available</div>';
      }
    } catch (error) {
      console.error('[AI Recommendations] Error:', error);
      container.innerHTML = '<div class="ai-rec-error">Unable to load recommendations</div>';
    }
  }
  
  // Initialize
  function init() {
    injectStyles();
    
    // Wait for DOM if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fetchRecommendations);
    } else {
      fetchRecommendations();
    }
  }
  
  // Expose API for manual control
  window.AIRecommendations = window.AIRecommendations || {};
  window.AIRecommendations.refresh = fetchRecommendations;
  window.AIRecommendations.version = WIDGET_VERSION;
  
  // Auto-init
  init();
})();
