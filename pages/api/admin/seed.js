/**
 * Seed API - Creates test products for demo
 * POST /api/admin/seed
 */

import withMiddleware from "@/utils/middleware/withMiddleware.js";
import clientProvider from "@/utils/clientProvider.js";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const shop = req.user_shop;
    const { client } = await clientProvider.offline.graphqlClient({ shop });

    // Create test products
    const products = [
      { title: "Classic White T-Shirt", descriptionHtml: "<p>Premium cotton t-shirt.</p>", productType: "Apparel", vendor: "ZestRec Demo", status: "ACTIVE" },
      { title: "Vintage Denim Jacket", descriptionHtml: "<p>Timeless denim jacket.</p>", productType: "Apparel", vendor: "ZestRec Demo", status: "ACTIVE" },
      { title: "Running Sneakers", descriptionHtml: "<p>Lightweight sneakers.</p>", productType: "Footwear", vendor: "ZestRec Demo", status: "ACTIVE" },
      { title: "Leather Backpack", descriptionHtml: "<p>Stylish leather backpack.</p>", productType: "Accessories", vendor: "ZestRec Demo", status: "ACTIVE" },
      { title: "Wireless Headphones", descriptionHtml: "<p>Premium sound quality.</p>", productType: "Electronics", vendor: "ZestRec Demo", status: "ACTIVE" },
    ];

    const created = [];
    for (const product of products) {
      const result = await client.request(`
        mutation productCreate($input: ProductInput!) {
          productCreate(input: $input) {
            product { id title handle }
            userErrors { field message }
          }
        }
      `, { variables: { input: product } });

      if (result.data?.productCreate?.product) {
        created.push(result.data.productCreate.product);
      }
    }

    return res.status(200).json({ success: true, message: `Created ${created.length} products`, products: created });
  } catch (error) {
    console.error("[ZestRec] Seed error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export default withMiddleware("verifyRequest")(handler);
