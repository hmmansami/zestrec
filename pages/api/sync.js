/**
 * Sync API - Bulk sync products to Algolia
 */

import withMiddleware from "@/utils/middleware/withMiddleware.js";
import clientProvider from "@/utils/clientProvider.js";
import { bulkSyncProducts, configureIndex } from "@/utils/algolia.js";

/**
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { client, shop } = await clientProvider.offline.graphqlClient({
      req,
      res,
      isOnline: false,
    });

    // Configure the Algolia index first
    await configureIndex(shop);

    // Fetch all products from Shopify (paginated)
    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;
    
    while (hasNextPage) {
      const query = `
        query($cursor: String) {
          products(first: 50, after: $cursor) {
            edges {
              node {
                id
                title
                handle
                description
                vendor
                productType
                status
                tags
                createdAt
                updatedAt
                images(first: 5) {
                  edges {
                    node {
                      url
                    }
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      price
                      compareAtPrice
                      sku
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;
      
      const response = await client.request(query, { variables: { cursor } });
      const edges = response?.data?.products?.edges || [];
      
      // Transform GraphQL response to REST-like format
      const products = edges.map(edge => {
        const node = edge.node;
        const variant = node.variants?.edges?.[0]?.node || {};
        const images = node.images?.edges?.map(e => ({ src: e.node.url })) || [];
        
        return {
          id: node.id.replace('gid://shopify/Product/', ''),
          title: node.title,
          handle: node.handle,
          body_html: node.description,
          vendor: node.vendor,
          product_type: node.productType,
          status: node.status.toLowerCase(),
          tags: node.tags?.join(', ') || '',
          created_at: node.createdAt,
          updated_at: node.updatedAt,
          images: images,
          image: images[0] || null,
          variants: [{
            price: variant.price,
            compare_at_price: variant.compareAtPrice,
            sku: variant.sku
          }]
        };
      });
      
      allProducts = allProducts.concat(products.filter(p => p.status === 'active'));
      
      hasNextPage = response?.data?.products?.pageInfo?.hasNextPage || false;
      cursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
      
      // Safety limit
      if (allProducts.length >= 1000) {
        console.log('Reached 1000 product limit for initial sync');
        break;
      }
    }

    console.log(`Fetched ${allProducts.length} active products from Shopify for ${shop}`);

    if (allProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active products to sync",
        synced: 0
      });
    }

    // Bulk sync to Algolia
    const result = await bulkSyncProducts(allProducts, shop);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Successfully synced ${result.count} products to Algolia`,
        synced: result.count
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to sync products"
      });
    }
  } catch (error) {
    console.error("Sync API error:", error);
    return res.status(500).json({ error: "Failed to sync products" });
  }
};

export default withMiddleware("verifyRequest")(handler);
