/**
 * Product Created Webhook Handler
 * ZestRec uses Shopify's native recommendations, no sync needed!
 */

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
    
    console.log(`[ZestRec] Product created: ${product.id} on ${shop}`);
    
    // Shopify's native recommendations automatically include new products
    // No external sync needed - that's the beauty of using native APIs!
    
  } catch (e) {
    console.error('[ZestRec] products/create webhook error:', e);
  }
};

export default productsCreateHandler;
