/**
 * Stats API for Dashboard
 * Returns store statistics and Algolia sync status
 */

import withMiddleware from "@/utils/middleware/withMiddleware.js";
import clientProvider from "@/utils/clientProvider.js";
import { getAlgoliaClient, getIndexName } from "@/utils/algolia.js";

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

    // Get Algolia index stats
    let algoliaStats = {
      entries: 0,
      lastBuildTime: null,
      dataSize: 0
    };

    try {
      const algoliaClient = getAlgoliaClient();
      const indexName = getIndexName(shop);
      
      // Search for stats
      const { results } = await algoliaClient.search({
        requests: [{
          indexName,
          query: '',
          hitsPerPage: 0,
          filters: `shop:${shop}`
        }]
      });
      
      algoliaStats.entries = results[0]?.nbHits || 0;
    } catch (algoliaError) {
      console.error('Algolia stats error:', algoliaError);
      // Algolia not configured yet, that's ok
    }

    const stats = {
      shop,
      shopify: {
        productCount: shopifyProductCount?.data?.productsCount?.count || 0
      },
      algolia: {
        productsSynced: algoliaStats.entries,
        indexName: getIndexName(shop),
        isConfigured: !!(process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY)
      },
      sync: {
        needsSync: (shopifyProductCount?.data?.productsCount?.count || 0) > algoliaStats.entries,
        lastSync: null // Could track this in DB
      }
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Stats API error:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export default withMiddleware("verifyRequest")(handler);
