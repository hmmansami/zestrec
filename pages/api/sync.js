/**
 * Sync API - Legacy endpoint
 * 
 * ZestRec uses Shopify's native recommendations API
 * No sync is needed! Products are automatically included.
 * 
 * This endpoint is kept for backwards compatibility.
 */

import withMiddleware from "@/utils/middleware/withMiddleware.js";

/**
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
const handler = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "ZestRec uses Shopify's native recommendations - no sync needed!",
    note: "Your products are automatically included in recommendations. No external service to sync with."
  });
};

export default withMiddleware("verifyRequest")(handler);
