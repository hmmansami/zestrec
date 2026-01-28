/**
 * Product Updated Webhook Handler
 * Updates product in Algolia
 */

import { syncProduct, deleteProduct } from "../algolia.js";

/**
 * @param {string} topic
 * @param {string} shop
 * @param {string} webhookRequestBody
 * @param {string} webhookId
 * @param {string} apiVersion
 */
const productsUpdateHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  try {
    const product = JSON.parse(webhookRequestBody);
    
    console.log(`[Webhook] Product updated: ${product.id} on ${shop}`);
    
    if (product.status === 'active') {
      // Sync active products
      const result = await syncProduct(product, shop);
      
      if (result.success) {
        console.log(`[Algolia] Updated product ${product.id} for ${shop}`);
      } else {
        console.error(`[Algolia] Failed to update product ${product.id}:`, result.error);
      }
    } else {
      // Remove non-active products from index
      const result = await deleteProduct(product.id, shop);
      
      if (result.success) {
        console.log(`[Algolia] Removed non-active product ${product.id} for ${shop}`);
      }
    }
  } catch (e) {
    console.error('[Webhook] products/update error:', e);
  }
};

export default productsUpdateHandler;
