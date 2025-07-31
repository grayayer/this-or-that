const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class LandBookScraper {
	constructor(options = {}) {
		this.browser = null;
		this.page = null;
		this.options = {
			headless: options.headless !== false, // Default to headless
			slowMo: options.slowMo || 100, // Add delay between actions
			timeout: options.timeout || 30000,
			maxItems: options.maxItems || 20, // Free account limit
			...options
		};
		this.scraped = [];
		this.errors = [];
	}

	async initialize() {
		console.log('🚀 Initializing Land-book scraper...');

		try {
			this.browser = await puppeteer.launch({
				headless: this.options.headless,
				slowMo: this.options.slowMo,
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-accelerated-2d-canvas',
					'--no-first-run',
					'--no-zygote',
					'--disable-gpu'
				]
			});

			this.page = await this.browser.newPage();

			// Set user agent to avoid bot detection
			await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

			// Set viewport for consistent screenshots
			await this.page.setViewport({ width: 1200, height: 800 });

			// Set timeout for navigation
			this.page.setDefaultTimeout(this.options.timeout);

			console.log('✅ Browser initialized successfully');
			return true;
		} catch (error) {
			console.error('❌ Failed to initialize browser:', error.message);
			this.errors.push({ type: 'initialization', error: error.message });
			return false;
		}
	}

	async navigateToUrl(urlInfo) {
		if (!this.page) {
			throw new Error('Browser not initialized. Call initialize() first.');
		}

		console.log(`🔍 Navigating to Land-book page...`);
		console.log(`   Page type: ${urlInfo.pageType}`);
		if (Object.keys(urlInfo.params).length > 0) {
			console.log(`   Parameters: ${JSON.stringify(urlInfo.params)}`);
		}

		try {
			console.log(`📍 URL: ${urlInfo.originalUrl}`);

			// Navigate to the page
			await this.page.goto(urlInfo.originalUrl, {
				waitUntil: 'networkidle2',
				timeout: this.options.timeout
			});

			// Wait a moment for page to load
			await new Promise(resolve => setTimeout(resolve, 3000));

			// Try multiple possible selectors for the websites grid
			const possibleSelectors = [
				'#websites.websites',
				'#websites',
				'.websites',
				'.gallery-grid',
				'.website-grid',
				'[data-websites]',
				'.grid-container',
				'.results-grid',
				'.designs-grid'
			];

			let gridFound = false;
			for (const selector of possibleSelectors) {
				try {
					await this.page.waitForSelector(selector, { timeout: 5000 });
					console.log(`✅ Found websites grid with selector: ${selector}`);
					gridFound = true;
					break;
				} catch (e) {
					// Try next selector
					continue;
				}
			}

			if (!gridFound) {
				// Let's see what's actually on the page
				console.log('🔍 Grid not found, analyzing page structure...');
				const pageInfo = await this.page.evaluate(() => {
					const title = document.title;
					const bodyClasses = document.body.className;
					const mainContent = document.querySelector('main, .main, #main, .content');
					const grids = document.querySelectorAll('[class*="grid"], [class*="website"], [id*="website"], [class*="result"], [class*="design"]');

					return {
						title,
						bodyClasses,
						hasMainContent: !!mainContent,
						gridElements: Array.from(grids).map(el => ({
							tagName: el.tagName,
							id: el.id,
							className: el.className,
							children: el.children.length
						})).slice(0, 10) // Limit to first 10
					};
				});

				console.log('📋 Page analysis:', JSON.stringify(pageInfo, null, 2));

				// Try to find any container with website items
				const websiteItems = await this.page.evaluate(() => {
					const items = document.querySelectorAll('[class*="website"], [data-website], a[href*="/website/"]');
					return items.length;
				});

				if (websiteItems > 0) {
					console.log(`✅ Found ${websiteItems} website items without specific grid container`);
					gridFound = true;
				} else {
					throw new Error('No website grid or items found on page');
				}
			}

			console.log('✅ Successfully navigated to category page');

			// Check if we're on a free account with limited results
			const limitNotice = await this.page.$('.limit-notice, .upgrade-notice, .premium-notice');
			if (limitNotice) {
				console.log('⚠️  Free account detected - limited to 20 items per page');
			}

			return true;
		} catch (error) {
			console.error('❌ Failed to navigate to category:', error.message);
			this.errors.push({
				type: 'navigation',
				category,
				filters,
				error: error.message
			});
			return false;
		}
	}

	async handleFreeAccountLimits() {
		console.log('🔄 Checking for free account limitations...');

		try {
			// Look for pagination or load more buttons
			const loadMoreButton = await this.page.$('.load-more, .show-more, [data-load-more]');
			const paginationNext = await this.page.$('.pagination .next, .pagination a[rel="next"]');

			if (loadMoreButton) {
				console.log('📄 Found load more button - free account confirmed');
				return { hasLimits: true, type: 'load-more', element: loadMoreButton };
			}

			if (paginationNext) {
				console.log('📄 Found pagination - checking if limited');
				return { hasLimits: true, type: 'pagination', element: paginationNext };
			}

			// Check for upgrade prompts or limit messages
			const upgradePrompt = await this.page.$('.upgrade-prompt, .limit-reached, .premium-feature');
			if (upgradePrompt) {
				console.log('💰 Upgrade prompt detected - free account limits active');
				return { hasLimits: true, type: 'upgrade-prompt' };
			}

			console.log('✅ No obvious free account limitations detected');
			return { hasLimits: false };
		} catch (error) {
			console.error('❌ Error checking account limits:', error.message);
			this.errors.push({ type: 'limit-check', error: error.message });
			return { hasLimits: false, error: error.message };
		}
	}

	async getAvailableItems() {
		console.log('📊 Counting available items on current page...');

		try {
			// Wait a moment for dynamic content to load
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Count website items using multiple possible selectors
			const itemCount = await this.page.evaluate(() => {
				// Try different grid containers
				const possibleGrids = [
					'#websites.websites',
					'#websites',
					'.websites',
					'.gallery-grid',
					'.website-grid',
					'[data-websites]',
					'.grid-container',
					'main',
					'.main'
				];

				let items = [];
				for (const gridSelector of possibleGrids) {
					const grid = document.querySelector(gridSelector);
					if (grid) {
						const foundItems = grid.querySelectorAll('.website-item-wrapper, .website-item, [data-website-id], [class*="website"], a[href*="/website/"]');
						if (foundItems.length > 0) {
							items = Array.from(foundItems);
							break;
						}
					}
				}

				// If no grid found, search the entire document
				if (items.length === 0) {
					items = Array.from(document.querySelectorAll('.website-item-wrapper, .website-item, [data-website-id], [class*="website"], a[href*="/website/"]'));
				}

				return items.length;
			});

			console.log(`📈 Found ${itemCount} items on current page`);

			// Respect free account limits
			const effectiveLimit = Math.min(itemCount, this.options.maxItems);
			if (itemCount > this.options.maxItems) {
				console.log(`⚠️  Limiting to ${this.options.maxItems} items due to free account restrictions`);
			}

			return { total: itemCount, available: effectiveLimit };
		} catch (error) {
			console.error('❌ Error counting items:', error.message);
			this.errors.push({ type: 'item-count', error: error.message });
			return { total: 0, available: 0 };
		}
	}

	async close() {
		console.log('🔄 Closing browser...');

		if (this.browser) {
			await this.browser.close();
			console.log('✅ Browser closed successfully');
		}
	}

	async scrapeGridPage() {
		console.log('🕷️  Starting grid page scraping...');

		try {
			// Wait for content to be fully loaded
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Extract website items from the grid
			const websiteData = await this.page.evaluate(() => {
				// Find the websites grid container
				const possibleGrids = [
					'#websites.websites',
					'#websites',
					'.websites',
					'.gallery-grid',
					'.website-grid',
					'[data-websites]',
					'.grid-container'
				];

				let grid = null;
				for (const selector of possibleGrids) {
					grid = document.querySelector(selector);
					if (grid) break;
				}

				if (!grid) {
					// Fallback to document body if no specific grid found
					grid = document.body;
				}

				// Find website item wrappers
				const itemSelectors = [
					'.website-item-wrapper',
					'.website-item',
					'[data-website-id]',
					'[class*="website"]',
					'a[href*="/website/"]'
				];

				let items = [];
				for (const selector of itemSelectors) {
					items = Array.from(grid.querySelectorAll(selector));
					if (items.length > 0) break;
				}

				console.log(`Found ${items.length} website items`);

				return items.map((item, index) => {
					try {
						// Extract thumbnail image URL
						let thumbnailUrl = null;
						const imgSelectors = [
							'img',
							'.thumbnail img',
							'.website-thumbnail img',
							'[data-src]',
							'[style*="background-image"]'
						];

						for (const imgSelector of imgSelectors) {
							const img = item.querySelector(imgSelector);
							if (img) {
								thumbnailUrl = img.src || img.dataset.src || img.getAttribute('data-src');
								if (!thumbnailUrl && img.style.backgroundImage) {
									const match = img.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
									if (match) thumbnailUrl = match[1];
								}
								if (thumbnailUrl) break;
							}
						}

						// Extract detail page link
						let detailUrl = null;
						const linkSelectors = [
							'a[href*="/website/"]',
							'a',
							'[data-href]',
							'[href]'
						];

						for (const linkSelector of linkSelectors) {
							const link = item.querySelector(linkSelector);
							if (link && link.href && link.href.includes('/website/')) {
								detailUrl = link.href;
								break;
							}
						}

						// If item itself is a link
						if (!detailUrl && item.tagName === 'A' && item.href && item.href.includes('/website/')) {
							detailUrl = item.href;
						}

						// Extract any visible text/title
						let title = null;
						const titleSelectors = [
							'.title',
							'.website-title',
							'h1', 'h2', 'h3',
							'.name',
							'[data-title]'
						];

						for (const titleSelector of titleSelectors) {
							const titleEl = item.querySelector(titleSelector);
							if (titleEl && titleEl.textContent.trim()) {
								title = titleEl.textContent.trim();
								break;
							}
						}

						return {
							index,
							thumbnailUrl,
							detailUrl,
							title,
							element: {
								tagName: item.tagName,
								className: item.className,
								id: item.id
							}
						};
					} catch (error) {
						console.error(`Error processing item ${index}:`, error);
						return {
							index,
							error: error.message,
							element: {
								tagName: item.tagName,
								className: item.className,
								id: item.id
							}
						};
					}
				});
			});

			// Filter out items with errors or missing data
			const validItems = websiteData.filter(item =>
				!item.error &&
				item.thumbnailUrl &&
				item.detailUrl &&
				item.detailUrl.startsWith('http') // Ensure it's a full URL
			);

			// Limit to maxItems for free accounts
			const limitedItems = validItems.slice(0, this.options.maxItems);

			console.log(`✅ Successfully scraped ${limitedItems.length} valid items from ${websiteData.length} total items`);

			if (websiteData.length > limitedItems.length) {
				console.log(`⚠️  Limited to ${limitedItems.length} items due to free account restrictions`);
			}

			// Log any items with errors for debugging
			const errorItems = websiteData.filter(item => item.error);
			if (errorItems.length > 0) {
				console.log(`⚠️  ${errorItems.length} items had errors during processing`);
			}

			return {
				success: true,
				items: limitedItems,
				totalFound: websiteData.length,
				validItems: validItems.length,
				errorItems: errorItems.length
			};

		} catch (error) {
			console.error('❌ Failed to scrape grid page:', error.message);
			this.errors.push({
				type: 'grid-scraping',
				error: error.message
			});
			return {
				success: false,
				items: [],
				error: error.message
			};
		}
	}

	getErrors() {
		return this.errors;
	}

	hasErrors() {
		return this.errors.length > 0;
	}
}

