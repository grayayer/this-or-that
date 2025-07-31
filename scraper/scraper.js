const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

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

	async navigateToCategory(category = 'health-and-fitness', filters = ['light-colors']) {
		if (!this.page) {
			throw new Error('Browser not initialized. Call initialize() first.');
		}

		console.log(`🔍 Navigating to category: ${category} with filters: ${filters.join(', ')}`);

		try {
			// Build URL with category and filters
			let url = `https://land-book.com/gallery/${category}`;
			if (filters && filters.length > 0) {
				url += `?${filters.map(filter => `filters[]=${filter}`).join('&')}`;
			}

			console.log(`📍 URL: ${url}`);

			// Navigate to the category page
			await this.page.goto(url, {
				waitUntil: 'networkidle2',
				timeout: this.options.timeout
			});

			// Wait for the websites grid to load
			await this.page.waitForSelector('#websites.websites', {
				timeout: this.options.timeout
			});

			console.log('✅ Successfully navigated to category page');

			// Check if we're on a free account with limited results
			const limitNotice = await this.page.$('.limit-notice, .upgrade-notice');
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
			await this.page.waitForTimeout(2000);

			// Count website items in the grid
			const itemCount = await this.page.evaluate(() => {
				const grid = document.querySelector('#websites.websites');
				if (!grid) return 0;

				const items = grid.querySelectorAll('.website-item-wrapper, .website-item, [data-website-id]');
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

	getErrors() {
		return this.errors;
	}

	hasErrors() {
		return this.errors.length > 0;
	}
}

// Export for use as module
module.exports = LandBookScraper;

// CLI usage when run directly
if (require.main === module) {
	async function main() {
		const scraper = new LandBookScraper({
			headless: false, // Show browser for debugging
			slowMo: 200
		});

		try {
			const initialized = await scraper.initialize();
			if (!initialized) {
				console.error('Failed to initialize scraper');
				process.exit(1);
			}

			const navigated = await scraper.navigateToCategory('health-and-fitness', ['light-colors']);
			if (!navigated) {
				console.error('Failed to navigate to category');
				process.exit(1);
			}

			const limits = await scraper.handleFreeAccountLimits();
			console.log('Account limits:', limits);

			const items = await scraper.getAvailableItems();
			console.log('Available items:', items);

			console.log('\n🎉 Basic scraper setup completed successfully!');
			console.log('📋 Summary:');
			console.log(`   - Browser initialized: ✅`);
			console.log(`   - Navigation successful: ✅`);
			console.log(`   - Items found: ${items.available}/${items.total}`);
			console.log(`   - Errors: ${scraper.getErrors().length}`);

			if (scraper.hasErrors()) {
				console.log('\n❌ Errors encountered:');
				scraper.getErrors().forEach((error, index) => {
					console.log(`   ${index + 1}. ${error.type}: ${error.error}`);
				});
			}

		} catch (error) {
			console.error('❌ Scraper failed:', error.message);
			process.exit(1);
		} finally {
			await scraper.close();
		}
	}

	main().catch(console.error);
}