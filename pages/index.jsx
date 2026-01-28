import isInitialLoad from "@/utils/middleware/isInitialLoad";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  Spinner,
  Text,
} from "@shopify/polaris";
import { RefreshIcon, ExternalIcon, CheckCircleIcon } from "@shopify/polaris-icons";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";

export async function getServerSideProps(context) {
  return await isInitialLoad(context);
}

const HomePage = () => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncSuccess(null);
      setError(null);
      
      const response = await fetch("/api/sync", { method: "POST" });
      const data = await response.json();
      
      if (data.success) {
        setSyncSuccess(`Successfully synced ${data.synced} products to Algolia!`);
        fetchStats(); // Refresh stats
      } else {
        setError(data.error || "Sync failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const syncProgress = stats 
    ? Math.round((stats.algolia.productsSynced / Math.max(stats.shopify.productCount, 1)) * 100)
    : 0;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <Page title="AI Recommendations Dashboard">
      <Layout>
        {/* Algolia Configuration Banner */}
        {!stats?.algolia?.isConfigured && !loading && (
          <Layout.Section>
            <Banner
              title="Algolia not configured"
              tone="warning"
            >
              <p>Add your Algolia credentials to the environment variables to enable product sync and recommendations.</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Success Banner */}
        {syncSuccess && (
          <Layout.Section>
            <Banner
              title="Sync Complete"
              tone="success"
              onDismiss={() => setSyncSuccess(null)}
            >
              <p>{syncSuccess}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Error Banner */}
        {error && (
          <Layout.Section>
            <Banner
              title="Error"
              tone="critical"
              onDismiss={() => setError(null)}
            >
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Stats Cards */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">
                  Store Overview
                </Text>
                <Button
                  icon={RefreshIcon}
                  onClick={fetchStats}
                  loading={loading}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </InlineStack>

              {loading ? (
                <Box padding="800">
                  <InlineStack align="center">
                    <Spinner size="large" />
                  </InlineStack>
                </Box>
              ) : (
                <InlineStack gap="400" wrap={false}>
                  {/* Shopify Products */}
                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                    minWidth="200px"
                  >
                    <BlockStack gap="200">
                      <Text variant="headingXs" tone="subdued">
                        Shopify Products
                      </Text>
                      <Text variant="heading2xl">
                        {stats?.shopify?.productCount || 0}
                      </Text>
                    </BlockStack>
                  </Box>

                  {/* Algolia Synced */}
                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                    minWidth="200px"
                  >
                    <BlockStack gap="200">
                      <Text variant="headingXs" tone="subdued">
                        Products in Algolia
                      </Text>
                      <Text variant="heading2xl">
                        {stats?.algolia?.productsSynced || 0}
                      </Text>
                    </BlockStack>
                  </Box>

                  {/* Status */}
                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                    minWidth="200px"
                  >
                    <BlockStack gap="200">
                      <Text variant="headingXs" tone="subdued">
                        Sync Status
                      </Text>
                      <InlineStack gap="200" align="start">
                        {stats?.sync?.needsSync ? (
                          <Badge tone="attention">Needs Sync</Badge>
                        ) : (
                          <Badge tone="success">
                            <InlineStack gap="100">
                              <Icon source={CheckCircleIcon} />
                              In Sync
                            </InlineStack>
                          </Badge>
                        )}
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </InlineStack>
              )}

              {/* Sync Progress */}
              {!loading && stats && (
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd">Sync Progress</Text>
                    <Text variant="bodyMd">{syncProgress}%</Text>
                  </InlineStack>
                  <ProgressBar progress={syncProgress} tone={syncProgress === 100 ? "success" : "primary"} />
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Actions */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Sync Products
              </Text>
              <Text>
                Sync all your products to Algolia to enable AI-powered recommendations. 
                Products are automatically synced when created, updated, or deleted.
              </Text>
              <InlineStack align="end">
                <Button
                  variant="primary"
                  onClick={handleSync}
                  loading={syncing}
                  disabled={syncing || !stats?.algolia?.isConfigured}
                >
                  {syncing ? "Syncing..." : "Sync All Products"}
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Widget Installation
              </Text>
              <Text>
                Add the recommendation widget to your store's product pages to show 
                "You may also like" suggestions.
              </Text>
              <Box
                background="bg-surface-secondary"
                padding="300"
                borderRadius="100"
              >
                <Text variant="bodyMd" fontFamily="mono">
                  {`<script src="${appUrl}/widget.js" data-shop="${stats?.shop || 'your-store.myshopify.com'}"></script>`}
                </Text>
              </Box>
              <InlineStack align="end">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<script src="${appUrl}/widget.js" data-shop="${stats?.shop || 'your-store.myshopify.com'}"></script>`
                    );
                  }}
                >
                  Copy Code
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Debug (Dev only) */}
        {process.env.NODE_ENV === "development" && (
          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Debug Tools
                </Text>
                <Text>
                  Explore data fetching, webhooks, and API testing.
                </Text>
                <InlineStack wrap={false} align="end">
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/debug")}
                  >
                    Debug Cards
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Help Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                How It Works
              </Text>
              <BlockStack gap="200">
                <InlineStack gap="200">
                  <Badge>1</Badge>
                  <Text>Products are synced to Algolia when you install the app or click "Sync All Products"</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Badge>2</Badge>
                  <Text>Webhooks keep Algolia in sync when products are created, updated, or deleted</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Badge>3</Badge>
                  <Text>Add the widget script to your theme to display recommendations on product pages</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Badge>4</Badge>
                  <Text>Customers see "You may also like" suggestions powered by AI</Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default HomePage;
