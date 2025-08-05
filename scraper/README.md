# Land-book Scraper

A powerful and respectful web scraper for collecting design data from [Land-book.com](https://land-book.com). This tool extracts website screenshots, design metadata, and taxonomy information to create a structured JSON dataset for the "This or That?" design preference application.

## Features

- 🎯 **Targeted Scraping**: Filter by categories, styles, industries, platforms, and colors
- 🚀 **CLI Interface**: Easy-to-use command-line interface with presets
- 📊 **Progress Tracking**: Real-time progress bars and detailed logging
- ⚙️ **Configurable**: Flexible configuration system with JSON config files
- 🤖 **Respectful Crawling**: Built-in rate limiting and ethical scraping practices
- 📝 **Rich Metadata**: Extracts comprehensive design taxonomy and color palettes
- 🔧 **Error Handling**: Robust error handling with detailed error reporting
- 📦 **JSON Output**: Generates clean, validated JSON data ready for use
- 📷 **Local Image Download**: Download images locally to eliminate external dependencies
- 🔗 **Direct URL Support**: Scrape any Land-book URL directly from your browser
- 🔄 **Lazy Loading**: Automatically trigger infinite scroll to load up to 100 items

## Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd scraper
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Make CLI executable** (optional):

   ```bash
   chmod +x cli.js
   ```

## Quick Start

### Basic Usage

Scrape 20 portfolio designs with minimal styling:

```bash
npm run scrape -- --categories portfolio --styles minimalist --max-items 20
```

### Using Presets

Use a predefined configuration for common use cases:

```bash
npm run scrape -- --preset minimal-portfolios
```

### List Available Options

See all available categories, styles, and presets:

```bash
npm run list
```

## Command Line Interface

### Main Commands

#### `scrape` - Scrape designs from Land-book

```bash
node cli.js scrape [options]
```

**Options:**

- `-c, --categories <categories>` - Comma-separated list of categories
- `-s, --styles <styles>` - Comma-separated list of styles
- `-i, --industries <industries>` - Comma-separated list of industries
- `-p, --platforms <platforms>` - Comma-separated list of platforms
- `--colors <colors>` - Comma-separated list of color schemes
- `-u, --url <url>` - Direct Land-book URL to scrape (overrides filter options)
- `-m, --max-items <number>` - Maximum items to scrape (default: 100, with lazy loading)
- `--download-images` - Download images locally to `/data/images/` directory
- `-o, --output <path>` - Output file path (default: designs.json)
- `--headless <boolean>` - Run browser in headless mode (default: true)
- `--timeout <number>` - Request timeout in milliseconds (default: 30000)
- `--delay <number>` - Delay between requests in milliseconds (default: 1500)
- `--log-level <level>` - Logging level: debug, info, warn, error (default: info)
- `--log-file <path>` - Log to file
- `--config <path>` - Path to configuration file
- `--preset <name>` - Use predefined scraping preset
- `--dry-run` - Show what would be scraped without actually scraping

#### `list` - List available options

```bash
node cli.js list [options]
```

**Options:**

- `-t, --type <type>` - Type to list: categories, styles, industries, platforms, colors, presets, all (default: all)

#### `validate-url` - Preview generated URL

```bash
node cli.js validate-url [options]
```

Same filter options as `scrape` command. Shows the generated Land-book URL without scraping.

#### `init-config` - Generate configuration file

```bash
node cli.js init-config [options]
```

**Options:**

- `-o, --output <path>` - Output config file path (default: scraper-config.json)

## Configuration

### Configuration File

Generate a configuration file:

```bash
npm run init-config
```

Example configuration (`scraper-config.json`):

```json
{
  "browser": {
    "headless": true,
    "slowMo": 100,
    "timeout": 30000,
    "viewport": {
      "width": 1200,
      "height": 800
    }
  },
  "limits": {
    "maxItems": 20,
    "maxRetries": 3,
    "requestDelay": 1500,
    "requestDelayVariation": 1000
  },
  "output": {
    "format": "json",
    "filename": "designs.json",
    "directory": "../data",
    "includeMetadata": true,
    "prettyPrint": true
  },
  "logging": {
    "level": "info",
    "showProgress": true,
    "logToFile": false,
    "logFile": "scraper.log"
  },
  "filters": {
    "categories": ["portfolio", "agency"],
    "styles": ["minimalist", "bold-typography"],
    "industries": ["design", "technology"],
    "platforms": [],
    "colors": []
  }
}
```

Use configuration file:

```bash
node cli.js scrape --config scraper-config.json
```

## Available Filters

### Categories

- `portfolio`, `agency`, `e-commerce`, `landing-page`, `blog`, `restaurant`, `photography`, `fashion`, `technology`, `health-fitness`, `education`, `non-profit`, `real-estate`, `travel`, `finance`, `entertainment`, `news`, `government`, `personal`, `other`

### Styles

- `minimalist`, `bold-typography`, `gradient`, `dark-theme`, `light-theme`, `colorful`, `black-white`, `illustration`, `photography`, `animation`, `parallax`, `grid-layout`, `single-page`, `multi-page`, `mobile-first`, `desktop-first`

### Industries

- `technology`, `design`, `marketing`, `consulting`, `healthcare`, `education`, `finance`, `retail`, `hospitality`, `entertainment`, `non-profit`, `government`, `startup`, `enterprise`, `freelance`, `agency`

### Platforms

- `wordpress`, `webflow`, `squarespace`, `wix`, `shopify`, `react`, `vue`, `angular`, `next-js`, `gatsby`, `custom`, `framer`, `figma`, `sketch`

### Colors

- `light-colors`, `dark-colors`, `bright-colors`, `pastel-colors`, `monochrome`, `colorful`, `blue`, `green`, `red`, `purple`, `orange`, `yellow`, `pink`, `brown`, `gray`

## Presets

Pre-configured filter combinations for common use cases:

### `minimal-portfolios`

Minimal portfolio designs with light themes

- Categories: portfolio
- Styles: minimalist, light-theme

### `dark-tech`

Dark-themed technology and startup websites

- Categories: technology, startup
- Styles: dark-theme, gradient
- Industries: technology, startup

### `e-commerce-modern`

Modern e-commerce sites with clean layouts

- Categories: e-commerce
- Styles: minimalist, grid-layout
- Industries: retail, fashion

### `creative-agencies`

Creative agency websites with bold designs

- Categories: agency, portfolio
- Styles: bold-typography, animation
- Industries: design, marketing, agency

### `health-wellness`

Health and wellness focused designs

- Categories: landing-page
- Industries: healthcare, health-fitness
- Styles: light-theme, minimalist
- Colors: light-colors, pastel-colors

## Examples

### Basic Examples

Scrape minimal portfolios:

```bash
npm run scrape -- --preset minimal-portfolios
```

Scrape dark tech websites:

```bash
npm run scrape -- --preset dark-tech --max-items 15
```

Custom filter combination:

```bash
npm run scrape -- --categories e-commerce,fashion --styles minimalist --colors light-colors --max-items 25
```

Scrape with local image download:

```bash
npm run scrape -- --preset minimal-portfolios --download-images --max-items 10
```

Scrape any Land-book search URL directly:

```bash
npm run scrape -- --url "https://land-book.com/?search=life+coach" --max-items 50
```

Scrape with lazy loading for more items:

```bash
npm run scrape -- --url "https://land-book.com/?search=portfolio+design" --max-items 80 --download-images
```

### Advanced Examples

Scrape with custom configuration and logging:

```bash
npm run scrape -- --config my-config.json --log-level debug --log-file scraper.log
```

Dry run to preview what would be scraped:

```bash
npm run scrape -- --preset creative-agencies --dry-run
```

Generate URL for manual inspection:

```bash
npm run validate-url -- --categories portfolio --styles minimalist,bold-typography
```

## Image Download Feature

By default, the scraper uses external URLs from Land-book's CDN:

```json
{
  "id": "design_001",
  "image": "https://cdn.land-book.com/website/81953/dbee8d92079439b2-www-hyperbolic-ai.webp?w=800&q=85&f=webp",
  "tags": { ... }
}
```

With the `--download-images` flag, images are downloaded locally:

```json
{
  "id": "design_001",
  "image": "/data/images/dbee8d92079439b2-www-hyperbolic-ai.webp",
  "tags": { ... }
}
```

### Benefits of Local Images

- **Self-contained**: No external dependencies
- **Faster loading**: Local file access
- **Offline support**: Works without internet
- **Consistent availability**: Images won't disappear if external URLs change

### Usage

```bash
# Download images locally
npm run scrape -- --download-images --max-items 20

# Test image download functionality
node test-image-download.js
```

Images are saved to `/data/images/` directory and automatically organized by filename.

## Direct URL Support

Instead of using filter options, you can now scrape any Land-book URL directly:

### From Browser to Scraper

1. **Browse Land-book.com** in your browser
2. **Find interesting results** using their search/filter interface
3. **Copy the URL** from your browser address bar
4. **Use the URL directly** with the scraper

### Examples

```bash
# Search results (recommended)
npm run scrape -- --url "https://land-book.com/?search=life+coach"

# Category filters using traditional method
npm run scrape -- --categories portfolio --styles minimalist

# Search with more items (triggers lazy loading)
npm run scrape -- --url "https://land-book.com/?search=life+coach" --max-items 50

# Any Land-book search URL works
npm run scrape -- --url "https://land-book.com/?search=portfolio+design" --max-items 30
```

**Note**: The `--url` option works best with search URLs like `https://land-book.com/?search=term`. For category-based filtering, you can still use the traditional filter options like `--categories` and `--styles`.

## Lazy Loading Feature

The scraper now automatically triggers Land-book's infinite scroll to load more items:

- **Default**: Loads first 20 items
- **With `--max-items 50`**: Triggers lazy loading to get ~50 items
- **With `--max-items 100`**: Triggers multiple lazy loads to get ~100 items
- **Respectful**: Includes delays between loads to avoid overwhelming the server

### How It Works

1. **Initial Load**: Page loads with ~20 items
2. **Scroll Trigger**: Scraper scrolls to bottom to trigger lazy loading
3. **Wait & Repeat**: Waits for new content, then repeats until target reached
4. **Smart Stopping**: Stops when no new items load or target is reached

### Testing

```bash
# Test lazy loading functionality
node test-direct-url-lazy-loading.js

# Test lazy loading only
node test-direct-url-lazy-loading.js --lazy-only
```

## Output Format

The scraper generates a JSON file with the following structure:

```json
{
  "metadata": {
    "generatedAt": "2025-01-30T10:30:00.000Z",
    "source": "land-book.com",
    "totalDesigns": 20,
    "scrapingConfig": {
      "maxItems": 20,
      "filters": {...}
    }
  },
  "designs": [
    {
      "id": "design_1706612345_abc123def",
      "title": "Creative Portfolio",
      "image": "https://cdn.land-book.com/screenshots/design.webp",
      "websiteUrl": "https://example.com?ref=land-book.com",
      "tags": {
        "style": ["Minimalist", "Bold Typography"],
        "industry": ["Design", "Creative"],
        "typography": ["Sans-serif"],
        "type": ["Portfolio"],
        "category": ["Portfolio"],
        "platform": ["Custom"],
        "colors": ["#FFFFFF", "#000000", "#FF6B6B"]
      }
    }
  ]
}
```

## Logging and Progress

The scraper provides detailed logging and progress tracking:

### Log Levels

- **debug**: Detailed debugging information
- **info**: General information and progress updates
- **warn**: Warnings and non-critical issues
- **error**: Errors and failures

### Progress Tracking

- Real-time progress bars during scraping
- ETA calculations and processing rates
- Success/error statistics
- Detailed error summaries

### Example Output

```
🚀 Starting Detail page scraping: 20 items to process
📊 [████████████████████████████░░] 18/20 | 90% | 2 errors | 1.2/s | ETA: 2s
✅ Detail page scraping completed in 16s

📊 Scraping Statistics:
   Total items processed: 20
   Successful extractions: 18
   Errors: 2
   Success rate: 90%
   Average tags per design: 8.5
   Top style tags: Minimalist, Bold Typography, Grid Layout
   Total execution time: 45s
```

## Error Handling

The scraper includes comprehensive error handling:

- **Network errors**: Automatic retries with exponential backoff
- **Missing elements**: Graceful fallbacks and alternative selectors
- **Rate limiting**: Respectful delays between requests
- **Data validation**: Validates extracted data before output
- **Browser crashes**: Automatic browser restart

## Ethical Scraping

This scraper follows ethical web scraping practices:

- **Rate limiting**: Configurable delays between requests
- **Respectful crawling**: Honors robots.txt and terms of service
- **Public data only**: Only scrapes publicly visible thumbnails
- **Attribution**: Includes proper attribution to Land-book.com
- **No personal data**: Does not collect or store personal information

## Troubleshooting

### Common Issues

**Browser fails to launch:**

```bash
# Install required dependencies (Linux)
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

**Memory issues:**

- Reduce `maxItems` in configuration
- Enable headless mode
- Increase system memory or swap

**Network timeouts:**

- Increase `timeout` in configuration
- Check internet connection
- Try different time of day (Land-book may be busy)

**No items found:**

- Verify filters are valid using `npm run list`
- Try broader filter criteria
- Use `--dry-run` to preview URL
- Check if Land-book structure has changed

### Debug Mode

Enable debug logging for detailed information:

```bash
npm run scrape -- --log-level debug --preset minimal-portfolios
```

### Log to File

Save logs to file for analysis:

```bash
npm run scrape -- --log-file scraper.log --preset minimal-portfolios
```

## Development

### Project Structure

```
scraper/
├── cli.js              # Command-line interface
├── scraper.js          # Main scraper class
├── config.js           # Configuration system
├── logger.js           # Logging and progress tracking
├── package.json        # Dependencies and scripts
├── README.md           # This file
└── test-*.js          # Test files
```

### Running Tests

```bash
# Test complete workflow
node test-complete-workflow.js

# Test JSON output
node test-json-output.js

# Test real website scraping
node test-real-website.js
```

### Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Respect ethical scraping practices

## License

MIT License - see package.json for details.

## Support

For issues and questions:

1. Check this README for common solutions
2. Review the troubleshooting section
3. Enable debug logging to investigate issues
4. Check Land-book.com for any structural changes

## Changelog

### v1.0.0

- Initial release with CLI interface
- Configuration system
- Progress tracking and logging
- Predefined presets
- Comprehensive error handling
- Ethical scraping practices
