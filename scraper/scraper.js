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
			await new Promise(resolve => setTimeout(resolve, 3000));

			// Extract website items from the grid
			const websiteData = await this.page.evaluate(() => {
				// Find the websites grid container - target ID="websites" class="websites" specifically
				const primaryGrid = document.querySelector('#websites.websites');

				// Also try other possible grid containers
				const possibleGrids = [
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

				let grid = primaryGrid; // Prefer the specific target
				if (!grid) {
					for (const selector of possibleGrids) {
						grid = document.querySelector(selector);
						if (grid) break;
					}
				}

				if (!grid) {
					// Fallback to document body if no specific grid found
					grid = document.body;
				}

				// Find website-item-wrapper elements specifically
				const itemSelectors = [
					'.website-item-wrapper',
					'.website-item',
					'[data-website-id]',
					'[class*="website-item"]',
					'a[href*="/website/"]',
					'[class*="design-item"]',
					'a[href*="/design/"]'
				];

				let items = [];
				for (const selector of itemSelectors) {
					items = Array.from(grid.querySelectorAll(selector));
					if (items.length > 0) {
						console.log(`Found ${items.length} items using selector: ${selector}`);
						break;
					}
				}

				if (items.length === 0) {
					console.log('No items found with standard selectors, trying broader search...');
					// Broader search for any links that might be website items
					items = Array.from(document.querySelectorAll('a[href*="/website/"], a[href*="/design/"]'));
				}

				console.log(`Processing ${items.length} website items`);

				return items.map((item, index) => {
					try {
						// Check if this item contains an advertisement - exclude if it does
						const hasAd = item.querySelector('div.framer-v2-ad');
						if (hasAd) {
							return {
								index,
								isAdvertisement: true,
								excluded: true,
								element: {
									tagName: item.tagName,
									className: item.className,
									id: item.id
								}
							};
						}

						// Extract thumbnail image URL
						let thumbnailUrl = null;
						const imgSelectors = [
							'img',
							'.thumbnail img',
							'.website-thumbnail img',
							'.preview img',
							'[data-src]',
							'[style*="background-image"]'
						];

						for (const imgSelector of imgSelectors) {
							const img = item.querySelector(imgSelector);
							if (img) {
								// Try different image URL sources
								thumbnailUrl = img.src ||
									img.dataset.src ||
									img.getAttribute('data-src') ||
									img.getAttribute('data-lazy-src');

								// Handle background images
								if (!thumbnailUrl && img.style.backgroundImage) {
									const match = img.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
									if (match) thumbnailUrl = match[1];
								}

								if (thumbnailUrl && thumbnailUrl !== 'about:blank') break;
							}
						}

						// Extract detail page link
						let detailUrl = null;

						// If item itself is a link
						if (item.tagName === 'A' && item.href) {
							detailUrl = item.href;
						} else {
							// Look for links within the item
							const linkSelectors = [
								'a[href*="/website/"]',
								'a[href*="/design/"]',
								'a',
								'[data-href]'
							];

							for (const linkSelector of linkSelectors) {
								const link = item.querySelector(linkSelector);
								if (link && link.href && (link.href.includes('/website/') || link.href.includes('/design/'))) {
									detailUrl = link.href;
									break;
								}
							}
						}

						// Extract any visible text/title
						let title = null;
						const titleSelectors = [
							'.title',
							'.website-title',
							'.name',
							'h1', 'h2', 'h3', 'h4',
							'[data-title]',
							'.caption',
							'figcaption'
						];

						for (const titleSelector of titleSelectors) {
							const titleEl = item.querySelector(titleSelector);
							if (titleEl && titleEl.textContent.trim()) {
								title = titleEl.textContent.trim();
								break;
							}
						}

						// If no title found, try to extract from alt text or data attributes
						if (!title) {
							const img = item.querySelector('img');
							if (img && img.alt) {
								title = img.alt.trim();
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
								id: item.id,
								href: item.href || null
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

			// Filter out items with errors, missing critical data, or advertisements
			const validItems = websiteData.filter(item => {
				if (item.error) return false;
				if (item.excluded || item.isAdvertisement) return false;
				if (!item.detailUrl) return false;
				if (!item.detailUrl.startsWith('http')) return false;
				// Thumbnail is nice to have but not required
				return true;
			});

			// Limit to maxItems for free accounts
			const limitedItems = validItems.slice(0, this.options.maxItems);

			console.log(`✅ Successfully scraped ${limitedItems.length} valid items from ${websiteData.length} total items`);

			if (websiteData.length > limitedItems.length) {
				console.log(`⚠️  Limited to ${limitedItems.length} items due to free account restrictions`);
			}

			// Log any items with errors or exclusions for debugging
			const errorItems = websiteData.filter(item => item.error);
			const adItems = websiteData.filter(item => item.isAdvertisement);

			if (errorItems.length > 0) {
				console.log(`⚠️  ${errorItems.length} items had errors during processing`);
				// Log first few errors for debugging
				errorItems.slice(0, 3).forEach((item, index) => {
					console.log(`   Error ${index + 1}: ${item.error}`);
				});
			}

			if (adItems.length > 0) {
				console.log(`🚫 ${adItems.length} advertisement items excluded`);
			}

			// Log items missing thumbnails
			const noThumbnailItems = validItems.filter(item => !item.thumbnailUrl);
			if (noThumbnailItems.length > 0) {
				console.log(`⚠️  ${noThumbnailItems.length} items missing thumbnail images`);
			}

			return {
				success: true,
				items: limitedItems,
				totalFound: websiteData.length,
				validItems: validItems.length,
				errorItems: errorItems.length,
				noThumbnailItems: noThumbnailItems.length
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

	async scrapeDetailPage(detailUrl) {
		console.log(`🔍 Scraping detail page: ${detailUrl.substring(0, 60)}...`);

		try {
			// Navigate to the detail page
			await this.page.goto(detailUrl, {
				waitUntil: 'networkidle2',
				timeout: this.options.timeout
			});

			// Wait for content to load
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Extract detailed data from the page
			const detailData = await this.page.evaluate(() => {
				const result = {
					websiteName: null,
					websiteUrl: null,
					category: null,
					style: null,
					industry: null,
					type: null,
					colors: [],
					screenshotUrl: null,
					tags: []
				};

				// Target div.website-content-sidebar for taxonomy data
				const sidebar = document.querySelector('div.website-content-sidebar');

				if (sidebar) {
					// Extract website name from H1 element within the sidebar
					const h1 = sidebar.querySelector('h1');
					if (h1) {
						result.websiteName = h1.textContent.trim();
					}

					// Extract website URL from anchor with "?ref=land-book.com" query parameter
					const refLink = sidebar.querySelector('a[href*="?ref=land-book.com"]');
					if (refLink) {
						result.websiteUrl = refLink.href;
					}

					// Parse taxonomy sections (Category, Style, Industry, Type) from row elements with text-muted labels
					const taxonomyRows = sidebar.querySelectorAll('.row, [class*="row"]');
					taxonomyRows.forEach(row => {
						const label = row.querySelector('.text-muted, [class*="text-muted"], .label, [class*="label"]');
						if (label) {
							const labelText = label.textContent.trim().toLowerCase();
							const valueElement = row.querySelector('a, span, div');

							if (valueElement && valueElement !== label) {
								const value = valueElement.textContent.trim();

								if (labelText.includes('category')) {
									result.category = value;
								} else if (labelText.includes('style')) {
									result.style = value;
								} else if (labelText.includes('industry')) {
									result.industry = value;
								} else if (labelText.includes('type')) {
									result.type = value;
								}
							}
						}
					});

					// Extract color hex codes from website-colors-item elements' background-color styles
					const colorItems = sidebar.querySelectorAll('.website-colors-item, [class*="color"]');
					colorItems.forEach(colorItem => {
						const bgColor = colorItem.style.backgroundColor;
						if (bgColor) {
							// Convert RGB to hex if needed
							const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
							if (rgbMatch) {
								const r = parseInt(rgbMatch[1]);
								const g = parseInt(rgbMatch[2]);
								const b = parseInt(rgbMatch[3]);
								const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
								result.colors.push(hex.toUpperCase());
							}
						}

						// Also check for direct hex color in data attributes or text
						const hexColor = colorItem.getAttribute('data-color') ||
							colorItem.textContent.match(/#[0-9A-Fa-f]{6}/);
						if (hexColor) {
							result.colors.push(typeof hexColor === 'string' ? hexColor : hexColor[0]);
						}
					});
				}

				// If sidebar approach doesn't work, try alternative selectors
				if (!result.websiteName) {
					const altNameSelectors = ['h1', '.website-title', '.title', '[data-title]'];
					for (const selector of altNameSelectors) {
						const nameEl = document.querySelector(selector);
						if (nameEl && nameEl.textContent.trim()) {
							result.websiteName = nameEl.textContent.trim();
							break;
						}
					}
				}

				if (!result.websiteUrl) {
					const altUrlSelectors = [
						'a[href*="?ref="]',
						'a[target="_blank"]',
						'.website-link a',
						'[data-url]'
					];
					for (const selector of altUrlSelectors) {
						const urlEl = document.querySelector(selector);
						if (urlEl && urlEl.href) {
							result.websiteUrl = urlEl.href;
							break;
						}
					}
				}

				// Capture high-quality screenshot URLs from detail pages
				const screenshotSelectors = [
					'.website-screenshot img',
					'.preview-image img',
					'.main-image img',
					'img[src*="screenshot"]',
					'img[src*="preview"]',
					'.website-image img'
				];

				for (const selector of screenshotSelectors) {
					const img = document.querySelector(selector);
					if (img && img.src && !img.src.includes('thumbnail')) {
						result.screenshotUrl = img.src;
						break;
					}
				}

				// Extract additional tags from various sources
				const tagSelectors = [
					'.tags a',
					'.categories a',
					'.labels span',
					'[data-tags]'
				];

				tagSelectors.forEach(selector => {
					const tagElements = document.querySelectorAll(selector);
					tagElements.forEach(tag => {
						const tagText = tag.textContent.trim();
						if (tagText && !result.tags.includes(tagText)) {
							result.tags.push(tagText);
						}
					});
				});

				// Add taxonomy data to tags if not already present
				[result.category, result.style, result.industry, result.type].forEach(item => {
					if (item && !result.tags.includes(item)) {
						result.tags.push(item);
					}
				});

				return result;
			});

			// Validate and clean up the extracted data
			const cleanedData = {
				websiteName: detailData.websiteName || 'Untitled',
				websiteUrl: detailData.websiteUrl || null,
				category: detailData.category || null,
				style: detailData.style || null,
				industry: detailData.industry || null,
				type: detailData.type || null,
				colors: [...new Set(detailData.colors)], // Remove duplicates
				screenshotUrl: detailData.screenshotUrl || null,
				tags: [...new Set(detailData.tags.filter(tag => tag && tag.length > 0))], // Remove duplicates and empty tags
				detailPageUrl: detailUrl
			};

			console.log(`✅ Successfully scraped detail page for: ${cleanedData.websiteName}`);

			return {
				success: true,
				data: cleanedData
			};

		} catch (error) {
			console.error(`❌ Failed to scrape detail page ${detailUrl}:`, error.message);
			this.errors.push({
				type: 'detail-scraping',
				url: detailUrl,
				error: error.message
			});

			return {
				success: false,
				error: error.message,
				url: detailUrl
			};
		}
	}

	async scrapeAllDetailPages(gridItems) {
		console.log(`🕷️  Starting detail page scraping for ${gridItems.length} items...`);

		const results = [];
		const errors = [];

		for (let i = 0; i < gridItems.length; i++) {
			const item = gridItems[i];
			console.log(`\n📄 Processing item ${i + 1}/${gridItems.length}: ${item.title || 'Untitled'}`);

			try {
				const detailResult = await this.scrapeDetailPage(item.detailUrl);

				if (detailResult.success) {
					// Combine grid data with detail data
					const combinedData = {
						id: `design_${Date.now()}_${i}`, // Generate unique ID
						...detailResult.data,
						thumbnailUrl: item.thumbnailUrl,
						gridTitle: item.title,
						gridIndex: item.index
					};

					results.push(combinedData);
				} else {
					errors.push(detailResult);
				}

				// Add delay between requests to be respectful
				if (i < gridItems.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
				}

			} catch (error) {
				console.error(`❌ Error processing item ${i + 1}:`, error.message);
				errors.push({
					success: false,
					error: error.message,
					url: item.detailUrl,
					item: item
				});
			}
		}

		console.log(`\n✅ Detail scraping completed!`);
		console.log(`   Successfully scraped: ${results.length}/${gridItems.length} items`);
		console.log(`   Errors: ${errors.length}`);

		return {
			success: true,
			results: results,
			errors: errors,
			totalProcessed: gridItems.length,
			successCount: results.length,
			errorCount: errors.length
		};
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