// Helper function to prompt user for input
function promptUser(question) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

// Helper function to parse Land-book URL and extract parameters
function parseLandBookUrl(url) {
	try {
		const urlObj = new URL(url);

		// Check if it's a Land-book URL
		if (!urlObj.hostname.includes('land-book.com')) {
			throw new Error('URL must be from land-book.com');
		}

		const searchParams = urlObj.searchParams;
		const pathParts = urlObj.pathname.split('/').filter(part => part);

		// Extract all query parameters
		const params = {};
		for (const [key, value] of searchParams.entries()) {
			params[key] = value;
		}

		// Determine the type of page
		let pageType = 'gallery'; // default
		if (pathParts.length > 0) {
			if (pathParts[0] === 'design') {
				pageType = 'design';
			}
		}

		return {
			pageType,
			params,
			originalUrl: url,
			// For backwards compatibility, extract common parameters
			industry: params.industry || null,
			style: params.style || null,
			type: params.type || null,
			color: params.color || null,
			colorSensitiveness: params.colorSensitiveness || null,
			platform: params.platform || null
		};
	} catch (error) {
		throw new Error(`Invalid URL: ${error.message}`);
	}
}

// Export for use as module
module.exports = LandBookScraper;

// CLI usage when run directly
if (require.main === module) {
	async function main() {
		console.log('🎨 Welcome to the Land-book Design Scraper!');
		console.log('This tool helps you collect design inspiration from Land-book.com\n');

		try {
			// Get URL from user
			console.log('📝 Please provide the Land-book URL you want to scrape:');
			console.log('   Example: https://land-book.com/?industry=health-and-fitness&style=light-colors');
			console.log('   Example: https://land-book.com/?industry=health-and-fitness&colorSensitiveness=4&color=FFFFFF&type=personal');
			console.log('   Example: https://land-book.com/?type=personal');
			console.log('   Example: https://land-book.com/design/about-us-page');
			console.log('   Example: https://land-book.com/design/case-study\n');

			const userUrl = await promptUser('🔗 Enter Land-book URL: ');

			if (!userUrl) {
				console.log('❌ No URL provided. Exiting...');
				process.exit(1);
			}

			// Parse the URL
			let urlInfo;
			try {
				urlInfo = parseLandBookUrl(userUrl);
				console.log(`\n✅ URL parsed successfully:`);
				console.log(`   Page type: ${urlInfo.pageType}`);
				if (urlInfo.industry) console.log(`   Industry: ${urlInfo.industry}`);
				if (urlInfo.style) console.log(`   Style: ${urlInfo.style}`);
				if (urlInfo.type) console.log(`   Type: ${urlInfo.type}`);
				if (urlInfo.color) console.log(`   Color: #${urlInfo.color}`);
				if (urlInfo.colorSensitiveness) console.log(`   Color sensitivity: ${urlInfo.colorSensitiveness}`);
				if (urlInfo.platform) console.log(`   Platform: ${urlInfo.platform}`);
				if (Object.keys(urlInfo.params).length === 0) {
					console.log(`   Parameters: none (browsing all designs)`);
				}
			} catch (error) {
				console.error(`❌ ${error.message}`);
				console.log('\n💡 Make sure you copy the URL from your browser while viewing the Land-book page.');
				process.exit(1);
			}

			// Ask about browser visibility
			console.log('\n🖥️  Browser options:');
			const showBrowser = await promptUser('Show browser window while scraping? (y/n) [default: n]: ');
			const headless = !['y', 'yes', 'true', '1'].includes(showBrowser.toLowerCase());

			// Ask about item limit
			console.log('\n📊 Scraping options:');
			const maxItemsInput = await promptUser('Maximum items to scrape (default: 20): ');
			const maxItems = parseInt(maxItemsInput) || 20;

			console.log(`\n🚀 Starting scraper with:`);
			console.log(`   URL: ${urlInfo.originalUrl}`);
			console.log(`   Browser: ${headless ? 'Hidden' : 'Visible'}`);
			console.log(`   Max items: ${maxItems}`);
			console.log(`\n⏳ Please wait while we scrape the designs...\n`);

			const scraper = new LandBookScraper({
				headless: headless,
				slowMo: headless ? 50 : 200, // Faster when headless
				maxItems: maxItems
			});

			const initialized = await scraper.initialize();
			if (!initialized) {
				console.error('❌ Failed to initialize scraper');
				process.exit(1);
			}

			const navigated = await scraper.navigateToUrl(urlInfo);
			if (!navigated) {
				console.error('❌ Failed to navigate to the specified page');
				console.log('💡 Please check that the URL is correct and the page is accessible.');
				process.exit(1);
			}

			const limits = await scraper.handleFreeAccountLimits();
			if (limits.hasLimits) {
				console.log(`⚠️  Free account limitations detected (${limits.type})`);
			}

			const items = await scraper.getAvailableItems();
			console.log(`📈 Found ${items.total} items on the page`);

			if (items.available === 0) {
				console.log('❌ No items found to scrape. Please check the URL and try again.');
				process.exit(1);
			}

			// Test grid scraping
			console.log('🕷️  Scraping website thumbnails and links...');
			const gridResults = await scraper.scrapeGridPage();

			if (!gridResults.success) {
				console.error('❌ Failed to scrape the grid page');
				process.exit(1);
			}

			// Show sample of scraped data
			if (gridResults.items.length > 0) {
				console.log(`\n✅ Successfully scraped ${gridResults.items.length} designs!`);
				console.log('\n📋 Sample scraped items:');
				gridResults.items.slice(0, 3).forEach((item, index) => {
					console.log(`   ${index + 1}. ${item.title || 'Untitled'}`);
					console.log(`      Thumbnail: ${item.thumbnailUrl?.substring(0, 60)}...`);
					console.log(`      Detail URL: ${item.detailUrl?.substring(0, 60)}...`);
				});

				if (gridResults.items.length > 3) {
					console.log(`   ... and ${gridResults.items.length - 3} more items`);
				}
			}

			console.log('\n🎉 Basic scraper setup and grid scraping completed successfully!');
			console.log('📋 Summary:');
			console.log(`   ✅ Browser initialized`);
			console.log(`   ✅ Navigation successful`);
			console.log(`   ✅ Grid scraping successful`);
			console.log(`   📊 Items found: ${items.available}/${items.total}`);
			console.log(`   📊 Items scraped: ${gridResults.items.length}`);
			console.log(`   ⚠️  Errors: ${scraper.getErrors().length}`);

			if (scraper.hasErrors()) {
				console.log('\n❌ Errors encountered:');
				scraper.getErrors().forEach((error, index) => {
					console.log(`   ${index + 1}. ${error.type}: ${error.error}`);
				});
			}

			console.log('\n✨ Ready to proceed with detail page scraping!');
			console.log('💡 This completes the basic setup and grid scraping. Next steps will implement detail page data extraction.');

		} catch (error) {
			console.error('❌ Scraper failed:', error.message);
			process.exit(1);
		} finally {
			await scraper.close();
		}
	}

	main().catch(console.error);
}