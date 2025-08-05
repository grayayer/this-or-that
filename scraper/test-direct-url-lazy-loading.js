#!/usr/bin/env node

/**
 * Test script for direct URL support and lazy loading functionality
 * Tests the enhanced scraper with any Land-book URL and lazy loading
 */

const LandBookScraper = require('./scraper.js');

async function testDirectUrlAndLazyLoading() {
	console.log('🧪 Testing Direct URL Support and Lazy Loading\n');

	const scraper = new LandBookScraper({
		headless: false, // Show browser for debugging
		maxItems: 50, // Test with more items to trigger lazy loading
		downloadImages: false // Skip image download for faster testing
	});

	try {
		// Test URLs
		const testUrls = [
			'https://land-book.com/?search=life+coach',
			'https://land-book.com/websites?categories=portfolio',
			'https://land-book.com/websites?styles=minimalist',
			'https://land-book.com/websites' // Basic URL
		];

		// Initialize scraper
		console.log('1. Initializing scraper...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			throw new Error('Failed to initialize scraper');
		}

		// Test each URL
		for (let i = 0; i < testUrls.length; i++) {
			const testUrl = testUrls[i];
			console.log(`\n${i + 2}. Testing URL: ${testUrl}`);

			try {
				// Navigate to the URL
				const urlInfo = {
					originalUrl: testUrl,
					pageType: 'gallery',
					params: {}
				};

				const navigated = await scraper.navigateToUrl(urlInfo);
				if (!navigated) {
					console.log(`   ❌ Failed to navigate to ${testUrl}`);
					continue;
				}

				console.log(`   ✅ Successfully navigated to ${testUrl}`);

				// Test lazy loading
				console.log(`   🔄 Testing lazy loading...`);
				const loadCount = await scraper.triggerLazyLoading(3); // Test with 3 loads
				console.log(`   📊 Lazy loading completed: ${loadCount} successful loads`);

				// Scrape the page
				console.log(`   🕷️  Scraping page content...`);
				const results = await scraper.scrapeGridPage();

				if (results.success) {
					console.log(`   ✅ Scraping successful:`);
					console.log(`      Items found: ${results.totalFound}`);
					console.log(`      Valid items: ${results.validItems}`);
					console.log(`      Items returned: ${results.items.length}`);

					// Show sample items
					if (results.items.length > 0) {
						console.log(`   📋 Sample items:`);
						results.items.slice(0, 3).forEach((item, index) => {
							console.log(`      ${index + 1}. ${item.websiteName || 'Untitled'}`);
							console.log(`         URL: ${item.detailUrl}`);
							console.log(`         Thumbnail: ${item.thumbnailUrl ? '✅' : '❌'}`);
						});
					}
				} else {
					console.log(`   ❌ Scraping failed: ${results.error}`);
				}

				// Only test first URL in detail to save time
				if (i === 0) {
					break;
				}

			} catch (error) {
				console.log(`   ❌ Error testing ${testUrl}: ${error.message}`);
			}
		}

		console.log('\n✅ Direct URL and lazy loading test completed!');

	} catch (error) {
		console.error('❌ Test failed:', error.message);
		console.error(error.stack);
	} finally {
		// Clean up
		await scraper.close();
	}
}

// Test the lazy loading method in isolation
async function testLazyLoadingOnly() {
	console.log('\n🧪 Testing Lazy Loading in Isolation\n');

	const scraper = new LandBookScraper({
		headless: false,
		maxItems: 100
	});

	try {
		await scraper.initialize();

		// Navigate to a basic Land-book page
		const urlInfo = {
			originalUrl: 'https://land-book.com/websites',
			pageType: 'gallery',
			params: {}
		};

		await scraper.navigateToUrl(urlInfo);

		// Count initial items
		const initialCount = await scraper.page.evaluate(() => {
			const items = document.querySelectorAll('.website-item-wrapper, .website-item, [data-website-id], a[href*="/website/"]');
			return items.length;
		});

		console.log(`📊 Initial item count: ${initialCount}`);

		// Trigger lazy loading
		const loadCount = await scraper.triggerLazyLoading(4);

		// Count final items
		const finalCount = await scraper.page.evaluate(() => {
			const items = document.querySelectorAll('.website-item-wrapper, .website-item, [data-website-id], a[href*="/website/"]');
			return items.length;
		});

		console.log(`📊 Final item count: ${finalCount}`);
		console.log(`📈 Items loaded: ${finalCount - initialCount}`);
		console.log(`🔄 Successful loads: ${loadCount}`);

	} catch (error) {
		console.error('❌ Lazy loading test failed:', error.message);
	} finally {
		await scraper.close();
	}
}

// Run the tests
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.includes('--lazy-only')) {
		testLazyLoadingOnly().catch(error => {
			console.error('Test execution failed:', error);
			process.exit(1);
		});
	} else {
		testDirectUrlAndLazyLoading().catch(error => {
			console.error('Test execution failed:', error);
			process.exit(1);
		});
	}
}

module.exports = { testDirectUrlAndLazyLoading, testLazyLoadingOnly };