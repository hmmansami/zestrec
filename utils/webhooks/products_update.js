/**
 * Product Updated Webhook Handler
 * ZestRec uses Shopify's native recommendations, no sync needed!
 */

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
    
    console.log(`[ZestRec] Product updated: ${product.id} on ${shop}`);
    
    // Shopify's native recommendations automatically reflect product changes
    // No external sync needed!
    
  } catch (e) {
    console.error('[ZestRec] products/update webhook error:', e);
  }
};

export default productsUpdateHandler;
