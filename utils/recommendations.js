/**
 * ZestRec - Shopify Native Recommendations
 * Uses Shopify's FREE built-in recommendations API
 * 
 * No external services needed - just Shopify!
 */

/**
 * Get product recommendations using Shopify's REST API
 * @param {string} shop - Shop domain (e.g., 'mystore.myshopify.com')
 * @param {string} accessToken - Shopify access token
 * @param {string} productId - Product ID to get recommendations for
 * @param {number} limit - Number of recommendations (default 4)
 * @returns {Promise<{success: boolean, products: Array, error?: string}>}
 */
export async function getRecommendations(shop, accessToken, productId, limit = 4) {
  try {
    const response = await fetch(
      `https://${shop}/recommendations/products.json?product_id=${productId}&limit=${limit}`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Shopify recommendations API error: ${response.status}`, error);
      return { 
        success: false, 
        products: [], 
        error: `Shopify API error: ${response.status}` 
      };
    }

    const data = await response.json();
    
    // Transform to our standard format
    const products = (data.products || []).map(product => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      price: product.variants?.[0]?.price || '0.00',
      compareAtPrice: product.variants?.[0]?.compare_at_price || null,
      image: product.image?.src || product.images?.[0]?.src || null,
      vendor: product.vendor,
      productType: product.product_type,
      url: `https://${shop}/products/${product.handle}`
    }));

    return {
      success: true,
      products,
      count: products.length
    };
  } catch (error) {
    console.error('Failed to get Shopify recommendations:', error);
    return {
      success: false,
      products: [],
      error: error.message
    };
  }
}

/**
 * Get recommendations using Storefront API (GraphQL)
 * This works with public access tokens
 * @param {string} shop - Shop domain
 * @param {string} storefrontToken - Storefront API access token
 * @param {string} productId - Product GID (gid://shopify/Product/xxx)
 * @param {number} limit - Number of recommendations
 */
export async function getStorefrontRecommendations(shop, storefrontToken, productId, limit = 4) {
  try {
    // Ensure we have the full GID format
    const productGid = productId.includes('gid://') 
      ? productId 
      : `gid://shopify/Product/${productId}`;

    const query = `
      query productRecommendations($productId: ID!) {
        productRecommendations(productId: $productId) {
          id
          title
          handle
          vendor
          productType
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `;

    const response = await fetch(
      `https://${shop}/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontToken
        },
        body: JSON.stringify({
          query,
          variables: { productId: productGid }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Storefront API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return { success: false, products: [], error: data.errors[0]?.message };
    }

    const recommendations = data.data?.productRecommendations || [];
    
    // Transform and limit
    const products = recommendations.slice(0, limit).map(product => ({
      id: product.id.replace('gid://shopify/Product/', ''),
      title: product.title,
      handle: product.handle,
      price: product.priceRange?.minVariantPrice?.amount || '0.00',
      currency: product.priceRange?.minVariantPrice?.currencyCode || 'USD',
      compareAtPrice: product.compareAtPriceRange?.minVariantPrice?.amount || null,
      image: product.featuredImage?.url || null,
      imageAlt: product.featuredImage?.altText || product.title,
      vendor: product.vendor,
      productType: product.productType,
      url: `https://${shop}/products/${product.handle}`
    }));

    return {
      success: true,
      products,
      count: products.length
    };
  } catch (error) {
    console.error('Failed to get Storefront recommendations:', error);
    return {
      success: false,
      products: [],
      error: error.message
    };
  }
}

/**
 * Format price for display
 */
export function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(parseFloat(price));
}

export default {
  getRecommendations,
  getStorefrontRecommendations,
  formatPrice
};
