const LandBookScraper = require('./scraper.js');

async function testAdExclusion() {
	console.log('🧪 Testing advertisement exclusion...');

	const scraper = new LandBookScraper({
		headless: true,
		slowMo: 50,
		maxItems: 10
	});

	try {
		console.log('🚀 Initializing scraper...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			console.error('❌ Failed to initialize scraper');
			return;
		}

		console.log('🔍 Navigating to health-and-fitness category...');
		const urlInfo = {
			originalUrl: 'https://land-book.com/gallery/health-and-fitness?filters[]=light-colors',
			pageType: 'gallery',
			params: {
				category: 'health-and-fitness',
				filters: ['light-colors']
			}
		};
		const navigated = await scraper.navigateToUrl(urlInfo);
		if (!navigated) {
			console.error('❌ Failed to navigate to category');
			return;
		}

		console.log('🕷️  Testing grid scraping with ad exclusion...');
		const gridResults = await scraper.scrapeGridPage();

		if (gridResults.success) {
			console.log(`✅ Grid scraping successful!`);
			console.log(`📊 Total items found: ${gridResults.totalFound}`);
			console.log(`📊 Valid items (after filtering): ${gridResults.validItems}`);
			console.log(`📊 Items with errors: ${gridResults.errorItems}`);
			console.log(`📊 Final scraped items: ${gridResults.items.length}`);

			// Check if any ads were detected and excluded
			const hasAdExclusion = gridResults.totalFound > gridResults.validItems;
			if (hasAdExclusion) {
				console.log('🚫 Advertisement exclusion working - some items were filtered out');
			} else {
				console.log('ℹ️  No advertisements detected on this page');
			}

			// Show sample items
			if (gridResults.items.length > 0) {
				console.log('\n📋 Sample scraped items (first 3):');
				gridResults.items.slice(0, 3).forEach((item, index) => {
					console.log(`   ${index + 1}. ${item.title || 'Untitled'}`);
					console.log(`      Has thumbnail: ${!!item.thumbnailUrl}`);
					console.log(`      Has detail URL: ${!!item.detailUrl}`);
				});
			}
		} else {
			console.error('❌ Grid scraping failed:', gridResults.error);
		}

	} catch (error) {
		console.error('❌ Test failed:', error.message);
	} finally {
		await scraper.close();
		console.log('✅ Test completed');
	}
}

testAdExclusion().catch(console.error);