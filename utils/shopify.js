import { LogSeverity, shopifyApi } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";
import appUninstallHandler from "./webhooks/app_uninstalled.js";
import productsCreateHandler from "./webhooks/products_create.js";
import productsUpdateHandler from "./webhooks/products_update.js";
import productsDeleteHandler from "./webhooks/products_delete.js";

const isDev = process.env.NODE_ENV === "development";

// Setup Shopify configuration
let shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_API_SCOPES,
  hostName: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
  hostScheme: "https",
  apiVersion: process.env.SHOPIFY_API_VERSION,
  isEmbeddedApp: true,
  logger: { level: isDev ? LogSeverity.Info : LogSeverity.Error },
});

//Add custom user properties to base shopify obj
shopify = {
  ...shopify,
  user: {
    /**
     * @type {Array<{
     *   topics: import("@/_developer/types/webhookTopics.js").WebhookTopics["topic"],
     *   url: string,
     *   callback: Function,
     *   filter?: string,
     *   include_fields?: string[]
     * }>}
     */
    webhooks: [
      {
        topics: ["app/uninstalled"],
        url: "/api/webhooks/app_uninstalled",
        callback: appUninstallHandler,
      },
      {
        topics: ["products/create"],
        url: "/api/webhooks/products_create",
        callback: productsCreateHandler,
      },
      {
        topics: ["products/update"],
        url: "/api/webhooks/products_update",
        callback: productsUpdateHandler,
      },
      {
        topics: ["products/delete"],
        url: "/api/webhooks/products_delete",
        callback: productsDeleteHandler,
      },
    ],

    /**
     * @type {import("@/_developer/types/declarative.js").DeclarativeMetafieldDefinition[]}
     */
    metafields: [],
  },
};

export default shopify;
