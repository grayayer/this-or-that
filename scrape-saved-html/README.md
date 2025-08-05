# HTML-Based Land-book Scraper

A two-phase scraping system that works with saved HTML files from Land-book.com, eliminating the need to handle dynamic loading and lazy loading issues.

## Overview

This approach solves the lazy loading problem by having users manually save HTML files after loading all the content they want, then extracting the data from those saved files.

## Workflow

### Phase 1: Manual HTML Saving

1. **Browse Land-book.com** in your browser
2. **Navigate to desired search results** (e.g., `https://land-book.com/?search=health+coach`)
3. **Scroll down** to trigger lazy loading until you have enough results (20, 40, 60, 100+ items)
4. **Save the complete webpage** (Cmd+S / Ctrl+S) with all assets
5. **Place the saved files** in this directory

### Phase 2: Data Extraction

1. **Extract website list** from the saved HTML
2. **Scrape detailed metadata** from each individual website page

## Tools

### 1. Website List Extractor (`extract-websites.js`)

Extracts basic website information from saved HTML files.

**Usage:**

```bash
node extract-websites.js <html-file> [output-file]
```

**Example:**

```bash
node extract-websites.js health-coach.html websites-list.json
```

**What it extracts:**

- Website ID
- Name/Title
- Land-book post URL
- Thumbnail image path
- Category (if available)
- Local image references

### 2. Metadata Scraper (`scrape-metadata.js`)

Scrapes detailed metadata from individual Land-book website pages.

**Usage:**

```bash
node scrape-metadata.js <websites-list.json> [options]
```

**Options:**

- `--headless false` - Run browser in visible mode
- `--max-items N` - Limit to N websites (for testing)
- `--delay N` - Delay between requests in milliseconds
- `--output FILE` - Output file name

**Examples:**

```bash
# Test with first 5 websites
node scrape-metadata.js websites-list.json --max-items 5 --output test-designs.json

# Full scraping with custom delay
node scrape-metadata.js websites-list.json --delay 3000 --output designs.json

# Visible browser for debugging
node scrape-metadata.js websites-list.json --headless false --max-items 3
```

## Complete Example Workflow

### Step 1: Save HTML File

1. Go to `https://land-book.com/?search=health+coach`
2. Scroll down to load more results (you'll see "Load more dope stuff..." buttons)
3. Keep scrolling until you have enough results
4. Save the page as `health-coach.html` (with assets)

### Step 2: Extract Website List

```bash
npm install
node extract-websites.js health-coach.html websites-list.json
```

**Output:**

```
🚀 HTML Website Extractor
==================================================
🔍 Extracting websites from: health-coach.html
📊 Found 105 website items
   ✅ 1. Seriant | Advancing Cutting-Edge Science...
   ✅ 2. Silna Health
   🚫 4. Skipping advertisement
   ...
✅ Extraction completed: 100 websites extracted
💾 Saved 100 websites to: websites-list.json
```

### Step 3: Scrape Detailed Metadata

```bash
node scrape-metadata.js websites-list.json --max-items 10 --output designs.json
```

**Output:**

```
🚀 Website Metadata Scraper
==================================================
📊 Found 10 websites to process
🕷️  Processing 10 websites...
📄 Processing 1/10: Seriant | Advancing Cutting-Edge Science...
   ✅ Successfully scraped metadata
   📊 Tags found: 5
...
✅ Scraping completed successfully!
📄 Results saved to: designs.json
```

## Output Format

The final `designs.json` file follows the same format as the main scraper:

```json
{
  "metadata": {
    "scrapedAt": "2025-08-05T03:49:11.892Z",
    "totalWebsites": 100,
    "source": "metadata-scraping",
    "errors": 0
  },
  "designs": [
    {
      "id": "website_82056",
      "image": "./health-coach_files/c41a3bb8bc0f1430-seriant-org.webp",
      "title": "Seriant | Advancing Cutting-Edge Science...",
      "tags": {
        "style": ["Modern", "Clean"],
        "industry": ["Health", "Tech"],
        "typography": ["Sans Serif"],
        "type": ["Landing Page"],
        "category": ["Healthcare"],
        "platform": ["React"],
        "colors": ["#FFFFFF", "#0066CC"]
      }
    }
  ]
}
```

## Advantages

✅ **No lazy loading issues** - User controls how much content to load
✅ **Reliable extraction** - Works with static HTML, no dynamic content issues
✅ **Flexible** - Works with any Land-book search or filter results
✅ **Respectful** - Controlled scraping pace with delays
✅ **Debuggable** - Can run browser in visible mode
✅ **Testable** - Easy to test with small samples

## File Structure

```
scrape-saved-html/
├── README.md                 # This file
├── package.json             # Dependencies
├── extract-websites.js      # Phase 1: Extract website list
├── scrape-metadata.js       # Phase 2: Scrape metadata
├── health-coach.html        # Saved HTML file (example)
├── health-coach_files/      # Saved assets directory
├── websites-list.json       # Phase 1 output
└── designs.json            # Final output
```

## Dependencies

- `jsdom` - HTML parsing for extraction
- `puppeteer` - Browser automation for metadata scraping

## Tips

1. **Save with assets** - Make sure to save the complete webpage with all images
2. **Load enough content** - Scroll and load as many results as you need before saving
3. **Test first** - Use `--max-items 5` to test before running full scraping
4. **Be respectful** - Use appropriate delays between requests
5. **Check results** - Review the extracted data before using it

This approach gives you complete control over the data collection process while avoiding the complexities of dynamic content loading.
