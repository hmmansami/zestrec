/**
 * Product Deleted Webhook Handler
 * ZestRec uses Shopify's native recommendations, no sync needed!
 */

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
    const data = JSON.parse(webhookRequestBody);
    
    console.log(`[ZestRec] Product deleted: ${data.id} on ${shop}`);
    
    // Shopify's native recommendations automatically exclude deleted products
    // No external cleanup needed!
    
  } catch (e) {
    console.error('[ZestRec] products/delete webhook error:', e);
  }
};

export default productsDeleteHandler;
