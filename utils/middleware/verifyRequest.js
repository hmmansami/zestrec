import sessionHandler from "@/utils/sessionHandler.js";
import shopify from "@/utils/shopify.js";
import { RequestedTokenType, Session } from "@shopify/shopify-api";
import validateJWT from "../validateJWT.js";

/**
 *
 * @async
 * @function verifyRequest
 * @param {import('next').NextApiRequest} req - The Next.js API request object, expected to have an 'authorization' header.
 * @param {import('next').NextApiResponse} res - The Next.js API response object, used to send back error messages if needed.
 * @param {import('next').NextApiHandler} next - Callback to pass control to the next middleware function in the Next.js API route.
 * @throws Will throw an error if the authorization header is missing or invalid, or if no shop is found in the payload.
 */
const verifyRequest = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      throw Error("No authorization header found.");
    }

    const payload = validateJWT(authHeader.split(" ")[1]);

    let shop = shopify.utils.sanitizeShop(payload.dest.replace("https://", ""));
    if (!shop) {
      throw Error("No shop found, not a valid request");
    }

    const sessionId = await shopify.session.getCurrentId({
      isOnline: true,
      rawRequest: req,
      rawResponse: res,
    });

    let session = await sessionHandler.loadSession(sessionId);
    
    // Check if session exists and is still valid
    const sessionValid = session && 
      new Date(session.expires) > new Date() &&
      shopify.config.scopes.equals(session.scope);
    
    if (!sessionValid) {
      console.log(`[ZestRec] Session invalid or expired for ${shop}, refreshing...`);
      session = await getSession({ shop, authHeader });
    }
    
    if (!session) {
      throw Error("Failed to get valid session");
    }

    //Add session and shop to the request object so any subsequent routes that use this middleware can access it
    req.user_session = session;
    req.user_shop = session.shop;

    await next();

    return;
  } catch (e) {
    console.error(
      `---> An error happened at verifyRequest middleware: ${e.message}`
    );
    return res.status(401).send({ error: "Unauthorized call" });
  }
};

export default verifyRequest;

/**
 * Retrieves and stores session information based on the provided authentication header and offline flag.
 *
 * @async
 * @function getSession
 * @param {Object} params - The function parameters.
 * @param {string} params.shop - The xxx.myshopify.com url of the requesting store.
 * @param {string} params.authHeader - The authorization header containing the session token.
 * @returns {Promise<Session>} The online session object
 */

async function getSession({ shop, authHeader }) {
  try {
    const sessionToken = authHeader.split(" ")[1];

    const { session: onlineSession } = await shopify.auth.tokenExchange({
      sessionToken,
      shop,
      requestedTokenType: RequestedTokenType.OnlineAccessToken,
    });

    await sessionHandler.storeSession(onlineSession);
    console.log(`[ZestRec] Stored online session: ${onlineSession.id}`);

    const { session: offlineSession } = await shopify.auth.tokenExchange({
      sessionToken,
      shop,
      requestedTokenType: RequestedTokenType.OfflineAccessToken,
    });

    await sessionHandler.storeSession(offlineSession);
    console.log(`[ZestRec] Stored offline session: ${offlineSession.id}`);

    return new Session(onlineSession);
  } catch (e) {
    console.error(
      `---> Error happened while pulling session from Shopify: ${e.message}`
    );
    throw e; // Re-throw so caller knows it failed
  }
}
