/**
 * Product Created Webhook Handler
 * Syncs new product to Algolia
 */

import { syncProduct } from "../algolia.js";

/**
 * @param {string} topic
 * @param {string} shop
 * @param {string} webhookRequestBody
 * @param {string} webhookId
 * @param {string} apiVersion
 */
const productsCreateHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  try {
    const product = JSON.parse(webhookRequestBody);
    
    console.log(`[Webhook] Product created: ${product.id} on ${shop}`);
    
    // Only sync active products
    if (product.status === 'active') {
      const result = await syncProduct(product, shop);
      
      if (result.success) {
        console.log(`[Algolia] Synced new product ${product.id} for ${shop}`);
      } else {
        console.error(`[Algolia] Failed to sync product ${product.id}:`, result.error);
      }
    } else {
      console.log(`[Webhook] Skipping draft product ${product.id}`);
    }
  } catch (e) {
    console.error('[Webhook] products/create error:', e);
  }
};

export default productsCreateHandler;
