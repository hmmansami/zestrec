/**
 * Algolia Integration for Shopify App
 * Handles product sync and recommendations
 */

import { algoliasearch } from 'algoliasearch';

// Algolia clients
let searchClient = null;
let adminClient = null;

/**
 * Initialize Algolia client
 */
export function getAlgoliaClient() {
  if (!searchClient) {
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey = process.env.ALGOLIA_SEARCH_KEY;
    
    if (!appId || !apiKey) {
      throw new Error('Algolia credentials not configured');
    }
    
    searchClient = algoliasearch(appId, apiKey);
  }
  return searchClient;
}

/**
 * Get Algolia admin client for write operations
 */
export function getAlgoliaAdminClient() {
  if (!adminClient) {
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey = process.env.ALGOLIA_API_KEY; // Admin key
    
    if (!appId || !apiKey) {
      throw new Error('Algolia admin credentials not configured');
    }
    
    adminClient = algoliasearch(appId, apiKey);
  }
  return adminClient;
}

/**
 * Get index name for a shop
 */
export function getIndexName(shop) {
  // Sanitize shop name for index
  const sanitized = shop.replace(/[^a-zA-Z0-9]/g, '_');
  return `products_${sanitized}`;
}

/**
 * Transform Shopify product to Algolia record
 */
export function transformProduct(product, shop) {
  const variant = product.variants?.[0] || {};
  const image = product.image?.src || product.images?.[0]?.src || '';
  
  return {
    objectID: `${shop}_${product.id}`,
    shopifyId: product.id,
    shop: shop,
    title: product.title,
    description: product.body_html?.replace(/<[^>]*>/g, '') || '',
    handle: product.handle,
    vendor: product.vendor,
    productType: product.product_type,
    tags: product.tags?.split(', ') || [],
    price: parseFloat(variant.price) || 0,
    compareAtPrice: parseFloat(variant.compare_at_price) || null,
    sku: variant.sku || '',
    image: image,
    images: product.images?.map(img => img.src) || [],
    available: product.status === 'active',
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    // For recommendations
    _tags: [
      product.product_type,
      product.vendor,
      ...(product.tags?.split(', ') || [])
    ].filter(Boolean)
  };
}

/**
 * Sync a single product to Algolia
 */
export async function syncProduct(product, shop) {
  try {
    const client = getAlgoliaAdminClient();
    const indexName = getIndexName(shop);
    const record = transformProduct(product, shop);
    
    await client.saveObject({
      indexName,
      body: record
    });
    
    console.log(`Synced product ${product.id} to Algolia for ${shop}`);
    return { success: true, objectID: record.objectID };
  } catch (error) {
    console.error(`Failed to sync product ${product.id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a product from Algolia
 */
export async function deleteProduct(productId, shop) {
  try {
    const client = getAlgoliaAdminClient();
    const indexName = getIndexName(shop);
    const objectID = `${shop}_${productId}`;
    
    await client.deleteObject({
      indexName,
      objectID
    });
    
    console.log(`Deleted product ${productId} from Algolia for ${shop}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete product ${productId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk sync products to Algolia
 */
export async function bulkSyncProducts(products, shop) {
  try {
    const client = getAlgoliaAdminClient();
    const indexName = getIndexName(shop);
    const records = products.map(p => transformProduct(p, shop));
    
    await client.saveObjects({
      indexName,
      objects: records
    });
    
    console.log(`Bulk synced ${products.length} products to Algolia for ${shop}`);
    return { success: true, count: products.length };
  } catch (error) {
    console.error(`Failed to bulk sync products:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get related products using Algolia's similarity search
 */
export async function getRelatedProducts(productId, shop, limit = 4) {
  try {
    const client = getAlgoliaClient();
    const indexName = getIndexName(shop);
    const objectID = `${shop}_${productId}`;
    
    // First get the product to use its attributes for similarity
    const { results } = await client.search({
      requests: [{
        indexName,
        query: '',
        filters: `objectID:${objectID}`,
        hitsPerPage: 1
      }]
    });
    
    const product = results[0]?.hits?.[0];
    if (!product) {
      return { success: false, error: 'Product not found', products: [] };
    }
    
    // Search for similar products based on tags and product type
    const similarityQuery = [
      product.productType,
      ...(product.tags?.slice(0, 3) || [])
    ].filter(Boolean).join(' ');
    
    const { results: similarResults } = await client.search({
      requests: [{
        indexName,
        query: similarityQuery,
        filters: `NOT objectID:${objectID} AND shop:${shop}`,
        hitsPerPage: limit
      }]
    });
    
    const relatedProducts = similarResults[0]?.hits || [];
    
    return {
      success: true,
      products: relatedProducts.map(p => ({
        id: p.shopifyId,
        title: p.title,
        handle: p.handle,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.image,
        vendor: p.vendor,
        productType: p.productType
      }))
    };
  } catch (error) {
    console.error(`Failed to get related products:`, error);
    return { success: false, error: error.message, products: [] };
  }
}

/**
 * Search products
 */
export async function searchProducts(query, shop, options = {}) {
  try {
    const client = getAlgoliaClient();
    const indexName = getIndexName(shop);
    
    const { results } = await client.search({
      requests: [{
        indexName,
        query,
        filters: `shop:${shop}`,
        hitsPerPage: options.limit || 20,
        page: options.page || 0,
        ...options.algoliaParams
      }]
    });
    
    return {
      success: true,
      products: results[0]?.hits || [],
      totalHits: results[0]?.nbHits || 0,
      page: results[0]?.page || 0,
      totalPages: results[0]?.nbPages || 0
    };
  } catch (error) {
    console.error(`Failed to search products:`, error);
    return { success: false, error: error.message, products: [] };
  }
}

/**
 * Configure index settings for optimal recommendations
 */
export async function configureIndex(shop) {
  try {
    const client = getAlgoliaAdminClient();
    const indexName = getIndexName(shop);
    
    await client.setSettings({
      indexName,
      indexSettings: {
        searchableAttributes: [
          'title',
          'description',
          'vendor',
          'productType',
          'tags'
        ],
        attributesForFaceting: [
          'filterOnly(shop)',
          'filterOnly(objectID)',
          'vendor',
          'productType',
          'tags',
          'available'
        ],
        customRanking: [
          'desc(available)',
          'desc(createdAt)'
        ],
        replicas: []
      }
    });
    
    console.log(`Configured Algolia index for ${shop}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to configure index:`, error);
    return { success: false, error: error.message };
  }
}

export default {
  getAlgoliaClient,
  getAlgoliaAdminClient,
  getIndexName,
  transformProduct,
  syncProduct,
  deleteProduct,
  bulkSyncProducts,
  getRelatedProducts,
  searchProducts,
  configureIndex
};
