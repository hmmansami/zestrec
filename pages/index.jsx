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
  Spinner,
  Text,
} from "@shopify/polaris";
import { RefreshIcon, CheckCircleIcon } from "@shopify/polaris-icons";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";

export async function getServerSideProps(context) {
  return await isInitialLoad(context);
}

const HomePage = () => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const widgetCode = `<div id="ai-recommendations"></div>
<script src="${appUrl}/widget.js" data-shop="${stats?.shop || 'your-store.myshopify.com'}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Page title="ZestRec — Product Recommendations">
      <Layout>
        {/* Error Banner - hidden, stats have fallback values */}

        {/* Status Card */}
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
                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                    minWidth="200px"
                  >
                    <BlockStack gap="200">
                      <Text variant="headingXs" tone="subdued">
                        Total Products
                      </Text>
                      <Text variant="heading2xl">
                        {stats?.shopify?.productCount || 0}
                      </Text>
                    </BlockStack>
                  </Box>

                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                    minWidth="200px"
                  >
                    <BlockStack gap="200">
                      <Text variant="headingXs" tone="subdued">
                        Recommendations
                      </Text>
                      <Badge tone="success">
                        <InlineStack gap="100">
                          <Icon source={CheckCircleIcon} />
                          Active
                        </InlineStack>
                      </Badge>
                    </BlockStack>
                  </Box>

                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                    minWidth="200px"
                  >
                    <BlockStack gap="200">
                      <Text variant="headingXs" tone="subdued">
                        Powered By
                      </Text>
                      <Text variant="headingMd">
                        Shopify Native AI
                      </Text>
                    </BlockStack>
                  </Box>
                </InlineStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Widget Installation */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                🚀 Widget Installation
              </Text>
              <Text>
                Add this code to your product page template to show "You may also like" 
                recommendations. Works automatically — no configuration needed!
              </Text>
              <Box
                background="bg-surface-secondary"
                padding="300"
                borderRadius="100"
              >
                <Text variant="bodyMd" fontFamily="mono">
                  {widgetCode}
                </Text>
              </Box>
              <InlineStack align="end">
                <Button
                  variant="primary"
                  onClick={handleCopy}
                >
                  {copied ? "✓ Copied!" : "Copy Widget Code"}
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* App Proxy Widget */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                📦 App Proxy (Automatic)
              </Text>
              <Text>
                ZestRec also works via Shopify App Proxy. Recommendations are available at:
              </Text>
              <Box
                background="bg-surface-secondary"
                padding="300"
                borderRadius="100"
              >
                <Text variant="bodyMd" fontFamily="mono">
                  /apps/zestrec/widget?product_id=PRODUCT_ID&format=json
                </Text>
              </Box>
              <Text tone="subdued">
                Returns JSON with recommended products. Use format=html for a ready-made widget.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* How It Works */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                How It Works
              </Text>
              <BlockStack gap="200">
                <InlineStack gap="200">
                  <Badge>1</Badge>
                  <Text>Install ZestRec on your store — recommendations activate instantly</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Badge>2</Badge>
                  <Text>Add the widget code to your product pages (or use App Proxy)</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Badge>3</Badge>
                  <Text>Shopify's AI analyzes your catalog and shows relevant suggestions</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Badge>4</Badge>
                  <Text>Customers see personalized "You may also like" products — boosting sales!</Text>
                </InlineStack>
              </BlockStack>
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
      </Layout>
    </Page>
  );
};

export default HomePage;
