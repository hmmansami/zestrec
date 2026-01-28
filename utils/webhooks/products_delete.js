/**
 * Product Deleted Webhook Handler
 * Removes product from Algolia
 */

import { deleteProduct } from "../algolia.js";

/**
 * @param {string} topic
 * @param {string} shop
 * @param {string} webhookRequestBody
 * @param {string} webhookId
 * @param {string} apiVersion
 */
const productsDeleteHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  try {
    const product = JSON.parse(webhookRequestBody);
    
    console.log(`[Webhook] Product deleted: ${product.id} on ${shop}`);
    
    const result = await deleteProduct(product.id, shop);
    
    if (result.success) {
      console.log(`[Algolia] Removed deleted product ${product.id} for ${shop}`);
    } else {
      console.error(`[Algolia] Failed to remove product ${product.id}:`, result.error);
    }
  } catch (e) {
    console.error('[Webhook] products/delete error:', e);
  }
};

export default productsDeleteHandler;
