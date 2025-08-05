#!/usr/bin/env node

/**
 * Debug script for lazy loading functionality
 * Tests why lazy loading isn't being triggered
 */

const LandBookScraper = require('./scraper.js');

async function debugLazyLoading() {
	console.log('🐛 Debugging Lazy Loading Functionality\n');

	const scraper = new LandBookScraper({
		headless: false, // Show browser for debugging
		maxItems: 50, // Should trigger lazy loading
		downloadImages: false
	});

	try {
		// Initialize scraper
		console.log('1. Initializing scraper...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			throw new Error('Failed to initialize scraper');
		}

		// Navigate to the test URL
		const testUrl = 'https://land-book.com/?search=life+coach';
		console.log(`\n2. Navigating to: ${testUrl}`);

		const urlInfo = {
			originalUrl: testUrl,
			pageType: 'gallery',
			params: {}
		};

		const navigated = await scraper.navigateToUrl(urlInfo);
		if (!navigated) {
			throw new Error('Failed to navigate');
		}

		console.log('✅ Successfully navigated');

		// Check maxItems calculation
		console.log(`\n3. Checking lazy loading calculation:`);
		console.log(`   maxItems: ${scraper.options.maxItems}`);
		const maxLoads = Math.ceil(scraper.options.maxItems / 20) - 1;
		console.log(`   maxLoads calculation: Math.ceil(${scraper.options.maxItems} / 20) - 1 = ${maxLoads}`);

		if (maxLoads > 0) {
			console.log(`   ✅ Should trigger ${maxLoads} lazy loads`);
		} else {
			console.log(`   ❌ No lazy loading will be triggered (maxLoads = ${maxLoads})`);
		}

		// Wait for initial content
		console.log(`\n4. Waiting for initial content...`);
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Count initial items
		const initialCount = await scraper.page.evaluate(() => {
			const items = document.querySelectorAll('.website-item-wrapper, .website-item, [data-website-id], a[href*="/website/"]');
			console.log(`Found ${items.length} initial items`);
			return items.length;
		});

		console.log(`   Initial item count: ${initialCount}`);

		// Check for pagination elements
		const paginationInfo = await scraper.page.evaluate(() => {
			const paginationElement = document.querySelector('[data-pagination]');
			const loadingText = document.querySelector('[data-pagination-is-loading-txt]');
			const loadMoreBtn = document.querySelector('[data-pagination-load-more-btn]');
			const paginationCta = document.querySelector('.pagination-load-cta');

			return {
				hasPagination: !!paginationElement,
				hasLoadingText: !!loadingText,
				hasLoadMoreBtn: !!loadMoreBtn,
				hasPaginationCta: !!paginationCta,
				paginationHTML: paginationElement ? paginationElement.outerHTML : null,
				loadingTextVisible: loadingText ? loadingText.offsetParent !== null : false,
				loadMoreBtnVisible: loadMoreBtn ? loadMoreBtn.offsetParent !== null : false
			};
		});

		console.log(`\n5. Pagination element analysis:`);
		console.log(`   Has [data-pagination]: ${paginationInfo.hasPagination}`);
		console.log(`   Has loading text: ${paginationInfo.hasLoadingText}`);
		console.log(`   Has load more button: ${paginationInfo.hasLoadMoreBtn}`);
		console.log(`   Has pagination CTA: ${paginationInfo.hasPaginationCta}`);
		console.log(`   Loading text visible: ${paginationInfo.loadingTextVisible}`);
		console.log(`   Load more button visible: ${paginationInfo.loadMoreBtnVisible}`);

		if (paginationInfo.paginationHTML) {
			console.log(`   Pagination HTML: ${paginationInfo.paginationHTML.substring(0, 200)}...`);
		}

		// Test lazy loading manually
		if (maxLoads > 0) {
			console.log(`\n6. Testing lazy loading manually...`);
			const loadCount = await scraper.triggerLazyLoading(1); // Just test 1 load
			console.log(`   Lazy loading result: ${loadCount} successful loads`);

			// Count final items
			const finalCount = await scraper.page.evaluate(() => {
				const items = document.querySelectorAll('.website-item-wrapper, .website-item, [data-website-id], a[href*="/website/"]');
				return items.length;
			});

			console.log(`   Final item count: ${finalCount}`);
			console.log(`   Items loaded: ${finalCount - initialCount}`);
		}

		console.log('\n✅ Debug completed! Check the browser window for visual inspection.');
		console.log('Press Ctrl+C to exit when ready.');

		// Keep browser open for manual inspection
		await new Promise(resolve => {
			process.on('SIGINT', () => {
				console.log('\n🔄 Closing browser...');
				resolve();
			});
		});

	} catch (error) {
		console.error('❌ Debug failed:', error.message);
		console.error(error.stack);
	} finally {
		// Clean up
		await scraper.close();
	}
}

// Run the debug
if (require.main === module) {
	debugLazyLoading().catch(error => {
		console.error('Debug execution failed:', error);
		process.exit(1);
	});
}

module.exports = { debugLazyLoading };