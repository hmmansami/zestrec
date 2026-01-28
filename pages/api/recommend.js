/**
 * ZestRec Product Recommendations API
 * 
 * GET /api/recommend?productId=xxx&shop=mystore.myshopify.com
 * Returns related products using Shopify's FREE native recommendations
 */

import prisma from "@/utils/prisma.js";
import { decrypt } from "@/utils/cryption.js";
import { getRecommendations } from "@/utils/recommendations.js";

/**
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
export default async function handler(req, res) {
  // Set CORS headers for widget access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { productId, shop, limit = 4 } = req.query;
  
  if (!productId) {
    return res.status(400).json({ 
      error: 'Missing productId parameter' 
    });
  }
  
  if (!shop) {
    return res.status(400).json({ 
      error: 'Missing shop parameter' 
    });
  }
  
  try {
    // Get shop's access token from database
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    
    const session = await prisma.session.findFirst({
      where: { shop: shopDomain },
      orderBy: { id: 'desc' }
    });

    if (!session) {
      return res.status(404).json({ 
        error: 'Shop not found. Please install the ZestRec app first.' 
      });
    }

    const accessToken = decrypt(session.accessToken);

    // Use Shopify's native recommendations API (FREE!)
    const result = await getRecommendations(
      shopDomain,
      accessToken,
      productId, 
      parseInt(limit, 10)
    );
    
    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to get recommendations' 
      });
    }
    
    // Track recommendation served
    console.log(`[ZestRec] Served ${result.count} recommendations for product ${productId} on ${shop}`);
    
    return res.status(200).json({
      success: true,
      productId,
      shop: shopDomain,
      recommendations: result.products,
      count: result.count
    });
  } catch (error) {
    console.error('[ZestRec] Recommendation API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}
