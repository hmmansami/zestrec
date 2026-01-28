/**
 * ZestRec Stats API for Dashboard
 * Returns store statistics
 */

import withMiddleware from "@/utils/middleware/withMiddleware.js";
import clientProvider from "@/utils/clientProvider.js";

/**
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Use the session from middleware - it already has the access token
    const session = req.user_session;
    const shop = req.user_shop;

    if (!session || !shop) {
      console.error("[ZestRec] Stats: No session or shop available");
      return res.status(401).json({ error: "Session not found" });
    }

    // Try to get offline session, fall back to online session
    let client;
    try {
      const offlineResult = await clientProvider.offline.graphqlClient({ shop });
      client = offlineResult.client;
    } catch (offlineError) {
      console.log("[ZestRec] Stats: Offline session not found, using online session");
      // Fall back to online session from middleware
      const { default: shopify } = await import("@/utils/shopify.js");
      client = new shopify.clients.Graphql({ session });
    }

    // Get product count from Shopify
    const shopifyProductCount = await client.request(`
      query {
        productsCount {
          count
        }
      }
    `);

    const stats = {
      shop,
      shopify: {
        productCount: shopifyProductCount?.data?.productsCount?.count || 0
      },
      recommendations: {
        // Shopify native recommendations are always available
        enabled: true,
        provider: 'Shopify Native',
        note: 'Using Shopify\'s built-in product recommendations - no external service needed!'
      }
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error("[ZestRec] Stats API error:", error.message, error.stack);
    return res.status(500).json({ error: "Failed to fetch stats", details: error.message });
  }
};

export default withMiddleware("verifyRequest")(handler);
