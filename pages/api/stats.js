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
    const { client, shop } = await clientProvider.offline.graphqlClient({
      req,
      res,
      isOnline: false,
    });

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
    console.error("[ZestRec] Stats API error:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export default withMiddleware("verifyRequest")(handler);
