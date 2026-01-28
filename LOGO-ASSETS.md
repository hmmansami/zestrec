# ZestRec Logo Assets

## Available SVG Files

### `/public/logo-citrus.svg`
**Citrus Burst** - Primary brand icon
- ViewBox: 56x56
- Concept: Fresh energy + radiating recommendations
- Use for: Main logo, favicon source, brand identity
- Colors: `#10b981` (emerald-500), white

### `/public/logo-spark.svg`
**AI Spark** - Alternative brand icon
- ViewBox: 48x48
- Concept: Intelligent magic, AI-powered
- Use for: Secondary branding, AI feature highlights
- Colors: `#10b981` (emerald-500), `#059669` (emerald-600)

### `/public/icon-512.svg`
**App Icon** - Full-size application icon
- ViewBox: 512x512
- Based on: Citrus Burst design
- Features: Rounded corners (96px radius), gradient background
- Use for: Shopify app icon, social media, app stores
- Colors: Gradient from `#10b981` to `#059669`, white icon

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Emerald 500 | `#10b981` | Primary brand color |
| Emerald 600 | `#059669` | Accent, gradients |
| White | `#ffffff` | Icon details, text on colored bg |

## Typography Pairing

- **Citrus Burst**: Space Grotesk (700 weight)
- **AI Spark**: Outfit (700 weight)

## Usage Examples

### HTML/React
```jsx
<img src="/logo-citrus.svg" alt="ZestRec" width="56" height="56" />
```

### CSS Background
```css
.logo {
  background-image: url('/logo-citrus.svg');
  width: 56px;
  height: 56px;
}
```

### Inline SVG (for color customization)
Import the SVG directly for dynamic theming.

## Generating Other Formats

To generate PNG versions from the SVGs:

```bash
# Using Inkscape
inkscape icon-512.svg -w 512 -h 512 -o icon-512.png

# Using ImageMagick
convert -background none icon-512.svg icon-512.png

# For Shopify (requires 1200x1200)
inkscape icon-512.svg -w 1200 -h 1200 -o shopify-icon.png
```

## Source

Original designs in `/home/ubuntu/clawd/zestrec-logos.html` with all 12 concept variants.
